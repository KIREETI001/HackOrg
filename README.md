# Field Station — v3

**A deadline-first scanner for hackathons, fellowships, and accelerators.**

The product answers one question: *"What closes in the next 30 days that's relevant to me?"* You pick 2–4 tags, you see your radar, you click through and apply. That's it.

- 102 live events for university students and beyond — focused on Singapore + Asia + US + global online events.
- Updated daily by a Python scraper that surveys Devpost, dev.events, lablab.ai, SGInnovate, university hackathon pages, and accelerator portals.
- No accounts. Profile + bookmarks live in `localStorage`.
- Hidden by default: closed events. Toggle "Show closed" to see them.

This v3 is a deliberate rewrite per [CRITIQUE.md](CRITIQUE.md) — see [PLAN.md](PLAN.md) for what was cut and why, and [ASSUMPTIONS.md](ASSUMPTIONS.md) for the calls made along the way.

---

## Quickstart

```bash
git clone <repo>
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

To run the scraper locally (optional — needs an Anthropic API key):
```bash
cd scraper
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...   # PowerShell: $env:ANTHROPIC_API_KEY="sk-ant-..."
python scrape.py
```

---

## 60-second demo script

1. `npm run dev` → open <http://localhost:3000>.
2. First-visit screen: **TagPicker**. Pick 2–4 tags (e.g. *AI, Singapore, Beginner-Friendly*). Click *See my deadlines →*.
3. **Deadline Radar** appears at the top with up to 5 events matching your tags, sorted by days-until-deadline.
4. Below the radar, the **Toolbar** shows the same tag chips (toggle live), a search box, a sort dropdown (Deadline / Prize / A→Z), and "Saved" + "Show closed" toggles.
5. Click any event card → **slide-over EventDetail** panel with full dossier, hero deadline countdown, and apply link.
6. Click the bookmark icon → reload the page → bookmark survives (it's in `localStorage`, real this time).
7. Type a search query → list filters live. Clear it with the `×`.
8. Toggle *Saved* → only bookmarked events. Toggle *Show closed* → past-deadline events reappear (dimmed).
9. The footer shows the total event count and the last sweep date — pulled from `data/meta.json`.

If `meta.last_sweep_iso` is more than 48 hours old (or `meta.last_sweep_failed === true`), a red **StaleBanner** appears at the top.

---

## What's in the repo

```
HackOrg/
├── app/
│   ├── layout.jsx          # fonts + metadata
│   ├── page.jsx            # imports JSON, renders <Scanner/>
│   └── globals.css         # CSS variables + base styles
├── components/             # all of v3's UI, split out of the old 1,434-line monolith
│   ├── Scanner.jsx           # shell — owns state, composes the rest
│   ├── DeadlineRadar.jsx     # default top-of-page hero (5 closest deadlines)
│   ├── TagPicker.jsx         # first-visit onboarding
│   ├── Toolbar.jsx           # search + tag chips + sort + bookmark/closed toggles
│   ├── EventCard.jsx         # one row in the grid
│   ├── EventDetail.jsx       # slide-over dossier panel
│   └── StaleBanner.jsx       # warning when meta.last_sweep_iso > 48h
├── lib/
│   ├── eventModel.mjs        # pure: deriveStatus, filterAndSort, daysUntil, allTags, ...
│   ├── storage.js            # localStorage helpers (profile + bookmarks)
│   └── tags.js               # canonical tag taxonomy
├── test/
│   ├── eventModel.test.mjs   # 18 pure-fn tests
│   └── dataIntegrity.test.mjs # 6 schema/dataset tests
├── data/
│   ├── events.json         # 102 events
│   └── meta.json           # last sweep timestamp + counts + failed flag
├── scraper/
│   ├── scrape.py           # Claude-powered extractor + validator + atomic writer
│   └── requirements.txt
├── CRITIQUE.md             # the first-principles teardown driving v3
├── PLAN.md                 # what we're building and why
└── ASSUMPTIONS.md          # calls made without asking
```

---

## Architecture

```
GitHub Actions cron (daily 01:00 UTC)
    │
    ▼
scraper/scrape.py
   - Discover candidates (Devpost / dev.events / SGInnovate)
   - Claude extract (capped MAX_NEW_PER_RUN = 15)
   - Validate against schema
   - Atomic write (write to .tmp → rename)
   - Always update meta.json (with last_sweep_failed flag on exception)
    │
    ▼
data/events.json + data/meta.json   ← single source of truth
    │
    ▼
Next.js (Vercel) — ISR revalidate=3600
   app/page.jsx loads JSON → <Scanner/>
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

**B) Add an event by hand:** edit `data/events.json` directly. The scraper merges by URL, so manual additions persist across runs. Pass a `source: "curated"` field if you want to remember it was hand-added.

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

## Cost & maintenance

- **Anthropic API:** ~$0.05/run × 30 days ≈ **$1.50/month**.
- **Vercel:** free tier (Hobby) handles ISR + 102 static records easily.
- **GitHub Actions:** free for public repos.
- **Maintenance:** the scraper handles new events automatically. To curate, edit `data/events.json` directly and commit. Tests + schema validation catch most regressions.

---

*— v3.0 · 17 May 2026 (deadline-first rewrite)*
