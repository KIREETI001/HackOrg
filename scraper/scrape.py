"""
Daily competition / hackathon scanner.
Pulls candidate events from public sources, structures each with OpenAI,
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
from openai import OpenAI

# ────────────────────────────────────────────────────────────
# Config
# ────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)

EVENTS_PATH = DATA_DIR / "events.json"
META_PATH = DATA_DIR / "meta.json"

OPENAI_MODEL = "gpt-4o-mini"  # fast + cheap for extraction
MAX_NEW_PER_RUN = 40           # raised to handle broader source coverage
PAGE_FETCH_TIMEOUT = 15

USER_AGENT = (
    "Mozilla/5.0 (compatible; CompetitionScanner/1.0; "
    "+https://github.com/yourusername/scanner)"
)

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])


# ────────────────────────────────────────────────────────────
# Sources
# Each function returns a list of {"name": str, "url": str} candidates.
# All failures are caught and logged — a broken source never kills the run.
# ────────────────────────────────────────────────────────────

# ── Devpost ──────────────────────────────────────────────────

def candidates_devpost_singapore():
    """Devpost JSON API — Singapore hackathons."""
    out = []
    try:
        r = requests.get(
            "https://devpost.com/api/hackathons",
            params={"search": "singapore", "status[]": ["upcoming", "open"]},
            headers={"User-Agent": USER_AGENT},
            timeout=PAGE_FETCH_TIMEOUT,
        )
        for h in r.json().get("hackathons", []):
            out.append({"name": h.get("title", ""), "url": h.get("url", "")})
    except Exception as e:
        print(f"  ! devpost-sg failed: {e}")
    return out


def candidates_devpost_global_ai():
    """Devpost JSON API — global AI hackathons."""
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


def candidates_devpost_asean():
    """Devpost JSON API — ASEAN / Southeast Asia hackathons."""
    out = []
    try:
        for term in ["asean", "southeast asia", "asia pacific"]:
            r = requests.get(
                "https://devpost.com/api/hackathons",
                params={"search": term, "status[]": ["upcoming", "open"]},
                headers={"User-Agent": USER_AGENT},
                timeout=PAGE_FETCH_TIMEOUT,
            )
            for h in r.json().get("hackathons", [])[:15]:
                out.append({"name": h.get("title", ""), "url": h.get("url", "")})
    except Exception as e:
        print(f"  ! devpost-asean failed: {e}")
    return out


# ── Luma ─────────────────────────────────────────────────────

def _luma_extract_next_data(soup) -> list:
    """Pull event stubs from Luma's embedded __NEXT_DATA__ JSON blob."""
    out = []
    script = soup.find("script", {"id": "__NEXT_DATA__"})
    if not script:
        return out
    try:
        data = json.loads(script.string)
        pp = data.get("props", {}).get("pageProps", {})
        events = (
            pp.get("initialData", {}).get("events", [])
            or pp.get("events", [])
            or pp.get("data", {}).get("events", [])
        )
        for ev in events:
            event = ev.get("event", ev)
            name = event.get("name", "")
            slug = event.get("url") or event.get("slug", "")
            if name and slug:
                href = f"https://lu.ma/{slug}" if not slug.startswith("http") else slug
                out.append({"name": name, "url": href})
    except Exception:
        pass
    return out


def candidates_luma_singapore():
    """Luma Singapore city page — hackathons and tech events."""
    out = []
    for url in ["https://lu.ma/singapore", "https://lu.ma/singapore?tag=hackathon"]:
        try:
            r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=PAGE_FETCH_TIMEOUT)
            soup = BeautifulSoup(r.text, "html.parser")
            out.extend(_luma_extract_next_data(soup))
            # Fallback: scrape anchor tags
            for a in soup.select("a[href^='/e/'], a[href*='lu.ma/e/']"):
                href = str(str(a.get("href", "") or "") or "")
                if not href.startswith("http"):
                    href = "https://lu.ma" + href
                name = a.get_text(strip=True)
                if name and len(name) > 5:
                    out.append({"name": name, "url": href})
        except Exception as e:
            print(f"  ! luma-singapore ({url}) failed: {e}")
    return out


