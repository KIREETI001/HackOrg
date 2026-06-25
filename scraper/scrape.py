"""
Daily competition / hackathon scanner.
Pulls candidate events from public sources, structures each with Claude,
deduplicates, and writes data/events.json.

Run locally:  python scraper/scrape.py
Run in CI:    triggered by .github/workflows/daily-scan.yml
"""

import os
import re
import json
import hashlib
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from anthropic import Anthropic

# ────────────────────────────────────────────────────────────
# Config
# ────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)

EVENTS_PATH = DATA_DIR / "events.json"
META_PATH = DATA_DIR / "meta.json"

CLAUDE_MODEL = "claude-haiku-4-5-20251001"  # fast + cheap for extraction
MAX_NEW_PER_RUN = 15                         # cap to keep API cost predictable
PAGE_FETCH_TIMEOUT = 15

USER_AGENT = (
    "Mozilla/5.0 (compatible; CompetitionScanner/1.0; "
    "+https://github.com/yourusername/scanner)"
)

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


# ────────────────────────────────────────────────────────────
# Sources — add or remove as you like.
# Each function returns a list of {"name": str, "url": str} candidates.
# ────────────────────────────────────────────────────────────

def candidates_devpost_singapore():
    """Devpost has a JSON API for hackathons with location + status filters."""
    out = []
    try:
        r = requests.get(
            "https://devpost.com/api/hackathons",
            params={
                "search": "singapore",
                "status[]": ["upcoming", "open"],
            },
            headers={"User-Agent": USER_AGENT},
            timeout=PAGE_FETCH_TIMEOUT,
        )
        for h in r.json().get("hackathons", []):
            out.append({"name": h.get("title", ""), "url": h.get("url", "")})
    except Exception as e:
        print(f"  ! devpost-sg failed: {e}")
    return out


def candidates_devpost_global_ai():
    out = []
    try:
        r = requests.get(
            "https://devpost.com/api/hackathons",
            params={"search": "AI", "status[]": ["upcoming", "open"]},
            headers={"User-Agent": USER_AGENT},
            timeout=PAGE_FETCH_TIMEOUT,
        )
        for h in r.json().get("hackathons", [])[:20]:
            out.append({"name": h.get("title", ""), "url": h.get("url", "")})
    except Exception as e:
        print(f"  ! devpost-global failed: {e}")
    return out


def candidates_dev_events_singapore():
    """dev.events lists hackathons by location. Plain HTML scrape."""
    out = []
    try:
        r = requests.get(
            "https://dev.events/hackathons/AS/SG",
            headers={"User-Agent": USER_AGENT},
            timeout=PAGE_FETCH_TIMEOUT,
        )
        soup = BeautifulSoup(r.text, "html.parser")
        for a in soup.select("a[href*='/event/']")[:30]:
            href = a.get("href", "")
            if not href.startswith("http"):
                href = "https://dev.events" + href
            name = a.get_text(strip=True)
            if name and len(name) > 5:
                out.append({"name": name, "url": href})
    except Exception as e:
        print(f"  ! dev.events failed: {e}")
    return out


def candidates_sginnovate():
    """SGInnovate event listing (Singapore innovation events)."""
    out = []
    try:
        r = requests.get(
            "https://www.sginnovate.com/events",
            headers={"User-Agent": USER_AGENT},
            timeout=PAGE_FETCH_TIMEOUT,
        )
        soup = BeautifulSoup(r.text, "html.parser")
        for a in soup.select("a[href*='/event/']")[:20]:
            href = a.get("href", "")
            if not href.startswith("http"):
                href = "https://www.sginnovate.com" + href
            name = a.get_text(strip=True)
            if name and len(name) > 5:
                out.append({"name": name, "url": href})
    except Exception as e:
        print(f"  ! sginnovate failed: {e}")
    return out


SOURCES = [
    ("Devpost — Singapore",      candidates_devpost_singapore),
    ("Devpost — Global AI",      candidates_devpost_global_ai),
    ("dev.events — Singapore",   candidates_dev_events_singapore),
    ("SGInnovate",               candidates_sginnovate),
    # Add more here. Some good ones to integrate later:
    #   - hackerearth.com/hackathon/explore/city/singapore
    #   - science.edu.sg/for-schools/competitions
    #   - ntu.edu.sg events listings
    #   - mlh.io (Major League Hacking)
]


# ────────────────────────────────────────────────────────────
# Claude-powered extraction
# ────────────────────────────────────────────────────────────

