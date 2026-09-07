# Field Station — v3

**A deadline-first scanner for hackathons, fellowships, and accelerators.**

The product answers one question: *"What closes in the next 30 days that's relevant to me?"* You pick 2–4 tags, you see your radar, you click through and apply. That's it.

- Events for university students and beyond — focused on Singapore + Asia + US + global online events.
- A daily scheduled Python scraper surveys Devpost, dev.events, lablab.ai, SGInnovate, university hackathon pages, and accelerator portals.
- No accounts. Profile + bookmarks live in `localStorage`.
- Open registrations appear by default. Use the registration-closed and ended tabs to see past deadlines.

This v3 is a deliberate rewrite per [CRITIQUE.md](CRITIQUE.md) — see [PLAN.md](PLAN.md) for what was cut and why, and [ASSUMPTIONS.md](ASSUMPTIONS.md) for the calls made along the way.

---

## Quickstart

```bash
git clone https://github.com/KIREETI001/HackOrg.git
cd HackOrg
npm install
npm run dev   # → http://localhost:3000
```

To run tests:
```bash
npm test      # node --test on test/*.test.mjs
```

To run a production build:
```bash
npm run build && npm start
```

To run the scraper locally (optional — needs an OpenAI API key):
```bash
cd scraper
pip install -r requirements.txt
export OPENAI_API_KEY="your-key"   # PowerShell: $env:OPENAI_API_KEY="your-key"
python scrape.py
```

---

## Keeping scans current