def candidates_luma_hackathons():
    """Luma discover — keyword search for hackathon events."""
    out = []
    for query in ["hackathon singapore", "hackathon"]:
        try:
            r = requests.get(
                "https://lu.ma/discover",
                params={"query": query},
                headers={"User-Agent": USER_AGENT},
                timeout=PAGE_FETCH_TIMEOUT,
            )
            soup = BeautifulSoup(r.text, "html.parser")
            out.extend(_luma_extract_next_data(soup))
            for a in soup.select("a[href^='/e/'], a[href*='lu.ma/e/']"):
                href = str(str(a.get("href", "") or "") or "")
                if not href.startswith("http"):
                    href = "https://lu.ma" + href
                name = a.get_text(strip=True)
                if name and len(name) > 5:
                    out.append({"name": name, "url": href})
        except Exception as e:
            print(f"  ! luma-discover ({query}) failed: {e}")
    return out


# ── MLH ──────────────────────────────────────────────────────

def candidates_mlh():
    """Major League Hacking — current and next season events."""
    out = []
    year = datetime.now().year
    for y in [year, year + 1]:
        try:
            r = requests.get(
                f"https://mlh.io/seasons/{y}/events",
                headers={"User-Agent": USER_AGENT},
                timeout=PAGE_FETCH_TIMEOUT,
            )
            soup = BeautifulSoup(r.text, "html.parser")
            for event in soup.select(".event-wrapper, .event"):
                a = event.select_one("a[href]")
                name_el = event.select_one(".event-name, h3, .name")
                if a:
                    href = str(a.get("href", "") or "")
                    name = name_el.get_text(strip=True) if name_el else a.get_text(strip=True)
                    if href.startswith("http") and name:
                        out.append({"name": name, "url": href})
        except Exception as e:
            print(f"  ! mlh ({y}) failed: {e}")
    return out


# ── HackerEarth ──────────────────────────────────────────────

def candidates_hackerearth():
    """HackerEarth hackathon listings — global + Singapore filter."""
    out = []
    urls = [
        "https://www.hackerearth.com/challenges/hackathon/",
        "https://www.hackerearth.com/challenges/hackathon/?location=Singapore",
    ]
    for url in urls:
        try:
            r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=PAGE_FETCH_TIMEOUT)
            soup = BeautifulSoup(r.text, "html.parser")
            for a in soup.select("a.challenge-card-wrapper, a[href*='/hackathon/']"):
                href = str(a.get("href", "") or "")
                if not href.startswith("http"):
                    href = "https://www.hackerearth.com" + href
                name = a.get_text(strip=True)[:100]
                if href and "/hackathon/" in href and name and len(name) > 5:
                    out.append({"name": name, "url": href})
        except Exception as e:
            print(f"  ! hackerearth failed: {e}")
    return out


# ── Eventbrite ───────────────────────────────────────────────

def candidates_eventbrite_sg():
    """Eventbrite Singapore — hackathon and coding competition events."""
    out = []
    urls = [
        "https://www.eventbrite.sg/d/singapore--singapore/hackathon/",
        "https://www.eventbrite.sg/d/singapore--singapore/coding-competition/",
        "https://www.eventbrite.sg/d/singapore--singapore/tech-hackathon/",
    ]
    for url in urls:
        try:
            r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=PAGE_FETCH_TIMEOUT)
            soup = BeautifulSoup(r.text, "html.parser")
            # JSON-LD structured data (most reliable when present)
            for script in soup.select('script[type="application/ld+json"]'):
                try:
                    data = json.loads(script.string or "")
                    items = data if isinstance(data, list) else [data]
                    for item in items:
                        if item.get("@type") in ("Event", "Hackathon"):
                            name = item.get("name", "")
                            href = item.get("url", "")
                            if name and href:
                                out.append({"name": name, "url": href.split("?")[0]})
                except Exception:
                    pass
            # Fallback: anchor tags
            for a in soup.select("a[href*='eventbrite.sg/e/'], a[href*='eventbrite.com/e/']"):
                href = str(a.get("href", "") or "").split("?")[0]
                name = a.get_text(strip=True)
                if href and name and len(name) > 5:
                    out.append({"name": name, "url": href})
        except Exception as e:
            print(f"  ! eventbrite failed: {e}")
    return out


# ── dev.events / SGInnovate ───────────────────────────────────

