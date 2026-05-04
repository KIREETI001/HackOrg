# Field Station — Competition & Hackathon Scanner

A daily-updated dossier of competitions, hackathons, accelerators, fellowships, and olympiads — every door you didn't know existed.

> **The truth most people never figure out:** Almost nobody is gatekeeping you. The vast majority of these competitions, accelerators, and fellowships are *actively trying to find you*. They have prize budgets that need to be spent. They have application portals with empty seats. One application takes 30 minutes. Submit it.

---

## What's tracked (v2.0 — 124 events)

- **Singapore school olympiads** — Math (SMO, SASMO, NMOS, APMOPS), Physics (SPhO), Chemistry (SChO), Biology (SBO), Astronomy (SAO), Informatics (NOI), Primary Science (SPSO).
- **Singapore tertiary** — NUS Hack&Roll, NUS Fintech Summit, NTU Beyond Binary, CCDS Pathways, NTU x Harvard HSIL.
- **Major League Hacking season** — 200+ student events globally July 2025–June 2026.
- **ETHGlobal Web3 stops** — Cannes, NYC, Lisbon, Tokyo, Mumbai (first India event).
- **LabLab.ai online AI** — AMD, IBM Bob, Milan AI Week, Techex Enterprise, AI Genesis Dubai, Complete AI.
- **US college hackathons** — TreeHacks (Stanford), HackMIT, HackPrinceton, Princeton Open Hackathon (NVIDIA GPU), Cal Hacks, Berkeley AI, Hack the North (Waterloo).
- **Climate / sustainability** — Wilkes Climate Solutions, SpaceHACK ASU, Earth Hacks, MIT Energy & Climate Hack, Coding for Sustainability, SDG Hackathon.
- **Healthcare AI** — Harvard HSIL, Boston University MedAI, Cornell Health Tech, Georgetown H2AI, Texas Healthcare Challenge, MedHack Frontiers Melbourne.
- **Women / Diversity** — NTU Beyond Binary, GirlCode (ADA), Google Girl Hackathon, Women Techmakers She Builds AI, RoseHack, ASU WiCS.
- **Founder fellowships** — Y Combinator Spring/Summer/Early Decision, Microsoft Imagine Cup, Thiel Fellowship, Z Fellows, Knight-Hennessy Scholars, Rhodes Scholarship, OpenAI Residency, Google DeepMind Residency, a16z TxO.
- **Singapore government** — MAS FinTech Festival, IMDA Tech for Good, GovTech Hack for Public Good, Smart Nation Challenges, AI Singapore NAISC.
- **India** — Smart India Hackathon, India Innovates (Bharat Mandapam), Smart Horizon NHCE, GirlCode, HSBC Hackathon, Devfolio, Unstop.
- **Debate / Humanities** — SSSDC, Asia Pacific Debate Championships, Asia Junior Debate.
- **Space** — NASA Space Apps Challenge, NASA ORBIT Challenge, IOAA.

## v2.0 features

This is a major upgrade from v1.0 (33 events, 5 dimensions of filtering).

### New event fields
- `application_deadline` — ISO date string when applications close
- `difficulty` — Beginner-Friendly / Intermediate / Advanced / Elite-Selective
- `cost` — Free / Paid / Varies
- `prize_value_usd` — Numeric estimate for sorting by prize
- `beginner_friendly` — Boolean for the "BEGINNER ONLY" toggle
- `application_url` — Direct apply link (separate from main info page)
- `tags` — Array of keyword tags for fast search

### New UI features
- **Deadline Watch widget** — Top-of-page urgency, shows next 3 deadlines with countdowns colored by urgency (red <7 days, amber <30 days, chartreuse otherwise).
- **Rotating manifesto** — 7 inspirational lines that rotate every 5.5s in the hero, with a longer manifesto in the footer.
- **Beginner Only / Free Only toggles** — One-click filtering.
- **Sort menu** — Default (curated), By Deadline, By Prize Value, Alphabetical.
- **Bookmarks** — Pin events of interest, then filter to BOOKMARKED. Stored in component state (no localStorage in artifact preview, persistent in production via storage API).
- **Feeling Lucky button** — Random event from the open pool.
- **Difficulty pill** — Visual indicator with 1-4 dots.
- **Cost badge** — Quick visual scan for FREE vs PAID.
- **Active filter chips** — See and clear all active filters at a glance.
- **About modal** — Self-documenting for visitors who want to know how this works.

