"""One-off: append fresh events from the 2026-05-23 manual extraction sweep."""
import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).parent.parent
EVENTS_PATH = ROOT / "data" / "events.json"
NOW_ISO = datetime.now(timezone.utc).isoformat()


def hash_id(url, name):
    return hashlib.sha1(f"{url}::{name}".encode()).hexdigest()[:12]


def make(url, **fields):
    fields["url"] = url
    fields["id"] = hash_id(url, fields["name"])
    fields["last_checked"] = NOW_ISO
    fields.setdefault("application_url", url)
    return fields


new_events = [
    make(
        url="https://luma.com/kv0kks2a",
        name="Sea x OpenAI Codex Hackathon - Singapore (APAC kickoff)",
        organizer="Sea Group + OpenAI",
        companies=["Sea", "OpenAI", "Shopee", "Garena", "SeaMoney"],
        level="Open / Professional",
        timeline="Single-day",
        scope="Regional (Asia)",
        domains=["Computer Science"],
        fields=["AI / Machine Learning", "General Tech"],
        status="upcoming",
        date="6 June 2026 (registration closes 28 May 2026)",
        location="Shopee Building, 5 Science Park Drive, Singapore 118265",
        prize="US$30K / US$15K / US$5K in OpenAI API credits + ChatGPT Pro subscriptions for top 5 teams",
        summary="Sea (parent of Shopee, Garena, SeaMoney) and OpenAI kick off their first regional Codex hackathon series in Singapore - a one-day live build at Shopee HQ with 150+ developers across three tracks: autonomous and adaptive AI, AI-native products and operations, and deep domain AI. This is not an intro workshop - the brief explicitly asks for builders already shipping production-grade code with AI coding tools. Wider APAC roadshow follows the Singapore kickoff.",
        eligibility="Developers, students, entrepreneurs comfortable using AI coding tools; teams of 3-4, each member applies individually",
        highlights=[
            "First stop of the new Sea x OpenAI APAC Codex hackathon series",
            "US$30K top prize in OpenAI API credits (+ ChatGPT Pro for top 5)",
            "One-day, in-person at Shopee HQ - 150+ builders, 40+ projects",
            "Three live tracks: autonomous AI, AI-native ops, deep-domain AI",
        ],
        application_deadline="2026-05-28",
        difficulty="Advanced",
        cost="Free",
        prize_value_usd=30000,
        beginner_friendly=False,
        tags=["ai", "openai", "codex", "singapore", "sea", "shopee", "advanced", "deadline-soon"],
    ),
    make(
        url="https://xprize.devpost.com/",
        name="Build with Gemini XPRIZE - 90-Day AI Business Challenge",
        organizer="XPRIZE Foundation",
        companies=["XPRIZE", "Google", "Google DeepMind", "Hacker Fund"],
        level="Open / Professional",
        timeline="Multi-month (3-6mo)",
        scope="Global",
        domains=["Computer Science", "Business / Economics"],
        fields=["AI / Machine Learning", "General Tech"],
        status="ongoing",
        date="19 May - 17 August 2026 (live finals 25 September 2026, Los Angeles)",
        location="Online build, finals at Los Angeles",
        prize="US$2,000,000 total: US$500K grand, US$200K 2nd, three US$100K runner-ups, 15 x US$50K runner-ups, 5 x US$50K category prizes",
        summary="XPRIZE's biggest-ever hackathon, announced by Google at I/O 2026: launch a real Gemini-powered business in 90 days, acquire real users, and generate real revenue. Five categories cover Education & Human Potential, Entrepreneurship & Jobs, Small Business Services, Money & Financial Access, and Professional Services. Judged on actual revenue earned, AI-native operations, and category impact - not slideware. Hacker Fund handles screening; five finalists pitch live in LA.",
        eligibility="Open globally to individuals or teams; must launch a real business with real users and revenue during the 90-day window",
        highlights=[
            "US$2M total prize pool - largest Gemini-focused hackathon ever",
            "Judged on actual revenue + AI-native ops, not pitch quality",
            "Hacker Fund-curated; finalists pitch live in LA on 25 Sept",
            "Five category tracks - up to US$500K grand prize",
        ],
        application_deadline="2026-08-17",
        difficulty="Advanced",
        cost="Free",
        prize_value_usd=2000000,
        beginner_friendly=False,
        tags=["ai", "gemini", "xprize", "google", "business", "global", "high-prize", "online"],
    ),
    make(
        url="https://aihackathon.usaii.org/",
        name="USAII Global AI Hackathon 2026 - Virtual Student Competition",
        organizer="United States Artificial Intelligence Institute (USAII)",
        companies=["USAII"],
        level="Tertiary",
        timeline="Multi-day (4-7d)",
        scope="Global",
        domains=["Computer Science"],
        fields=["AI / Machine Learning"],
        status="upcoming",
        date="AI Readiness Qualifier 10 June 2026; build window 14-21 June 2026; results 12 July 2026",
        location="Online (global)",
        prize="USAII certifications, official recognition, trophy and merchandise (no cash track)",
        summary="A fully-virtual, student-only AI hackathon for high schoolers, undergrads, and grad students worldwide. Short qualifier on June 10 filters into a one-week build window. Less prize-driven than the corporate AI hackathons but a clean structured competition designed specifically for student builders - a useful portfolio piece and certification credential. Registration is free.",
        eligibility="Students worldwide in grades 9-12, undergraduate, graduate, or doctoral programs",
        highlights=[
            "Free; fully virtual; students only",
            "Structured qualifier + week-long main round",
            "Includes USAII certification path for finalists",
            "Open globally - no travel required",
        ],
        application_deadline="2026-06-06",
        difficulty="Beginner-Friendly",
        cost="Free",
        prize_value_usd=None,
        beginner_friendly=True,
        tags=["ai", "student", "global", "online", "virtual", "free", "beginner-friendly"],
    ),
    make(
        url="https://dwny-2026-hackathon.devpost.com/",
        name="DeveloperWeek New York 2026 Hackathon",
        organizer="DevNetwork",
        companies=["DevNetwork"],
        level="Open / Professional",
        timeline="Multi-week (1-3mo)",
        scope="Global",
        domains=["Computer Science"],
        fields=["General Tech", "AI / Machine Learning"],
        status="ongoing",
        date="25 May - 10 June 2026 (kickoff 26 May; final submissions 10 June 10:00 AM EST)",
        location="Hybrid - TWA Hotel, Queens NYC + online",
        prize="US$20K+ in cash, products, and sponsor-track prizes",
        summary="DeveloperWeek New York's official hackathon - hybrid, open-tracks, sponsor-heavy. Build-anything format with sponsor challenges layered on top; two judging rounds (Overall + per-sponsor). New York-based builders converge at the iconic TWA Hotel for kickoff while remote teams join online. 300+ developers expected. Short window - submissions close 10 June.",
        eligibility="Open globally; solo or team; in-person or online participation both supported",
        highlights=[
            "Hybrid: in-person at TWA Hotel + online",
            "US$20K+ across overall + sponsor tracks",
            "Two judging rounds widen the prize surface",
            "300+ developers - good networking for NYC tech",
        ],
        application_deadline="2026-06-10",
        difficulty="Intermediate",
        cost="Free",
        prize_value_usd=20000,
        beginner_friendly=False,
        tags=["developerweek", "new-york", "hybrid", "devnetwork", "online", "global"],
    ),
]


def main():
    with EVENTS_PATH.open(encoding="utf-8") as f:
        existing = json.load(f)

    existing_urls = {e.get("url") for e in existing}
    existing_ids = {e.get("id") for e in existing}

    added = []
    for ev in new_events:
        if ev["url"] in existing_urls or ev["id"] in existing_ids:
            print(f"  SKIP (dup): {ev['name']}")
            continue
        existing.append(ev)
        added.append(ev["name"])
        print(f"  ADD: {ev['name']}")

    with EVENTS_PATH.open("w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)

    print(f"\nAdded {len(added)} new events. Total: {len(existing)}")
    return len(added)


if __name__ == "__main__":
    main()