def candidates_dev_events_singapore():
    """dev.events — Singapore hackathon listings."""
    out = []
    try:
        r = requests.get(
            "https://dev.events/hackathons/AS/SG",
            headers={"User-Agent": USER_AGENT},
            timeout=PAGE_FETCH_TIMEOUT,
        )
        soup = BeautifulSoup(r.text, "html.parser")
        for a in soup.select("a[href*='/event/']")[:30]:
            href = str(a.get("href", "") or "")
            if not href.startswith("http"):
                href = "https://dev.events" + href
            name = a.get_text(strip=True)
            if name and len(name) > 5:
                out.append({"name": name, "url": href})
    except Exception as e:
        print(f"  ! dev.events failed: {e}")
    return out


def candidates_sginnovate():
    """SGInnovate event listing."""
    out = []
    try:
        r = requests.get(
            "https://www.sginnovate.com/events",
            headers={"User-Agent": USER_AGENT},
            timeout=PAGE_FETCH_TIMEOUT,
        )
        soup = BeautifulSoup(r.text, "html.parser")
        for a in soup.select("a[href*='/event/']")[:20]:
            href = str(a.get("href", "") or "")
            if not href.startswith("http"):
                href = "https://www.sginnovate.com" + href
            name = a.get_text(strip=True)
            if name and len(name) > 5:
                out.append({"name": name, "url": href})
    except Exception as e:
        print(f"  ! sginnovate failed: {e}")
    return out


# ── Singapore Government & Academic ──────────────────────────

def candidates_govtech_sg():
    """GovTech Singapore — Build for Good, Hackathon.sg, and tech.gov.sg events."""
    out = []
    # Known GovTech hackathon portals — check the page itself as a candidate
    known = [
        ("Build for Good", "https://www.build.gov.sg/"),
        ("Hack for Public Good", "https://hack.gov.sg/"),
        ("GovTech Hackathon", "https://www.tech.gov.sg/our-digital-government-efforts/hackathon/"),
    ]
    for name, url in known:
        try:
            r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=PAGE_FETCH_TIMEOUT)
            soup = BeautifulSoup(r.text, "html.parser")
            title = soup.select_one("h1, title")
            out.append({"name": title.get_text(strip=True) if title else name, "url": url})
        except Exception:
            out.append({"name": name, "url": url})

    # Also scrape the general events listing
    try:
        r = requests.get(
            "https://www.tech.gov.sg/media/events/",
            headers={"User-Agent": USER_AGENT},
            timeout=PAGE_FETCH_TIMEOUT,
        )
        soup = BeautifulSoup(r.text, "html.parser")
        for a in soup.select("a[href*='/events/']")[:20]:
            href = str(a.get("href", "") or "")
            if not href.startswith("http"):
                href = "https://www.tech.gov.sg" + href
            name = a.get_text(strip=True)
            if name and len(name) > 5 and href != "https://www.tech.gov.sg/media/events/":
                out.append({"name": name, "url": href})
    except Exception as e:
        print(f"  ! govtech events page failed: {e}")

    return out


def candidates_imda_sg():
    """IMDA Singapore — competitions and digital events."""
    out = []
    pages = [
        "https://www.imda.gov.sg/events",
        "https://www.imda.gov.sg/programme-listing/",
    ]
    for url in pages:
        try:
            r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=PAGE_FETCH_TIMEOUT)
            soup = BeautifulSoup(r.text, "html.parser")
            for a in soup.select("a[href*='/events/'], a[href*='/programme-listing/']")[:20]:
                href = str(a.get("href", "") or "")
                if not href.startswith("http"):
                    href = "https://www.imda.gov.sg" + href
                name = a.get_text(strip=True)
                if name and len(name) > 5 and href not in pages:
                    out.append({"name": name, "url": href})
        except Exception as e:
            print(f"  ! imda ({url}) failed: {e}")
    return out


def candidates_nushackers():
    """NUS Hackers — HackNRoll, LifeHack, Friday Hacks and other NUS events."""
    out = []
    pages = [
        ("https://nushackers.org/events", "a[href]", "https://nushackers.org"),
        ("https://hacknroll.nushackers.org/", "a[href]", ""),
        ("https://lifehack.nushackers.org/", "a[href]", ""),
    ]
    for url, selector, base in pages:
        try:
            r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=PAGE_FETCH_TIMEOUT)
            soup = BeautifulSoup(r.text, "html.parser")
            title = soup.select_one("h1, title")
            out.append({"name": title.get_text(strip=True) if title else url, "url": url})
            # Pick up any sub-event links on the page
            for a in soup.select(selector)[:10]:
                href = str(a.get("href", "") or "")
                if href.startswith("/"):
                    href = base + href
                name = a.get_text(strip=True)
                if href.startswith("http") and name and len(name) > 5 and href != url:
                    out.append({"name": name, "url": href})
        except Exception as e:
            print(f"  ! nushackers ({url}) failed: {e}")
    return out