---

## Architecture

```
┌──────────────────────────────┐
│   GitHub Actions (daily 01:00 UTC) │
│   .github/workflows/daily-scan.yml │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐    ┌──────────────────┐
│   scraper/scrape.py          │───▶│   Anthropic API  │
│   - Surveys discovery sources│    │   claude-haiku-4-5│
│   - Per-page Claude extraction│   │   (~$1-3/month)  │
└──────────────┬───────────────┘    └──────────────────┘
               │
               ▼
┌──────────────────────────────┐
│   data/events.json (commit)  │
│   data/meta.json (commit)    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│   Next.js (Vercel)           │
│   app/page.jsx → CompetitionScanner │
│   ISR revalidates every hour │
└──────────────────────────────┘
```

Discovery sources currently surveyed:
- Devpost (`/api/hackathons` JSON)
- dev.events
- SGInnovate
- (extensible — see `discover_*` functions in scrape.py)

---

## Local setup

```bash
# Install
npm install

# Run dev server
npm run dev   # http://localhost:3000

# Build static
npm run build && npm start
```

For the scraper:
```bash
cd scraper
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...
python scrape.py
```

The scraper writes to `../data/events.json` and `../data/meta.json`. The Next.js app reads from these files at build time + revalidates hourly.

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add `ANTHROPIC_API_KEY` to GitHub Actions secrets so the daily scan workflow can call Claude.

---

## Adding new events / sources

Two options:

**A) Add to seed list:** Edit `scraper/scrape.py` → `KNOWN_SEED_URLS` list. Run scraper. Done.

**B) Add a discovery function:** Add a new `discover_xyz()` function that returns a list of `(name, url)` tuples, and register it in the main flow. The scraper handles deduplication and Claude-based extraction automatically.

---

## File map

```
scanner-starter/
├── app/
│   ├── layout.jsx          # Root layout + Google Fonts (Fraunces, Schibsted, JetBrains Mono)
│   ├── page.jsx            # Imports data, renders CompetitionScanner
│   └── globals.css         # Tailwind base
├── components/
│   └── CompetitionScanner.jsx   # ~1400 lines — the whole UI
├── data/
│   ├── events.json         # Master event dossier (124 events as of v2.0)
│   └── meta.json           # Sweep timestamp + counts
├── scraper/
│   ├── scrape.py           # Daily Claude-powered extractor
│   └── requirements.txt
├── .github/workflows/
│   └── daily-scan.yml      # GitHub Action (cron 01:00 UTC daily)
└── README.md
```

---

## Cost & maintenance

- **Anthropic API:** ~$0.05/run × 30 days = **~$1.50/month**.
- **Vercel:** Free tier (Hobby) handles this easily.
- **GitHub Actions:** Free for public repos.
- **Maintenance:** None required. The scraper handles new events automatically. To curate, edit `data/events.json` directly and commit.

---

## Design system

- **Background:** `#0F0E0C` (dark warm)
- **Paper:** `#ECE4D2` (cream)
- **Accent:** `#D8FF3D` (chartreuse — the chosen one)
- **Status:** ongoing → chartreuse pulsing dot · upcoming → icy blue · completed → muted 55% opacity
- **Urgency:** `<7d` red `#FF5F56` · `<30d` amber `#FFB347` · `>30d` chartreuse
- **Display:** Fraunces (serif, italic for emphasis)
- **Body:** Schibsted Grotesk
- **Mono:** JetBrains Mono (all metadata, labels, terminal feel)

---

*Made with care for anyone who's ever felt like the cool opportunities are happening somewhere they're not.*

*— v2.0 · 05 May 2026*