EXTRACTION_PROMPT = """You are extracting structured data about a competition,
hackathon, accelerator, fellowship, or olympiad from a web page.

TODAY'S DATE: {today}

Return ONLY a JSON object (no markdown, no commentary) with EXACTLY these fields:

{
  "name": "Official event name",
  "organizer": "Primary organizer (one entity)",
  "companies": ["List", "of", "sponsoring/partnering companies"],
  "level": "ONE OF: Primary, Secondary, Pre-University, Tertiary, Open / Professional",
  "timeline": "ONE OF: Single-day, Multi-day (4-7d), Multi-week (1-3mo), Multi-month (3-6mo), Annual / ongoing",
  "scope": "ONE OF: Local (Singapore), Regional (Asia), Global",
  "domains": ["List from: Computer Science, Sciences (STEM), Mathematics, Business / Economics, Humanities"],
  "fields": ["List from: AI / Machine Learning, Cybersecurity, FinTech, Web3 / Blockchain, Sustainability, Healthcare, General Tech"],
  "status": "ONE OF: ongoing, upcoming, completed (relative to TODAY'S DATE above)",
  "date": "Human-readable date string, e.g. '9-11 June 2026' or 'Annual'",
  "location": "City, venue if specified",
  "prize": "Prize summary (one sentence)",
  "summary": "3-4 sentences. Synthesize, don't copy. Capture what makes this event distinctive.",
  "eligibility": "One sentence on who can join",
  "highlights": ["4 short bullets on why this stands out"],

  "application_deadline": "ISO date string YYYY-MM-DD if a clear application deadline exists, else null",
  "difficulty": "ONE OF: Beginner-Friendly (first-timers welcome, no exp required), Intermediate (some technical exp expected), Advanced (serious technical skills required), Elite/Selective (top-tier, application/invite-based)",
  "cost": "ONE OF: Free, Paid, Varies",
  "prize_value_usd": "Approximate USD value as a NUMBER (no $ sign, no string), or null if unclear. Estimate from prize description if needed.",
  "beginner_friendly": true_or_false_BOOLEAN,
  "application_url": "Direct application URL if different from main URL, else null (the scraper will fall back to main URL)",
  "tags": ["3-6 short keyword tags like 'singapore', 'ai', 'student-run', 'web3', 'beginner-friendly', etc."]
}

Status rules (relative to TODAY'S DATE above):
- "ongoing" — event is currently running, registration is open, or it's a rolling/continuous program.
- "upcoming" — event start date is in the future and registration may or may not be open yet.
- "completed" — event end date is in the past, or application deadline has passed and it's a one-shot event.

Difficulty rules:
- Beginner-Friendly: explicitly welcomes first-time hackers; no prior coding/technical exp required; primary/early-secondary olympiads.
- Intermediate: aimed at students with some experience; typical college hackathons.
- Advanced: serious technical skills required; competitive programming; corporate AI hackathons.
- Elite/Selective: invite-only; <10% acceptance; flagship national olympiads; YC/Thiel-tier.

Beginner-friendly = true rules:
- Set true if the page explicitly mentions "beginners welcome", "first-time hackers", "no experience required", "all skill levels", "Best First-Time Hacker prize", or similar.
- Set false if the page emphasizes selectivity, technical bar, or experience requirements.

Cost rules:
- Free = no registration fee, no submission fee.
- Paid = there is a registration or submission fee mentioned.
- Varies = depends on track or location.

Other rules:
- If a field is genuinely unknown, use a sensible default (null where allowed, otherwise the most likely value).
- The summary MUST be original prose, not copied from the page. Synthesize.
- If the page is not actually about a competition/hackathon/accelerator/fellowship/olympiad, return: {"skip": true, "reason": "..."}.

Page URL: {url}

Page content:
{content}
"""


def fetch_page_text(url: str) -> str:
    r = requests.get(
        url,
        headers={"User-Agent": USER_AGENT},
        timeout=PAGE_FETCH_TIMEOUT,
        allow_redirects=True,
    )
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    # Drop noise
    for tag in soup(["script", "style", "noscript", "nav", "footer"]):
        tag.decompose()
    text = soup.get_text(" ", strip=True)
    text = re.sub(r"\s+", " ", text)
    return text[:10000]  # cap input to control cost


def structure_event(name: str, url: str) -> dict | None:
    """Returns a structured event dict or None if Claude says skip."""
    try:
        content = fetch_page_text(url)
    except Exception as e:
        print(f"    fetch failed: {e}")
        return None

    if len(content) < 200:
        print(f"    too thin ({len(content)} chars), skipping")
        return None

    today_str = datetime.now().strftime("%d %B %Y")
    prompt = (
        EXTRACTION_PROMPT
        .replace("{today}", today_str)
        .replace("{url}", url)
        .replace("{content}", content)
    )

    try:
        resp = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = resp.content[0].text.strip()

        # Strip code fence if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            raw = raw.removeprefix("json").strip()

        parsed = json.loads(raw)
        if parsed.get("skip"):
            print(f"    Claude skipped: {parsed.get('reason', 'no reason')}")
            return None

        parsed["url"] = url
        parsed["id"] = hash_id(url, parsed.get("name", name))
        parsed["last_checked"] = datetime.now(timezone.utc).isoformat()

        # Normalize new fields with sensible defaults
        parsed.setdefault("application_deadline", None)
        parsed.setdefault("difficulty", "Intermediate")
        parsed.setdefault("cost", "Free")
        parsed.setdefault("prize_value_usd", None)
        parsed.setdefault("beginner_friendly", False)
        parsed.setdefault("application_url", url)  # fall back to main URL
        parsed.setdefault("tags", [])
        # Coerce types in case the model returned strings for booleans/numbers
        if isinstance(parsed.get("beginner_friendly"), str):
            parsed["beginner_friendly"] = parsed["beginner_friendly"].lower() in ("true", "yes", "1")
        if isinstance(parsed.get("prize_value_usd"), str):
            try:
                parsed["prize_value_usd"] = int(re.sub(r"[^0-9]", "", parsed["prize_value_usd"]) or 0) or None
            except Exception:
                parsed["prize_value_usd"] = None
        return parsed

    except json.JSONDecodeError as e:
        print(f"    JSON parse failed: {e}")
        return None
    except Exception as e:
        print(f"    Claude call failed: {e}")
        return None


