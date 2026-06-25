# Assumptions Log

Reasonable calls made during v2 without asking. If any are wrong, redirect and I'll back them out.

## Product / scope

1. **Primary user is a university student or early-career builder**, not a casual browser. The maintainer-style "feed" framing is being downgraded in favor of "tool that returns answers."
2. **Singapore bias is acceptable** but should not be the *only* default. The default region is "no filter" (show everything), but Singapore-tagged events naturally float up because of authorship bias.
3. **No accounts in v2.** `localStorage` profile only. Cross-device sync is a phase-3 problem if it ever becomes one.
4. **`closed` events are hidden by default** but reachable via a status filter chip. Not deleted from the dataset — the scraper still keeps them so we can detect recurring editions.
5. **Bookmarks are device-local.** Same as the profile.

## Tag taxonomy

6. The collapsed flat `tags` array is the **only** content taxonomy. `domains` and `fields` are deprecated as filter UI, but kept in JSON for backwards compat — `lib/eventModel.js` derives a merged `allTags(ev)` set.
7. **Canonical tag set** for v2 (covers >95% of the dataset I just saw):
   - **Region**: `singapore`, `india`, `asia`, `us`, `global`, `online`
   - **Track**: `ai`, `web3`, `cybersecurity`, `fintech`, `healthcare`, `sustainability`, `climate`, `space`
   - **Audience**: `student`, `tertiary`, `beginner-friendly`, `women`, `founder`
   - **Format**: `hackathon`, `fellowship`, `accelerator`, `pitch`, `olympiad`, `residency`, `scholarship`
   - **Urgency**: `deadline-soon` (auto-derived if `deadline` within 14 days; do not store)
   The existing `tags` arrays in `data/events.json` already use many of these; I'm normalizing rather than introducing a new system.
8. Tags shown on cards/onboarding are a **curated subset of ~10**, not the entire taxonomy. Power users can search.

## Data model

9. Field renames are **deferred** (no JSON migration in v2). Render code reads existing names via a small adapter in `lib/eventModel.js`. We can do the JSON rename in a later cleanup pass.
10. **`status` is derived** at render time but the existing stored `status` is used as a hint if `deadline` is missing.
11. `deadline` parses via `new Date(iso)`. If `application_deadline === null`, the event is treated as `open` (rolling) and sorted last.

## UI

12. Drop the Lucide-icon flood. Keep ~6 icons (`Search`, `Calendar`, `MapPin`, `Bookmark`, `ExternalLink`, `X`). Reduces bundle.
13. The slide-over detail panel replaces the current modal. Same content, smaller blast radius.
14. The hero on first visit is the TagPicker; after first visit, it's the DeadlineRadar.
15. Mobile is not a separate flow. Tailwind responsive utilities only; if it works at 375px wide, it ships.

## Engineering

16. **No new runtime deps.** No state library, no router, no react-query, no zustand. The product fits in `useState` + pure functions.
17. **Testing uses Node's built-in `node:test`** runner. No Jest, no Vitest. Cuts setup cost to zero.
18. **Linting is whatever Next.js gives by default.** Not adding ESLint configs.
19. **The scraper refactor is partial in v2.** Schema validation + atomic write + failure flag — but the file split (sources.py / extract.py / validate.py) is deferred to phase 2.
20. **`jsonschema` Python dep is avoided** in favor of a hand-rolled validator (~30 lines). Keeps `pip install` light.
21. **CRITIQUE.md, PLAN.md, ASSUMPTIONS.md stay in the repo** as living docs. They're cheap and they explain why the code looks the way it does.

## Things deliberately NOT done in v2

- Email digest opt-in (needs a backend).
- Account system.
- Server-side search index.
- Vector search / semantic match.
- Analytics integration.
- i18n.
- Dark/light theme toggle (the dark warm aesthetic is the brand).
- `data/curated.json` separation (deferred; current `events.json` is the single store).

If any of these matter for "ship a credible v2 today," tell me and I'll re-prioritize.
