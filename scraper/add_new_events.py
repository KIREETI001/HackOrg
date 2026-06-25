"""One-off: append fresh events from the 2026-05-17 manual extraction sweep."""
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
        url="https://dothack-heap-2026.devpost.com/",
        name="SMU .Hack HEAP 2026 (Enrichment Application Programme)",
        organizer="SMU .Hack (Singapore Management University)",
        companies=["Google", "AWS", "Huawei"],
        level="Tertiary",
        timeline="Multi-month (3-6mo)",
        scope="Local (Singapore)",
        domains=["Computer Science"],
        fields=["General Tech", "AI / Machine Learning"],
        status="ongoing",
        date="15 May - 24 July 2026",
        location="Singapore Management University, Singapore",
        prize="S$1,750 prize pool + mentorship and workshops with Google, AWS, Huawei",
        summary="SMU .Hack's flagship summer software-development immersion: students form teams and ship a self-chosen application across ten weeks with mentorship from SMU seniors, alumni, and industry. Weekly technical workshops cover full-stack, cloud, and AI patterns, plus on-site visits to partner companies. Beginner-friendly - first-time builders welcome.",
        eligibility="SMU students and invited external university students; open to all skill levels",
        highlights=[
            "10-week build cycle with weekly technical workshops",
            "Industry mentorship from Google, AWS, Huawei",
            ".Hack Social Night networking events",
            "Beginner-friendly: no prior project experience required",
        ],
        application_deadline="2026-05-15",
        difficulty="Beginner-Friendly",
        cost="Free",
        prize_value_usd=1300,
        beginner_friendly=True,
        tags=["singapore", "tertiary", "student-run", "smu", "beginner-friendly", "summer"],
    ),
    make(
        url="https://www.agorize.com/en/challenges/slingshot-2026-edition",
        name="SLINGSHOT 2026 - Asia's Deep Tech Pitching Competition",
        organizer="Enterprise Singapore + SGInnovate",
        companies=["Enterprise Singapore", "SGInnovate", "SWITCH"],
        level="Open / Professional",
        timeline="Multi-month (3-6mo)",
        scope="Global",
        domains=["Computer Science", "Sciences (STEM)", "Business / Economics"],
        fields=["AI / Machine Learning", "Sustainability", "Healthcare", "General Tech"],
        status="ongoing",
        date="6 March - 30 June 2026 (immersion 22-24 Oct, finals 27-29 Oct 2026)",
        location="Singapore (finals at SWITCH 2026)",
        prize="Grand prize S$400K Startup SG grant; runners-up S$300K / S$200K; each Top 10 gets S$80K",
        summary="The 10th edition of Asia's flagship deep-tech pitching competition, bringing global startups to Singapore for an immersion programme and live finals at SWITCH. Top 50 receive sponsored Singapore trips; Top 10 split nearly S$1M in non-dilutive Startup SG grant prizes. Domain finals cover AI, sustainability, healthcare, and frontier tech.",
        eligibility="Deep-tech startups globally (under 7 years old, pre-Series B); founders apply with a 10-slide pitch",
        highlights=[
            "S$400K grand prize (non-dilutive Startup SG grant)",
            "Top 50 fly to Singapore on a sponsored immersion programme",
            "EntrePass eligibility for international finalists",
            "Pitches in front of SWITCH 2026 investor audience",
        ],
        application_deadline="2026-06-30",
        difficulty="Elite/Selective",
        cost="Free",
        prize_value_usd=300000,
        beginner_friendly=False,
        tags=["singapore", "deep-tech", "startup", "pitch", "switch", "global", "high-prize"],
    ),
    make(
        url="https://rapid-agent.devpost.com/",
        name="Google Cloud Rapid Agent Hackathon 2026",
        organizer="Google Cloud",
        companies=["Google Cloud", "Devpost"],
        level="Open / Professional",
        timeline="Multi-week (1-3mo)",
        scope="Global",
        domains=["Computer Science"],
        fields=["AI / Machine Learning"],
        status="ongoing",
        date="5 May - 11 June 2026",
        location="Online (global)",
        prize="US$50K+ prize pool - bucket system: 1st US$5K / 2nd US$3K / 3rd US$2K per partner bucket",
        summary="Google Cloud's open call to build agentic AI that reasons, plans, and executes real tasks - not just chatbots. Builders use Gemini 3 and Google Cloud's Agent Builder stack to ship within a six-week window. A bucket-prize system means more winners across multiple partner-defined categories rather than one winner-take-all track.",
        eligibility="Open globally; all skill levels welcome (Devpost-hosted, solo or team)",
        highlights=[
            "Built on Gemini 3 + Google Cloud Agent Builder",
            "Bucket-prize structure spreads wins across categories",
            "All technical levels welcome",
            "Online - no travel required",
        ],
        application_deadline="2026-06-11",
        difficulty="Intermediate",
        cost="Free",
        prize_value_usd=50000,
        beginner_friendly=False,
        tags=["ai", "agents", "gemini", "google-cloud", "online", "global"],
    ),
    make(
        url="https://findevil.devpost.com/",
        name="FIND EVIL! - SANS Autonomous Incident Response Hackathon",
        organizer="SANS Institute",
        companies=["SANS Institute"],
        level="Open / Professional",
        timeline="Multi-month (3-6mo)",
        scope="Global",
        domains=["Computer Science"],
        fields=["Cybersecurity", "AI / Machine Learning"],
        status="ongoing",
        date="15 April - 15 June 2026 (winners 8 July 2026)",
        location="Online (global)",
        prize="US$22K+ pool: 1st US$10K + full SANS Summit pass per team member, 2nd US$7.5K, 3rd US$3K",
        summary="The first hackathon dedicated to building autonomous AI agents for cyber incident response. Teams extend Protocol SIFT - the framework that wires AI agents into SANS's SIFT Workstation tooling - into a self-driving IR agent. Winning code gets reviewed for upstream integration. Already 1,100+ registered builders.",
        eligibility="Solo or teams up to 5; no incident-response background required",
        highlights=[
            "1st place: cash + full SANS Summit package for whole team",
            "Winning code may merge into Protocol SIFT upstream",
            "Judged on hallucination management + audit-trail quality",
            "1,100+ builders already registered",
        ],
        application_deadline="2026-06-15",
        difficulty="Advanced",
        cost="Free",
        prize_value_usd=22000,
        beginner_friendly=False,
        tags=["cybersecurity", "ai", "agents", "sans", "incident-response", "global"],
    ),
    make(
        url="https://medo.devpost.com/",
        name="Build with MeDo Hackathon (Baidu)",
        organizer="Baidu",
        companies=["Baidu", "MeDo"],
        level="Open / Professional",
        timeline="Multi-week (1-3mo)",
        scope="Global",
        domains=["Computer Science"],
        fields=["AI / Machine Learning", "General Tech"],
        status="ongoing",
        date="9 April - 20 May 2026",
        location="Online (global)",
        prize="US$50K pool - 1st place US$10K plus multiple category prizes",
        summary="Baidu's global showcase for MeDo, its no-code full-stack AI builder. Describe what you want; MeDo generates the app, lets you iterate via chat or visual editor, and one-click deploys. The hackathon is deliberately beginner-friendly - the platform handles the engineering so submissions are judged on creativity and use-case fit. Closes 20 May - submit fast.",
        eligibility="Open globally to all skill levels; no coding background required",
        highlights=[
            "Truly no-code: build via natural-language description",
            "1st place US$10K + many secondary prizes",
            "Beginner-friendly: no engineering background needed",
            "Closes 20 May 2026 - last-minute apply window",
        ],
        application_deadline="2026-05-20",
        difficulty="Beginner-Friendly",
        cost="Free",
        prize_value_usd=50000,
        beginner_friendly=True,
        tags=["ai", "no-code", "baidu", "online", "beginner-friendly", "deadline-soon"],
    ),
    make(
        url="https://dorahacks.io/hackathon/awsprompttheplanet/detail",
        name="AWS Prompt the Planet Challenge 2026",
        organizer="Amazon Web Services",
        companies=["AWS", "DoraHacks"],
        level="Open / Professional",
        timeline="Multi-month (3-6mo)",
        scope="Global",
        domains=["Computer Science"],
        fields=["AI / Machine Learning", "General Tech"],
        status="ongoing",
        date="10 March - 11 June 2026",
        location="Online (global)",
        prize="US$50K in AWS credits split across 10 winners",
        summary="AWS's prompt-engineering challenge: submit prompts that help developers accomplish real AWS tasks (provisioning, debugging, cost optimisation, security review). Ten winners share US$50K in AWS credits. Multiple submissions are allowed, so iteration pays. A low-effort, high-leverage entry for anyone who already lives in the AWS console.",
        eligibility="Open globally; individual submissions; multiple entries allowed",
        highlights=[
            "Submit prompts, not full apps - extremely low entry friction",
            "Ten winners share US$50K AWS credits",
            "Multiple entries allowed",
            "Hosted on DoraHacks",
        ],
        application_deadline="2026-06-11",
        difficulty="Beginner-Friendly",
        cost="Free",
        prize_value_usd=50000,
        beginner_friendly=True,
        tags=["aws", "prompt-engineering", "ai", "online", "beginner-friendly", "global"],
    ),
    make(
        url="https://ai-agents-hackathon1.devpost.com/",
        name="International AI Agents Hackathon 2026",
        organizer="AI HackWorld",
        companies=["AI HackWorld"],
        level="Open / Professional",
        timeline="Multi-week (1-3mo)",
        scope="Global",
        domains=["Computer Science"],
        fields=["AI / Machine Learning", "General Tech"],
        status="ongoing",
        date="7 - 29 May 2026",
        location="Online (global)",
        prize="US$100 cash prize + bragging rights",
        summary="A low-stakes, fast online hackathon focused on AI agents for enterprise, ML, and web use cases. Closes 29 May. Prize pool is small but it's a clean three-week container to ship a working agent demo and get a Devpost portfolio piece. Good warm-up for the bigger Google Cloud Rapid Agent or FIND EVIL! tracks running in parallel.",
        eligibility="Open globally to all skill levels",
        highlights=[
            "Short three-week build window",
            "Online, no travel",
            "Good Devpost portfolio piece",
            "Closes 29 May 2026",
        ],
        application_deadline="2026-05-29",
        difficulty="Intermediate",
        cost="Free",
        prize_value_usd=100,
        beginner_friendly=False,
        tags=["ai", "agents", "online", "global", "deadline-soon"],
    ),
    make(
        url="https://www.prnewswire.com/apac/news-releases/narayana-murthy-shares-leadership-lessons-at-smu-visionary-series-as-smu-launches-2026-singapore-india-hackathon-302636054.html",
        name="4th Singapore-India Hackathon 2026 (SMU)",
        organizer="Singapore Management University + Indian Ministry of Education",
        companies=["SMU", "Government of India MoE", "Government of Singapore MOE"],
        level="Tertiary",
        timeline="Multi-day (4-7d)",
        scope="Regional (Asia)",
        domains=["Computer Science", "Sciences (STEM)"],
        fields=["AI / Machine Learning", "Sustainability", "General Tech"],
        status="upcoming",
        date="June 2026",
        location="Singapore Management University",
        prize="Cross-border industry mentorship + government-backed recognition",
        summary="The fourth edition of the bilateral Singapore-India Hackathon, marking 60 years of diplomatic ties. University teams from both countries pair up to solve government-and-industry-defined challenges at SMU. Backed by both Education Ministries - Minister Desmond Lee opened the launch event alongside Infosys co-founder Narayana Murthy. Less prize-driven, more about cross-border collaboration credentials.",
        eligibility="University students from Singapore and India institutions; team formation includes both nationalities",
        highlights=[
            "Bilateral SG-India university partnership",
            "Backed by both education ministries",
            "60-years-of-diplomatic-ties commemorative edition",
            "Cross-border team formation built in",
        ],
        application_deadline=None,
        difficulty="Intermediate",
        cost="Free",
        prize_value_usd=None,
        beginner_friendly=False,
        tags=["singapore", "india", "tertiary", "bilateral", "government-backed", "smu"],
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
