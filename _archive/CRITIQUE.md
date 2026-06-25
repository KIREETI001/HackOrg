# Field Station — First-Principles Teardown

*Style: Musk algorithm. Order matters. (1) Make requirements less dumb → (2) Delete → (3) Simplify → (4) Accelerate cycle time → (5) Automate last.*

---

## 1. First Principles Summary

- **The product is not a catalog.** Catalogs already exist (Devpost, MLH, Unstop). The actual job-to-be-done is: *"Tell me which 1–3 doors I should walk through this week, before they close, given who I am."* Today's app is a 102-row table dressed in nice typography. That fails the test.
- **The half-life of a hackathon listing is ~3 weeks.** Anything older is dead data carrying a maintenance tax. Showing 26 "completed" events on the main view is data hoarding.
- **Users do not browse. They get pulled in by a deadline, or they forget.** No notification path = no rescue path. The current product is a passive surface that requires the user to remember to come back. That is a behavior model that loses every time.
- **Bookmarks-in-component-state is worse than no bookmarks.** The README literally admits "no localStorage in artifact preview." Shipping a UI that pretends to remember and then forgets on refresh trains users to distrust the product.
- **`TODAY` is hard-coded to `2026-05-05`** in [components/CompetitionScanner.jsx:32](components/CompetitionScanner.jsx#L32). Today is 2026-05-17. Every deadline countdown on the page is off by 12 days. A clock that lies is not a clock. **This is the single most embarrassing bug in the repo and it survived the last sweep.**
- **1,434 lines in one file** ([components/CompetitionScanner.jsx](components/CompetitionScanner.jsx)) is not "a component," it's a tarpit. Two state mutations away from a re-render storm. Algorithm step 3 cannot apply until step 2 has removed enough mass that splitting is even meaningful.
- **The scraper exists but cannot be trusted.** It runs daily, but it has no schema validation, no rollback on bad output, no detection that a previously-tracked event has died, and the standard run path requires an API key that the local environment doesn't have. The whole "daily-updated dossier" claim rests on a pipeline that nobody is monitoring.

---

## 2. Requirements That Are Dumb or Questionable

I'm inferring requirements from the code, README, and meta. Classification follows.

| # | Requirement / Assumption | Class | Why (tie to fundamentals) | Recommendation |
|---|---|---|---|---|
| R1 | "Daily-updated dossier of 100+ competitions" | **Essential** | The freshness IS the value. Stale = useless. | **KEEP** but enforce: a sweep that fails should not silently pass. |
| R2 | Hand-curated 100+-event JSON file | **Harmful** | Editing JSON-by-hand competes with the scraper and creates divergence. The repo already shows scraper output mixed with hand edits. | **MODIFY** — scraper is the writer; humans only edit a curated allowlist/blocklist. |
| R3 | Filter by 5 dimensions (level, timeline, scope, domain, field) | **Nice-to-have** | Power users want filters; new users want answers. Five filter dimensions on a 102-row dataset is over-engineered. | **MODIFY** — collapse to 2 dimensions (deadline + tag-search). Move the rest behind "advanced." |
| R4 | "Beginner Only" + "Free Only" toggles | **Nice-to-have** | Two filter toggles for what is also already a tag. Duplicates state. | **DELETE** — fold into tag search. |
| R5 | "Feeling Lucky" random-event button | **Harmful** | Engagement-pattern theater stolen from social feeds. This is a tool, not TikTok. | **DELETE.** Algorithm step 2. |
| R6 | Rotating manifesto (7 lines, 5.5s cycle) | **Harmful** | Visual noise that competes with the actual job (find a deadline). Also wastes a `setInterval` on every mount. | **DELETE.** Algorithm step 2. |
| R7 | About modal with 1,400-character explainer | **Nice-to-have** | Self-documenting UI is good. A 50-line modal is not. | **MODIFY** — collapse to a footer line + a `/about` link. |
| R8 | "Deadline Watch" widget (top 3 deadlines) | **Essential** | This is the actual product. It is currently a sidebar to a giant list. | **MODIFY — promote to default view.** |
| R9 | Bookmarks (in-component `Set`) | **Harmful** | Promises persistence, doesn't deliver. | **MODIFY** — back with `localStorage`. (5 lines of code. There is no excuse.) |
| R10 | `TODAY = new Date("2026-05-05")` hard-coded | **Harmful** | Wrong by definition the moment it ships. | **DELETE.** Use `new Date()`. |
| R11 | Status = `ongoing` / `upcoming` / `completed` (3-way) | **Essential** | Maps to user intent: can I do this now / soon / never. | **KEEP** but enforce by auto-refresh, not by Claude inference. (See R2.) |
| R12 | `level` taxonomy of 5 options (now 3 after pruning) | **Nice-to-have** | Mostly redundant with `eligibility` text. | **MODIFY** — keep but stop using as a primary filter. |
| R13 | `domains` + `fields` two-axis taxonomy | **Harmful** | "Domain" = Computer Science / Sciences. "Field" = AI / Cybersecurity. These are 80% overlapping in practice (everything CS-related ends up tagged both ways). Two filter dimensions for one mental model. | **MERGE** into a single `tags` array. The data already has `tags`; use it. |
| R14 | `prize_value_usd` as numeric sort key | **Essential** | Prize size is a real decision driver. | **KEEP.** |
| R15 | `companies` array (sponsors) | **Nice-to-have** | Rarely changes a decision. | **MODIFY** — keep in data, drop from card. Show only in detail modal. |
| R16 | `highlights` array (4 bullets) | **Essential** | This IS the scan-friendly summary. The verbose `summary` is the redundant one. | **KEEP highlights, demote summary.** |
| R17 | `companies` + `level` + `timeline` + `scope` + `domains` + `fields` + `difficulty` + `cost` + `tags` all on every card | **Harmful** | 9 metadata pills per card. Cognitive overload. The job is *scan and decide in <5 seconds*. | **MODIFY** — card shows: name, deadline countdown, prize, 1 tag line, location. Everything else in detail view. |
| R18 | Next.js + ISR + JSON-on-disk | **Essential** | Right architecture for read-heavy, daily-write data. | **KEEP.** |
| R19 | GitHub Actions daily cron | **Essential** | Free, reliable, matches data cadence. | **KEEP.** |
| R20 | Anthropic Claude as extractor | **Nice-to-have** | Works, but each new event costs ~$0.05 and the prompt is brittle. For 102 events at a 30-day average half-life, that's ~$1.50/month — fine for now, but unmonitored. | **KEEP for now**, but add a budget cap + fallback. |
| R21 | Single 1,434-line component file | **Harmful** | Touch the bookmark logic, risk breaking the deadline widget. | **DELETE** the monolith. Split. |
| R22 | "Soft launch" pre-tertiary cull last sweep | **Essential** (good call) | Pre-tertiary olympiads serve a different user with different mental models. | **KEEP the cut.** Don't backslide. |
| R23 | No user accounts, no email, no push | **Essential** for v2 simplicity | Accounts add 10× complexity. | **KEEP no-accounts**, but add an email digest opt-in (one form, no auth, RSS-style). |
| R24 | No search-by-keyword | **Essential gap** | Users have a specific event in mind ("does this index NASA Apps?"). A search box solves it for free. | **ADD** a full-text search box over name+org+tags. |
| R25 | Multi-region tagging (Singapore/ASEAN/US) baked into copy | **Nice-to-have** | Singapore-bias is legitimate (it's where the maintainer is), but the README still leads with "Singapore school olympiads" after we just deleted them. | **MODIFY** README to match what shipped. |

---

## 3. Deleted or Collapsed Parts

Mass cut, per algorithm step 2 — "the most common mistake of a smart engineer is to optimize a thing that should not exist."

- **DELETE rotating manifesto** ([CompetitionScanner.jsx](components/CompetitionScanner.jsx) `MANIFESTOS`, `RotatingManifesto`). Inspirational marquees are anti-utility. ~30 lines gone.
- **DELETE "Feeling Lucky" button.** Random ≠ relevant. ~10 lines gone.
- **DELETE the second filter dimension** (`fields` array). Merge into `tags`. Removes one filter UI, one taxonomy, ~40 lines.
- **DELETE the "Beginner Only" + "Free Only" toggles** as separate UI. They're tags; expose via tag search.
- **DELETE "completed" events from the default view.** They appear if explicitly filtered. Reduces visible list from 102 → 76 immediately.
- **DELETE the About modal.** Replace with a 2-line footer + a static `/about` page. ~80 lines gone.
- **DELETE the pinned `TODAY` constant.** It is a bug, not a feature.
- **DELETE the hand-edit-JSON workflow.** Move human curation to a `data/curated.json` allowlist/blocklist that the scraper merges. Single source of truth.
- **MERGE `domains` + `fields` taxonomies into one `tags`.** Already in the data; stop using the two separate axes.
- **MERGE `level` + `eligibility` + `difficulty` cognitive load into a single "fit" line on the card.** Three signals collapse into one rendered string.
- **MERGE the `summary` and `highlights` fields on display.** Show highlights inline; keep summary in JSON only for the detail modal.
- **MERGE the daily sweep + status refresh.** Right now, status drifts (the recent sweep had to flip 6 stale entries by hand). Make status a derived field, recomputed every page-build from `application_deadline` and `date`, not stored.
- **STOP TRACKING `companies`, `organizer`, `level`, `timeline`, `scope`, `domains`, `fields`, `difficulty` as eight separate axes** when nobody filters by 6 of them. Collapse into `tags`. The model spends Claude tokens on filling them; the user looks at none of them.

Net effect: **roughly 35–40% of the surface area should disappear** before a single new feature is added.

---

## 4. Optimized System Design — v2

### The minimal problem slice

A single page that answers, in 5 seconds: **"What closes in the next 30 days that's relevant to me?"** Everything else is a tab off that.

### Primary user

University student or early-career builder who already knows hackathons/fellowships exist, doesn't have time to scan 100 listings, and wants the next 2–3 deadlines that match their interests.

### Three flows. That's it.

**1. First-run (≤60 seconds).**
- Land → see top 5 deadlines closing soonest (deadline-radar default).
- One inline question: "What are you into?" → chip-select 2–4 tags (`ai`, `singapore`, `web3`, `climate`, `student`, `fellowship`, `online`, `beginner`).
- Tags persist in `localStorage`. No accounts.

**2. Daily loop (the actual product).**
- The default sort is *next deadline matching your tags*.
- One header strip: "N deadlines in next 7 days" / "M in next 30 days."
- Card shows: **name · countdown · prize · location · 2 tags.** That's it.
- Click card → detail panel with the full dossier and an apply link.

**3. Periodic review (weekly).**
- "What got added this week" section at the top, dismissible.
- Bookmark for follow-up; bookmarks have their own filter chip and persist.
- Optional: copy a one-line digest to clipboard / share URL with prefilled tags (so a maintainer can post "/?tags=ai,singapore" in a group chat).

### Data model — minimal

```ts
// data/events.json (one record per event)
type Event = {
  id: string;              // sha1(url|name)[0..12]
  name: string;
  organizer: string;
  url: string;
  apply_url: string;       // = url if not separately known
  location: string;        // "Singapore", "Online", "Cambridge, MA"
  date: string;            // human-readable: "9–11 June 2026"
  deadline: string | null; // ISO YYYY-MM-DD, or null if rolling/unknown
  prize_usd: number | null;
  prize_text: string;      // 1 sentence
  summary: string;         // 2–3 sentences
  highlights: string[];    // 3–4 bullets
  tags: string[];          // single flat tag taxonomy
  source: "scraper" | "curated";
  added_at: string;        // ISO timestamp
  last_seen_at: string;    // ISO timestamp (used to detect dead listings)
};
```

Removed fields: `companies`, `level`, `timeline`, `scope`, `domains`, `fields`, `difficulty`, `cost`, `beginner_friendly`, `eligibility`, `status`, `application_deadline` (renamed `deadline`), `application_url` (renamed `apply_url`).

`status` is **derived** at render time:
- `deadline < today` → `closed`
- `deadline ∈ [today, today+30]` → `closing-soon`
- else → `open`

`beginner_friendly`, `free` → just tags (`beginner`, `free`).

### Architecture

```
┌──────────────────────────────────────────────┐
│  GitHub Actions cron (daily, 01:00 UTC)      │
│  + on-push (smoke test)                      │
└──────────────┬───────────────────────────────┘
               ▼
┌──────────────────────────────────────────────┐
│  scraper/scrape.py                           │
│  - Discover candidates                       │
│  - Claude extract (capped to N new/run)      │
│  - Refresh statuses on existing              │
│  - Validate against schema                   │
│  - Diff: new / changed / dropped             │
│  - Atomic write events.json + meta.json      │
└──────────────┬───────────────────────────────┘
               ▼
┌──────────────────────────────────────────────┐
│  data/events.json (machine-managed)          │
│  data/curated.json (human allowlist+blocks)  │
│  data/meta.json (sweep stats)                │
└──────────────┬───────────────────────────────┘
               ▼
┌──────────────────────────────────────────────┐
│  Next.js (Vercel) — App Router, ISR 1h       │
│  components/                                 │
│   ├ DeadlineRadar.jsx        (default view)  │
│   ├ TagPicker.jsx            (onboarding)    │
│   ├ EventCard.jsx                            │
│   ├ EventDetail.jsx          (slide-over)    │
│   ├ Toolbar.jsx              (search+tags)   │
│   └ lib/eventModel.js        (derive status, │
│                              filter, sort)   │
└──────────────────────────────────────────────┘
```

Single page. No client-side router. No state manager. `localStorage` for bookmarks + tag profile. Pure functions for filtering/sorting in [lib/eventModel.js](lib/eventModel.js).

---

## 5. Cycle Time & Automation Plan

### Feedback loops to shorten

| Loop | Today | v2 target |
|---|---|---|
| User action → useful answer | 5–10 clicks (5 filters) | 0 clicks (default view IS the answer) |
| Maintainer edits curated event → live | Edit JSON, commit, redeploy | Same; already fast. |
| Scraper finds new event → live | Daily cron → commit → ISR (≤25h worst case) | Cron + on-success auto-deploy. **Add: validation prevents bad data from shipping.** |
| Stale status drift detection | Manual every ~2 weeks (this just happened) | Derived at render time. Zero drift. |
| Deploy build | Vercel default (~60s) | Keep; no change needed. |
| Local dev iteration | `npm run dev` | Keep. |

### Automation tiers

- **Fully automated:** candidate discovery, extraction, schema validation, status derivation, dead-link detection (`last_seen_at` > 14 days → flagged).
- **Semi-automated:** scraper writes new events to `data/events.json` but flags `source: scraper`; the maintainer reviews high-prize / high-visibility entries via a `pending: true` boolean before they show. *Cuts the "Claude hallucinated a fake event" risk to near zero.*
- **Manual only:** the curated allowlist (`data/curated.json`) for events the scraper can't find (private fellowships, invite-only, university-mailing-list-only).

### Three-phase rollout

- **Phase 1 (this PR):** Delete the dead surface. Fix `TODAY`. Persist bookmarks. Promote deadline-radar to default. Single source of truth for tags. Split the 1,434-line component.
- **Phase 2 (next):** Schema validation in scraper. Dead-link detection. Tag-based profile in `localStorage`. Search box.
- **Phase 3 (future):** Email/RSS digest opt-in (mailto-link → form submit → SQLite or Vercel KV). Auto-flag suspected duplicates. Use Claude to *score* event-tag fit instead of human-classifying.

Automation is **step 5** in the algorithm because automating a thing you haven't first deleted is how you build a 10,000-line system that does the wrong thing fast.

---

## 6. Biggest Risks & Open Questions

1. **The scraper hallucinates events that don't exist.** Today's safety net is "the maintainer eyeballs it." That doesn't scale.
   → **Next experiment:** before committing, hit each new event's URL with a HEAD request and reject 404s; flag-for-review entries whose Claude-claimed prize value doesn't appear in the raw page text.
2. **No one knows if the daily sweep is broken.** Cron runs but nothing pages anyone.
   → **Next experiment:** if `meta.last_sweep_iso` is more than 48h old, the home page shows a "data may be stale" banner. Free monitoring via the existing static-page render.
3. **Singapore-bias might be a feature or a bug.** Maintainer lives in Singapore; ASEAN audience is real; but >40% of events are SG-tagged and the rest of the world's users may bounce.
   → **Next experiment:** add a one-time region picker on first visit, default to "Global" if not set. Measure tag-click distribution from analytics (Vercel free tier has this).
4. **Tag taxonomy will sprawl** once we collapse everything into `tags`. Today there are tags like `singapore`, `tertiary`, `student-run`, `deadline-soon` — some are categorical, some are temporal, some are organizational.
   → **Next experiment:** maintain a `KNOWN_TAGS` constant; scraper's Claude prompt must choose from this list. Reject novel tags unless reviewed.
5. **"Closed" events still have informational value (next year's edition).** Deleting them from the view loses recurring-event awareness.
   → **Next experiment:** when an event flips to `closed`, surface a "next edition expected: <month>" derived from the recurring-tag (`annual`); collapse it into an "Alumni" tab instead of hiding entirely.
6. **No accounts means no real personalization.** `localStorage` only goes so far.
   → **Next experiment:** ship the tag profile + bookmarks in `localStorage` first; only add accounts if a clear "I want this across devices" signal emerges. Don't pre-build it.
7. **The Anthropic API key + cron is a single point of failure.** A revoked key silently breaks freshness.
   → **Next experiment:** scraper fails loud — on any non-2xx from Anthropic, write `meta.json` with `last_sweep_failed: true` so the site banner kicks in (per risk #2). Cheap to add.