def candidates_astar():
    """A*STAR — research competitions, graduate fellowships, and STEM challenges."""
    out = []
    try:
        r = requests.get(
            "https://www.a-star.edu.sg/news-and-events/events",
            headers={"User-Agent": USER_AGENT},
            timeout=PAGE_FETCH_TIMEOUT,
        )
        soup = BeautifulSoup(r.text, "html.parser")
        for a in soup.select("a[href*='/events'], a[href*='/scholarship'], a[href*='/competition']")[:20]:
            href = str(a.get("href", "") or "")
            if not href.startswith("http"):
                href = "https://www.a-star.edu.sg" + href
            name = a.get_text(strip=True)
            if name and len(name) > 5:
                out.append({"name": name, "url": href})
    except Exception as e:
        print(f"  ! a-star failed: {e}")
    return out


# ── Big Tech & Local SG Companies ────────────────────────────

def candidates_curated_big_tech():
    """
    Curated annual hackathon pages from major tech companies.
    These are scraped as candidates every run; the AI determines
    whether the current edition is upcoming, ongoing, or completed.
    URLs that stay stable year-to-year (e.g. imaginecup.microsoft.com)
    will be re-processed only if they fall out of seen_urls (e.g. URL changes).
    """
    entries = [
        # Global big tech
        ("Microsoft Imagine Cup",             "https://imaginecup.microsoft.com/en-us"),
        ("Google GDSC Solution Challenge",    "https://developers.google.com/community/gdsc-solution-challenge"),
        ("Google Cloud Next Hackathon",       "https://cloud.google.com/blog/topics/google-cloud-next"),
        ("Meta Hacker Cup",                   "https://www.facebook.com/codingcompetitions/hacker-cup/"),
        ("AWS Build On Hackathon",            "https://aws.amazon.com/events/asean/"),
        ("Apple Swift Student Challenge",     "https://developer.apple.com/wwdc/swift-student-challenge/"),
        ("ByteDance Young Innovators",        "https://jobs.bytedance.com/campus/hackathon"),
        ("TikTok TechJam",                    "https://careers.tiktok.com/event/techjam"),
        ("GitHub Hackathon",                  "https://github.blog/category/community/hackathon/"),
        # Singapore-headquartered / major SG presence
        ("Shopee Code League",                "https://careers.shopee.sg/codeleague/"),
        ("Grab Hackathon",                    "https://engineering.grab.com/"),
        ("Sea x OpenAI Hackathon",            "https://sea.com/hackathon"),
        ("Singtel Hackathon",                 "https://www.singtel.com/about-us/careers/hackathon"),
        ("DBS HackToTheFuture",               "https://www.dbs.com/livemore/community/hackathon.page"),
        ("OCBC Hackathon",                    "https://www.ocbc.com/group/careers/hackathon.page"),
        ("NCS Spark IT Challenge",            "https://www.ncs.co/sparkitchallenge/"),
        # Academic competitions (Singapore)
        ("NOI Singapore",                     "https://noisg.comp.nus.edu.sg/noi/"),
        ("Cyberthon",                         "https://cyberthon.hci.edu.sg/"),
        ("SMU Hackathon",                     "https://scis.smu.edu.sg/events"),
        ("NTU Innovation Challenge",          "https://www.ntu.edu.sg/news-events"),
    ]
    out = []
    for name, url in entries:
        try:
            r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=PAGE_FETCH_TIMEOUT)
            soup = BeautifulSoup(r.text, "html.parser")
            h1 = soup.select_one("h1")
            resolved_name = h1.get_text(strip=True) if h1 else name
            out.append({"name": resolved_name or name, "url": url})
        except Exception:
            # Network error — still add the URL so it surfaces as a candidate
            out.append({"name": name, "url": url})
    return out


# ────────────────────────────────────────────────────────────
# Source registry
# ────────────────────────────────────────────────────────────