1. In the repository's **Settings → Secrets and variables → Actions**, set the `OPENAI_API_KEY` repository secret. The scanner uses OpenAI for event extraction.
2. Open [Daily Competition Scan](https://github.com/KIREETI001/HackOrg/actions/workflows/daily-scan.yml), choose **Run workflow**, and select `main`. You must be signed in to GitHub with repository write access. The site's **Run scan on GitHub** link opens this page.
3. Check that the workflow succeeds and commits updated `data/events.json` and `data/meta.json`. A workflow starting is not proof that the scan finished.

The scheduled run is daily at **08:00 UTC / 16:00 Singapore time**. If schedules have been disabled, re-enable the workflow in GitHub Actions.

**Vercel does not need a `GITHUB_TOKEN`.** Manual scans use GitHub's authenticated workflow page. GitHub Actions provides its own workflow token with `contents: write` to commit the scan results; keep `OPENAI_API_KEY` in the repository's Actions secrets.

At runtime, the site resolves the latest `main` commit and reads both public data files from that same immutable commit. It validates and caches the complete snapshot with hourly revalidation, so new scans can appear without redeploying the app. Refreshing after the cache becomes eligible may first show the previous snapshot while revalidation runs.

If a refresh fails or the data is invalid, the cache retains its last successful snapshot; when no usable cached snapshot is available, the site uses the bundled dataset. A newer bundled scan also takes precedence over an older cached scan. The displayed sweep date and failure flag always come from the selected snapshot. A page refresh or deployment does not make an old scan fresh.

---

## 60-second demo script

1. `npm run dev` → open <http://localhost:3000>.
2. First-visit screen: **TagPicker**. Pick 2–4 tags (e.g. *AI, Singapore, Beginner-Friendly*). Click *See my deadlines →*.
3. **Deadline Radar** appears at the top with up to 5 events matching your tags, sorted by days-until-deadline.
4. Below the radar, the **Toolbar** shows the same tag chips (toggle live), a search box, a sort dropdown (Deadline / Prize / A→Z), and a "Saved" toggle. Status tabs switch between open registrations, closed registrations, and ended events.
5. Click any event card → **slide-over EventDetail** panel with full dossier, hero deadline countdown, and apply link.
6. Click the bookmark icon → reload the page → bookmark survives (it's in `localStorage`, real this time).
7. Type a search query → list filters live. Clear it with the `×`.
8. Toggle *Saved* → only bookmarked events. Choose a status tab → see events in that registration bucket.
9. The footer shows the total event count and the last sweep date from the loaded snapshot's `data/meta.json`.

If `meta.last_sweep_iso` is more than 48 hours old (or `meta.last_sweep_failed === true`), a red **StaleBanner** appears at the top.

---

## What's in the repo

```
HackOrg/
├── app/
│   ├── layout.jsx          # fonts + metadata
│   ├── page.jsx            # caches a live scan snapshot, renders <Scanner/>
│   └── globals.css         # CSS variables + base styles
├── components/             # all of v3's UI, split out of the old 1,434-line monolith
│   ├── Scanner.jsx           # shell — owns state, composes the rest
│   ├── DeadlineRadar.jsx     # default top-of-page hero (5 closest deadlines)
│   ├── TagPicker.jsx         # first-visit onboarding
│   ├── Toolbar.jsx           # search + tag chips + sort + bookmark toggle
│   ├── EventCard.jsx         # one row in the grid
│   ├── EventDetail.jsx       # slide-over dossier panel
│   └── StaleBanner.jsx       # warning when meta.last_sweep_iso > 48h
├── lib/
│   ├── eventModel.mjs        # pure: deriveStatus, filterAndSort, daysUntil, allTags, ...
│   ├── scanData.mjs          # immutable GitHub snapshot loading + validation + fallback
│   ├── scanWorkflow.mjs      # authenticated manual-scan workflow link
│   ├── storage.js            # localStorage helpers (profile + bookmarks)
│   └── tags.js               # canonical tag taxonomy
├── test/
│   ├── eventModel.test.mjs   # pure-fn tests with a fixed clock
│   ├── scanData.test.mjs     # snapshot loading + validation + fallback tests
│   └── dataIntegrity.test.mjs # schema/dataset tests
├── data/
│   ├── events.json         # committed event dataset + bundled fallback
│   └── meta.json           # last sweep timestamp + counts + failed flag
├── scraper/
│   ├── scrape.py           # OpenAI-powered extractor + validator + atomic writer
│   └── requirements.txt
├── CRITIQUE.md             # the first-principles teardown driving v3
├── PLAN.md                 # what we're building and why
└── ASSUMPTIONS.md          # calls made without asking
```

---

## Architecture

```
GitHub Actions cron (daily 08:00 UTC / 16:00 SGT) or Run workflow
    │
    ▼
scraper/scrape.py
   - Discover candidates (Devpost / dev.events / SGInnovate)
   - OpenAI extract (capped by MAX_NEW_PER_RUN)
   - Validate against schema
   - Atomic write (write to .tmp → rename)
   - Write sweep metadata (with a failure flag for exceptions caught by the scan)
    │
    ▼
data/events.json + data/meta.json committed to main
    │
    ▼
Next.js (Vercel) — hourly snapshot + page revalidation
   Resolve main → fetch both files at one immutable commit → validate
   Cache the complete snapshot; retain last-good data on refresh failure
   app/page.jsx selects live snapshot or bundled fallback → <Scanner/>
   localStorage holds profile + bookmarks (no backend)
```

**Status is derived at render time**, not stored. `lib/eventModel.mjs` computes:
- `deadline < today` → `closed`
- `deadline ≤ 30d` → `closing-soon`
- otherwise → `open` (or `rolling` if no deadline)

This is why we no longer need the "manual status flip" passes from v1/v2.

---

## Adding new events / sources

**A) Add to seed list:** edit `scraper/scrape.py` → `SOURCES` list. Add a `candidates_xyz()` function returning `[{"name", "url"}]` candidates.

**B) Add an event by hand:** edit `data/events.json` directly and keep `data/meta.json`'s `total_events` equal to the array length. Commit both files together so snapshot validation succeeds. The scraper merges by URL, so manual additions persist across runs. Pass a `source: "curated"` field if you want to remember it was hand-added.

---

## Design system

- **Background:** `#0F0E0C` (dark warm)
- **Paper:** `#ECE4D2` (cream)
- **Accent:** `#D8FF3D` (chartreuse — the chosen one)
- **Urgent:** `#FF5F56` (≤7d)
- **Soon:** `#FFB347` (≤30d)
- **Display:** Fraunces (serif, italic for emphasis)
- **Body:** Schibsted Grotesk
- **Mono:** JetBrains Mono (all metadata, labels, terminal feel)

CSS variables live in [app/globals.css](app/globals.css) — `var(--bg)`, `var(--paper)`, `var(--accent)`, `var(--urgent)`, `var(--soon)`, `var(--muted)`, `var(--line)`, `var(--card)`.

---

## Maintenance

- **OpenAI API:** usage depends on the configured model and the candidates processed. Check the OpenAI account's usage and billing when maintaining the scanner.
- **Scan failures:** inspect the GitHub Actions run logs and the `OPENAI_API_KEY` repository secret. A stale banner remains appropriate until a successful scan supplies current metadata.
- **Deployment:** deploy application changes through Vercel. Data-only scan commits are read at runtime with hourly revalidation.
- **Maintenance:** the scraper handles new events automatically. To curate, edit `data/events.json` directly and commit. Tests + schema validation catch most regressions.

---

*— v3.0 · 17 May 2026 (deadline-first rewrite)*
