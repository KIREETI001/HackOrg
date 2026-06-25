# Field Station v2 — Implementation Plan

Derived from [CRITIQUE.md](CRITIQUE.md). Treats the critique as the spec.

## Problem slice (minimal)

**One page that answers: "What closes in the next 30 days that's relevant to me?"** Primary user is a university student / early-career builder who wants the next 2–3 deadlines that match their interests in <60 seconds.

## v2 feature set — MUST-HAVES

- M1. Default view = **Deadline Radar** (sorted by `deadline` asc, `closed` events hidden by default).
- M2. **Tag-based profile** persisted in `localStorage` (chip-select 2–4 tags on first visit).
- M3. **Bookmarks persisted in `localStorage`** — replace in-component `Set`.
- M4. **Use real `new Date()`** — kill the pinned `TODAY = "2026-05-05"` bug.
- M5. **Search box** over name + organizer + tags.
- M6. **Single flat `tags` taxonomy** — collapse `domains` + `fields` into the existing `tags` array.
- M7. **Status is derived** at render time from `deadline` (and `date` for ongoing events). Remove `status` as a stored field's authority — backwards-compatible: still read it if present, but recompute.
- M8. **Stripped event card**: name · countdown · prize · location · 2 tags. Move everything else to the detail panel.
- M9. **Split the 1,434-line component** into focused modules under `components/` and `lib/`.
- M10. Scraper: **schema validation** + atomic write + `meta.last_sweep_failed` flag on any failure; home page shows a "stale data" banner if `last_sweep_iso > 48h` old.
- M11. **`npm test`** runs minimal smoke tests (data integrity + lib/eventModel.js pure-fn tests). Node's built-in `node:test`, no extra deps.
- M12. **README** rewritten with a 60-second demo script.

## NICE-TO-HAVES (only if time permits)

- N1. Shareable URL with prefilled tags (`/?tags=ai,singapore`).
- N2. Region picker on first visit.
- N3. `KNOWN_TAGS` allowlist in the scraper prompt.
- N4. Email digest opt-in (defer to phase 3 — needs a backend).

## Architecture

### Frontend (Next.js App Router)

```
app/
  layout.jsx          # unchanged (fonts, metadata)
  page.jsx            # imports events+meta, renders <Scanner/>
  globals.css         # unchanged

components/
  Scanner.jsx                # top-level shell — composes the rest
  DeadlineRadar.jsx          # the default top-of-page hero (3-5 deadlines)
  Toolbar.jsx                # search box + tag chips + view toggle
  EventList.jsx              # filtered/sorted list
  EventCard.jsx              # one row
  EventDetail.jsx            # slide-over panel
  TagPicker.jsx              # first-visit onboarding
  StaleBanner.jsx            # warning when meta.last_sweep_iso > 48h

lib/
  eventModel.js              # pure: deriveStatus, filterEvents, sortEvents, daysUntil
  storage.js                 # localStorage helpers (profile + bookmarks)
  tags.js                    # tag taxonomy + helpers
```

Deleted from current codebase:
- `MANIFESTOS`, `RotatingManifesto`
- "Feeling Lucky" button
- About modal (replaced with footer link + simple `/about` page is over-scope for v2 — skip)
- Beginner Only / Free Only toggles (folded into tag chips)
- The `fields` filter dimension (merged into `tags`)
- The `domains` filter dimension (merged into `tags`)
- The hard-coded `TODAY`

### Backend (Python scraper)

```
scraper/
  scrape.py            # orchestrator (existing, refactored)
  sources.py           # discover_* functions (extracted from scrape.py)
  extract.py           # Claude call + JSON parse (extracted from scrape.py)
  validate.py          # NEW: jsonschema-style validation; reject malformed
  refresh.py           # NEW: status refresh + dead-link detection
  schema.py            # NEW: the canonical event schema
  requirements.txt     # add: jsonschema (or homegrown — depends on weight)
```

The MVP can land **without** the scraper split — that's a quality-of-life refactor. What MUST land in v2 from the scraper:
- Schema validation gate before writing `events.json`.
- `meta.last_sweep_failed` flag on any exception.
- Atomic write (write to `.tmp`, then rename).

### Data

`data/events.json` — keep existing format for backwards compat, but render code only reads the v2 subset of fields. Migration is non-breaking.

`data/curated.json` — **defer to phase 2.** For v2, hand-curated events still go in `events.json` with `source: "curated"`.

`data/meta.json` — add `last_sweep_failed: boolean` and `last_sweep_iso` (already present).

## Prioritized task list

| # | Task | Phase | Priority | Notes |
|---|---|---|---|---|
| T1 | Write CRITIQUE.md | Plan | DONE | — |
| T2 | Write PLAN.md + ASSUMPTIONS.md | Plan | DONE | — |
| T3 | Delete dead surface (manifesto, feeling-lucky, about-modal-bloat) | 1 | MUST | Pure deletion. |
| T4 | Fix `TODAY` → `new Date()` | 1 | MUST | One line, highest impact. |
| T5 | Wire bookmarks to `localStorage` | 1 | MUST | ~10 lines. |
| T6 | Build `lib/eventModel.js` (pure fns) | 2 | MUST | Foundation for the split. |
| T7 | Build `lib/storage.js` (localStorage helpers) | 2 | MUST | |
| T8 | Build `lib/tags.js` (canonical tags + display helpers) | 2 | MUST | |
| T9 | Build `components/DeadlineRadar.jsx` | 2 | MUST | Default view. |
| T10 | Build `components/EventCard.jsx` (stripped) | 2 | MUST | |
| T11 | Build `components/EventDetail.jsx` (slide-over) | 2 | MUST | Extracted from the monolith. |
| T12 | Build `components/Toolbar.jsx` (search + tags) | 2 | MUST | |
| T13 | Build `components/TagPicker.jsx` (onboarding) | 2 | MUST | |
| T14 | Build `components/StaleBanner.jsx` | 2 | MUST | |
| T15 | Build `components/Scanner.jsx` (new shell) | 2 | MUST | Composes everything. |
| T16 | Wire `app/page.jsx` to new Scanner | 2 | MUST | |
| T17 | Delete `components/CompetitionScanner.jsx` (the monolith) | 2 | MUST | After T15–T16. |
| T18 | Scraper: validate.py + atomic write + last_sweep_failed | 2 | MUST | |
| T19 | Add `npm test` → run `node --test test/*.test.js` | 3 | MUST | Built-in node:test, zero deps. |
| T20 | Write `test/eventModel.test.js` (pure-fn) | 3 | MUST | |
| T21 | Write `test/dataIntegrity.test.js` (schema-ish) | 3 | MUST | |
| T22 | Rewrite README with 60-second demo | 4 | MUST | |
| T23 | Shareable URL with tags | 4 | NICE | Skip if time-pressed. |
| T24 | Region picker | 4 | NICE | Skip. |

## Termination criteria

- All MUST tasks done.
- `npm run dev` works; default view shows Deadline Radar; tag-pick → list filters; bookmark survives refresh; countdown matches today.
- `npm test` is green.
- README's demo script can be followed by a clean clone in <5 minutes.
