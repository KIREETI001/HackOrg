// Pure event-model helpers. No React, no DOM, no storage.
// These are the only place that knows the shape of the events.json record.

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysUntil(isoDate, ref = today()) {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - ref.getTime()) / MS_PER_DAY);
}

export function formatDate(isoDate) {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return null;
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

// Derive a status from the deadline (and fall back to the stored value).
// Output: "open" | "closing-soon" | "closed" | "rolling"
export function deriveStatus(event, ref = today()) {
  const days = daysUntil(event.application_deadline ?? event.deadline, ref);
  if (days !== null) {
    if (days < 0) return "closed";
    if (days <= 30) return "closing-soon";
    return "open";
  }
  // No deadline — fall back to stored status hint.
  const s = event.status;
  if (s === "completed") return "closed";
  if (s === "upcoming") return "open";
  return "rolling";
}

// Bucket for the deadline countdown color.
export function urgencyBucket(days) {
  if (days === null || days === undefined) return null;
  if (days < 0) return "expired";
  if (days <= 7) return "urgent";
  if (days <= 30) return "soon";
  return "ok";
}

// Collapse the old (domains, fields, tags, beginner_friendly, cost) into one flat tag set.
export function allTags(event) {
  const out = new Set();
  for (const t of event.tags || []) out.add(String(t).toLowerCase());
  for (const f of event.fields || []) out.add(normalizeField(f));
  for (const d of event.domains || []) out.add(normalizeField(d));
  if (event.beginner_friendly) out.add("beginner");
  if (event.cost === "Free") out.add("free");
  if (event.cost === "Paid") out.add("paid");
  if (event.level === "Tertiary") out.add("student");
  if (event.scope === "Local (Singapore)") out.add("singapore");
  if (event.scope === "Regional (Asia)") out.add("asia");
  if (event.scope === "Global") out.add("global");
  return out;
}

function normalizeField(s) {
  return String(s)
    .toLowerCase()
    .replace(/\s*\/\s*/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Pretty USD label: $1.2M / $300K / $5K.
export function formatPrize(usd) {
  if (!usd || usd < 1000) return null;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 100_000) return `$${Math.round(usd / 1000)}K`;
  return `$${Math.round(usd / 1000)}K`;
}

// Single filter+sort pipeline.
// opts: { query, tags: string[], showClosed: boolean, bookmarkedIds: Set<string>, sortBy: "deadline"|"prize"|"name" }
export function filterAndSort(events, opts = {}) {
  const {
    query = "",
    tags = [],
    showClosed = false,
    onlyBookmarks = false,
    bookmarkedIds = new Set(),
    sortBy = "deadline",
  } = opts;

  const q = query.trim().toLowerCase();
  const ref = today();

  let out = events.map((e) => ({
    ...e,
    _days: daysUntil(e.application_deadline ?? e.deadline, ref),
    _status: deriveStatus(e, ref),
    _tags: allTags(e),
  }));

  if (!showClosed) {
    out = out.filter((e) => e._status !== "closed");
  }

  if (onlyBookmarks) {
    out = out.filter((e) => bookmarkedIds.has(e.id));
  }

  if (tags.length) {
    out = out.filter((e) => tags.every((t) => e._tags.has(t)));
  }

  if (q) {
    out = out.filter((e) => {
      const hay = [
        e.name,
        e.organizer,
        e.location,
        ...(e.tags || []),
        ...(e.companies || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  out.sort((a, b) => {
    if (sortBy === "prize") {
      return (b.prize_value_usd || 0) - (a.prize_value_usd || 0);
    }
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    // deadline (default): events without a deadline go last; closed-but-shown go after open.
    const ax = a._days === null ? Infinity : a._days < 0 ? 1_000_000 + Math.abs(a._days) : a._days;
    const bx = b._days === null ? Infinity : b._days < 0 ? 1_000_000 + Math.abs(b._days) : b._days;
    return ax - bx;
  });

  return out;
}

// For the DeadlineRadar widget: top N upcoming deadlines that match optional tags.
export function nextDeadlines(events, { tags = [], limit = 5 } = {}) {
  const ref = today();
  return events
    .map((e) => ({ ...e, _days: daysUntil(e.application_deadline ?? e.deadline, ref), _tags: allTags(e) }))
    .filter((e) => e._days !== null && e._days >= 0)
    .filter((e) => (tags.length ? tags.every((t) => e._tags.has(t)) : true))
    .sort((a, b) => a._days - b._days)
    .slice(0, limit);
}