def hash_id(url: str, name: str) -> str:
    return hashlib.sha1(f"{url}::{name}".encode()).hexdigest()[:12]


# ────────────────────────────────────────────────────────────
# Validation
# ────────────────────────────────────────────────────────────

REQUIRED_FIELDS = ("id", "name", "url", "organizer")
ALLOWED_STATUS = {"ongoing", "upcoming", "completed"}


def validate_event(ev: dict) -> list[str]:
    """Return list of validation errors (empty = valid)."""
    errors = []
    for f in REQUIRED_FIELDS:
        v = ev.get(f)
        if not v or not isinstance(v, str):
            errors.append(f"missing/invalid required field: {f}")
    if ev.get("status") and ev["status"] not in ALLOWED_STATUS:
        errors.append(f"invalid status: {ev.get('status')}")
    url = ev.get("url", "")
    if url and not (url.startswith("http://") or url.startswith("https://")):
        errors.append(f"url not http(s): {url[:60]}")
    pv = ev.get("prize_value_usd")
    if pv is not None and not isinstance(pv, (int, float)):
        errors.append(f"prize_value_usd not numeric: {type(pv).__name__}")
    return errors


def atomic_write_json(path: Path, data) -> None:
    """Write to .tmp then rename — atomic on POSIX, near-atomic on Windows."""
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    tmp.replace(path)


def write_meta(*, total: int, new: int, failed: bool, error: str = "") -> None:
    """Write meta.json. Always callable, even on failure."""
    meta = {
        "last_sweep": datetime.now().strftime("%d %b %Y").upper(),
        "last_sweep_iso": datetime.now(timezone.utc).isoformat(),
        "total_events": total,
        "new_this_run": new,
        "last_sweep_failed": failed,
    }
    if error:
        meta["last_sweep_error"] = error[:500]
    atomic_write_json(META_PATH, meta)


# ────────────────────────────────────────────────────────────
# Main
# ────────────────────────────────────────────────────────────

def main():
    print(f"=== Daily scan started at {datetime.now().isoformat()} ===\n")

    # Load existing — if this fails the whole repo is broken; let it raise.
    if EVENTS_PATH.exists():
        with EVENTS_PATH.open(encoding="utf-8") as f:
            existing = json.load(f)
    else:
        existing = []

    seen_urls = {e.get("url") for e in existing}
    print(f"Loaded {len(existing)} existing events\n")

    try:
        # Gather candidates from all sources
        candidates = []
        for source_name, fn in SOURCES:
            print(f"→ {source_name}")
            found = fn()
            new = [c for c in found if c["url"] and c["url"] not in seen_urls]
            print(f"  found {len(found)} ({len(new)} new)")
            candidates.extend(new)
            time.sleep(1)

        # Dedupe candidates by URL
        seen = set()
        unique_candidates = []
        for c in candidates:
            if c["url"] in seen:
                continue
            seen.add(c["url"])
            unique_candidates.append(c)

        print(f"\nTotal new candidates: {len(unique_candidates)}")
        to_process = unique_candidates[:MAX_NEW_PER_RUN]
        print(f"Processing {len(to_process)} (capped at {MAX_NEW_PER_RUN})\n")

        # Structure each
        new_events = []
        for i, c in enumerate(to_process, 1):
            print(f"[{i}/{len(to_process)}] {c['name'][:60]}")
            ev = structure_event(c["name"], c["url"])
            if not ev:
                continue
            errs = validate_event(ev)
            if errs:
                print(f"    ✗ validation failed: {'; '.join(errs)}")
                continue
            new_events.append(ev)
            print("    ✓ extracted")
            time.sleep(1)

        # Merge — new events appended, existing kept
        all_events = existing + new_events

        # Sanity check: re-validate the merged set; if too many failures, abort.
        invalid = sum(1 for e in all_events if validate_event(e))
        if invalid > len(all_events) * 0.10:  # >10% invalid = something is very wrong
            raise RuntimeError(f"{invalid}/{len(all_events)} events failed validation — refusing to write")

        # Atomic writes
        atomic_write_json(EVENTS_PATH, all_events)
        write_meta(total=len(all_events), new=len(new_events), failed=False)
        print(f"\n=== Done. {len(all_events)} total events ({len(new_events)} new this run) ===")

    except Exception as e:
        # Always update meta with failure flag so the frontend can show the stale banner.
        write_meta(total=len(existing), new=0, failed=True, error=str(e))
        print(f"\n!!! SWEEP FAILED: {e}", flush=True)
        raise


if __name__ == "__main__":
    main()
