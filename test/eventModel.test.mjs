// Pure-fn tests for lib/eventModel.js — no React, no DOM.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  daysUntil,
  deriveStatus,
  urgencyBucket,
  allTags,
  formatPrize,
  filterAndSort,
  nextDeadlines,
} from "../lib/eventModel.mjs";

const REF = new Date("2026-05-17T00:00:00Z");
REF.setHours(0, 0, 0, 0);

test("daysUntil returns positive integer for future date", () => {
  assert.equal(daysUntil("2026-05-27", REF), 10);
});

test("daysUntil returns negative integer for past date", () => {
  assert.equal(daysUntil("2026-05-10", REF), -7);
});

test("daysUntil returns null for missing/invalid input", () => {
  assert.equal(daysUntil(null, REF), null);
  assert.equal(daysUntil("not-a-date", REF), null);
});

test("deriveStatus: deadline > 30d away = open", () => {
  const ev = { application_deadline: "2026-08-01" };
  assert.equal(deriveStatus(ev, REF), "open");
});

test("deriveStatus: deadline within 30d = closing-soon", () => {
  const ev = { application_deadline: "2026-06-01" };
  assert.equal(deriveStatus(ev, REF), "closing-soon");
});

test("deriveStatus: deadline in the past = closed", () => {
  const ev = { application_deadline: "2026-04-01" };
  assert.equal(deriveStatus(ev, REF), "closed");
});

test("deriveStatus: no deadline + status=completed = closed", () => {
  const ev = { application_deadline: null, status: "completed" };
  assert.equal(deriveStatus(ev, REF), "closed");
});

test("deriveStatus: no deadline + status=upcoming = open", () => {
  const ev = { application_deadline: null, status: "upcoming" };
  assert.equal(deriveStatus(ev, REF), "open");
});

test("urgencyBucket bands", () => {
  assert.equal(urgencyBucket(-1), "expired");
  assert.equal(urgencyBucket(0), "urgent");
  assert.equal(urgencyBucket(7), "urgent");
  assert.equal(urgencyBucket(8), "soon");
  assert.equal(urgencyBucket(30), "soon");
  assert.equal(urgencyBucket(31), "ok");
  assert.equal(urgencyBucket(null), null);
});

test("allTags collapses domains+fields+booleans into one set", () => {
  const ev = {
    tags: ["singapore", "ai"],
    fields: ["AI / Machine Learning"],
    domains: ["Computer Science"],
    beginner_friendly: true,
    cost: "Free",
    scope: "Local (Singapore)",
    level: "Tertiary",
  };
  const t = allTags(ev);
  assert.ok(t.has("singapore"));
  assert.ok(t.has("ai"));
  assert.ok(t.has("free"));
  assert.ok(t.has("beginner"));
  assert.ok(t.has("student"));
  assert.ok(t.has("computer-science"));
});

test("formatPrize formats USD nicely", () => {
  assert.equal(formatPrize(500), null);
  assert.equal(formatPrize(5000), "$5K");
  assert.equal(formatPrize(50000), "$50K");
  assert.equal(formatPrize(300000), "$300K");
  assert.equal(formatPrize(1_500_000), "$1.5M");
});

test("filterAndSort hides closed by default", () => {
  const events = [
    { id: "a", name: "Past", organizer: "x", application_deadline: "2026-04-01" },
    { id: "b", name: "Future", organizer: "x", application_deadline: "2026-08-01" },
  ];
  const out = filterAndSort(events, { sortBy: "deadline" });
  assert.equal(out.length, 1);
  assert.equal(out[0].id, "b");
});

test("filterAndSort: tag filter requires ALL tags", () => {
  const events = [
    { id: "a", name: "AI SG", organizer: "x", application_deadline: "2026-08-01", tags: ["singapore", "ai"] },
    { id: "b", name: "Just AI", organizer: "x", application_deadline: "2026-08-01", tags: ["ai"] },
    { id: "c", name: "Just SG", organizer: "x", application_deadline: "2026-08-01", tags: ["singapore"] },
  ];
  const out = filterAndSort(events, { tags: ["singapore", "ai"] });
  assert.equal(out.length, 1);
  assert.equal(out[0].id, "a");
});

test("filterAndSort: query searches name+organizer+tags", () => {
  const events = [
    { id: "a", name: "Some Hackathon", organizer: "Anthropic", application_deadline: "2026-08-01", tags: [] },
    { id: "b", name: "Other Event", organizer: "Google", application_deadline: "2026-08-01", tags: ["ai"] },
  ];
  assert.equal(filterAndSort(events, { query: "anthropic" }).length, 1);
  assert.equal(filterAndSort(events, { query: "ai" }).length, 1);
  assert.equal(filterAndSort(events, { query: "nope" }).length, 0);
});

test("filterAndSort sorts by deadline ascending", () => {
  const events = [
    { id: "far", name: "z", organizer: "x", application_deadline: "2026-09-01" },
    { id: "near", name: "a", organizer: "x", application_deadline: "2026-06-01" },
    { id: "mid", name: "m", organizer: "x", application_deadline: "2026-07-01" },
  ];
  const out = filterAndSort(events, { sortBy: "deadline" });
  assert.deepEqual(out.map((e) => e.id), ["near", "mid", "far"]);
});

test("filterAndSort sorts by prize desc", () => {
  const events = [
    { id: "a", name: "a", organizer: "x", application_deadline: "2026-08-01", prize_value_usd: 100 },
    { id: "b", name: "b", organizer: "x", application_deadline: "2026-08-01", prize_value_usd: 50_000 },
  ];
  const out = filterAndSort(events, { sortBy: "prize" });
  assert.equal(out[0].id, "b");
});

test("filterAndSort: onlyBookmarks intersects with bookmarkedIds", () => {
  const events = [
    { id: "a", name: "a", organizer: "x", application_deadline: "2026-08-01" },
    { id: "b", name: "b", organizer: "x", application_deadline: "2026-08-01" },
  ];
  const out = filterAndSort(events, { onlyBookmarks: true, bookmarkedIds: new Set(["b"]) });
  assert.equal(out.length, 1);
  assert.equal(out[0].id, "b");
});

test("nextDeadlines returns up-to-N upcoming sorted ascending", () => {
  const events = [
    { id: "past", name: "p", organizer: "x", application_deadline: "2026-04-01" },
    { id: "soon", name: "s", organizer: "x", application_deadline: "2026-05-20" },
    { id: "later", name: "l", organizer: "x", application_deadline: "2026-06-20" },
  ];
  const out = nextDeadlines(events, { limit: 5 });
  assert.equal(out.length, 2);
  assert.equal(out[0].id, "soon");
});