SOURCES = [
    # Platforms with wide discovery
    ("Devpost — Singapore",          candidates_devpost_singapore),
    ("Devpost — Global AI",          candidates_devpost_global_ai),
    ("Devpost — ASEAN",              candidates_devpost_asean),
    ("Luma — Singapore",             candidates_luma_singapore),
    ("Luma — Hackathon search",      candidates_luma_hackathons),
    ("MLH",                          candidates_mlh),
    ("HackerEarth",                  candidates_hackerearth),
    ("Eventbrite SG",                candidates_eventbrite_sg),
    ("dev.events — Singapore",       candidates_dev_events_singapore),
    # Singapore-focused institutional
    ("SGInnovate",                   candidates_sginnovate),
    ("GovTech SG",                   candidates_govtech_sg),
    ("IMDA SG",                      candidates_imda_sg),
    ("NUS Hackers",                  candidates_nushackers),
    ("A*STAR",                       candidates_astar),
    # Curated big tech + local SG companies (annual events)
    ("Curated — Big Tech & SG Orgs", candidates_curated_big_tech),
]


# ────────────────────────────────────────────────────────────
# OpenAI-powered extraction
# ────────────────────────────────────────────────────────────

EXTRACTION_PROMPT = """You are extracting structured data about a competition,
hackathon, accelerator, fellowship, or olympiad from a web page.

TODAY'S DATE: {today}

Return ONLY a JSON object (no markdown, no commentary) with EXACTLY these fields:

{{
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
}}

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
- If the page is not actually about a competition/hackathon/accelerator/fellowship/olympiad, return: {{"skip": true, "reason": "..."}}.

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
    for tag in soup(["script", "style", "noscript", "nav", "footer"]):
        tag.decompose()
    text = soup.get_text(" ", strip=True)
    text = re.sub(r"\s+", " ", text)
    return text[:10000]  # cap to control cost


def structure_event(name: str, url: str) -> dict | None:
    """Returns a structured event dict or None if the model says skip."""
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
        resp = client.chat.completions.create(
            model=OPENAI_MODEL,
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = resp.choices[0].message.content.strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            raw = raw.removeprefix("json").strip()

        parsed = json.loads(raw)
        if parsed.get("skip"):
            print(f"    skipped: {parsed.get('reason', 'no reason')}")
            return None

        parsed["url"] = url
        parsed["id"] = hash_id(url, parsed.get("name", name))
        parsed["last_checked"] = datetime.now(timezone.utc).isoformat()

        parsed.setdefault("application_deadline", None)
        parsed.setdefault("difficulty", "Intermediate")
        parsed.setdefault("cost", "Free")
        parsed.setdefault("prize_value_usd", None)
        parsed.setdefault("beginner_friendly", False)
        parsed.setdefault("application_url", url)
        parsed.setdefault("tags", [])

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
        print(f"    API call failed: {e}")
        return None


def hash_id(url: str, name: str) -> str:
    return hashlib.sha1(f"{url}::{name}".encode()).hexdigest()[:12]


# ────────────────────────────────────────────────────────────
# Validation
# ────────────────────────────────────────────────────────────

REQUIRED_FIELDS = ("id", "name", "url", "organizer")
ALLOWED_STATUS = {"ongoing", "upcoming", "completed"}


def validate_event(ev: dict) -> list[str]:
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
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    tmp.replace(path)


def write_meta(*, total: int, new: int, failed: bool, error: str = "") -> None:
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

    if EVENTS_PATH.exists():
        with EVENTS_PATH.open(encoding="utf-8") as f:
            existing = json.load(f)
    else:
        existing = []

    seen_urls = {e.get("url") for e in existing}
    print(f"Loaded {len(existing)} existing events\n")

    try:
        candidates = []
        for source_name, fn in SOURCES:
            print(f"→ {source_name}")
            found = fn()
            new = [c for c in found if c.get("url") and c["url"] not in seen_urls]
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

        all_events = existing + new_events

        invalid = sum(1 for e in all_events if validate_event(e))
        if invalid > len(all_events) * 0.10:
            raise RuntimeError(f"{invalid}/{len(all_events)} events failed validation — refusing to write")

        atomic_write_json(EVENTS_PATH, all_events)
        write_meta(total=len(all_events), new=len(new_events), failed=False)
        print(f"\n=== Done. {len(all_events)} total events ({len(new_events)} new this run) ===")

    except Exception as e:
        write_meta(total=len(existing), new=0, failed=True, error=str(e))
        print(f"\n!!! SWEEP FAILED: {e}", flush=True)
        raise


if __name__ == "__main__":
    main()
