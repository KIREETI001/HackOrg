import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fetchScanData, loadScanData, validateScanData } from "../lib/scanData.mjs";

const SHA = "a".repeat(40);
function snapshot(iso = "2026-09-06T12:00:00Z") {
  return {
    events: [{ id: "event-1", name: "Hackathon", organizer: "University", url: "https://example.com/event" }],
    meta: { last_sweep: "06 SEP 2026", last_sweep_iso: iso, total_events: 1, last_sweep_failed: false },
  };
}
function remoteFetch(data, calls = []) {
  return async (url, options) => {
    calls.push({ url, options });
    const body = url.includes("api.github.com") ? { object: { sha: SHA } }
      : url.endsWith("events.json") ? data.events : data.meta;
    return { ok: true, json: async () => body };
  };
}

test("fetches both data files at the same immutable commit without credentials", async () => {
  const data = snapshot();
  const calls = [];
  assert.deepEqual(await fetchScanData({ fetchImpl: remoteFetch(data, calls) }), data);
  assert.equal(calls.length, 3);
  assert.match(calls[0].url, /\/git\/ref\/heads\/main$/);
  for (const call of calls.slice(1)) assert.ok(call.url.includes(`/${SHA}/data/`));
  for (const { options } of calls) {
    assert.equal(options.cache, "no-store");
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.headers.Authorization, undefined);
  }
});

test("a failed or malformed response rejects before it can replace cached data", async () => {
  await assert.rejects(fetchScanData({ fetchImpl: async () => ({ ok: false, status: 503 }) }), /HTTP 503/);
  await assert.rejects(fetchScanData({ fetchImpl: async () => ({ ok: true, json: async () => ({ object: { sha: "main" } }) }) }), /invalid commit/);
  const data = snapshot();
  data.meta.total_events = 2;
  await assert.rejects(fetchScanData({ fetchImpl: remoteFetch(data) }), /does not match/);
});

test("one shared timeout bounds GitHub requests", async () => {
  await assert.rejects(fetchScanData({
    timeoutMs: 10,
    fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    }),
  }), /aborted/);
});

test("validates renderer field types, dates, IDs, URLs, and paired metadata", () => {
  const invalid = [
    (data) => { data.events[0].tags = "ai"; },
    (data) => { data.events[0].highlights = [{}]; },
    (data) => { data.events[0].location = {}; },
    (data) => { data.events[0].application_deadline = "not a date"; },
    (data) => { data.events[0].application_url = "javascript:alert(1)"; },
    (data) => { data.events[0].prize_value_usd = "500"; },
    (data) => { data.events.push({ ...data.events[0] }); data.meta.total_events = 2; },
    (data) => { data.meta.last_sweep_iso = "not a date"; },
    (data) => { data.meta.last_sweep_failed = "false"; },
  ];
  for (const mutate of invalid) {
    const data = snapshot();
    mutate(data);
    assert.throws(() => validateScanData(data));
  }
});

test("the repository's current dataset passes runtime validation", async () => {
  const [events, meta] = await Promise.all(["events", "meta"].map(async (name) =>
    JSON.parse(await readFile(new URL(`../data/${name}.json`, import.meta.url), "utf8"))
  ));
  assert.equal(validateScanData({ events, meta }).events.length, events.length);
});

test("uses newer remote data while preserving the original sweep metadata", async () => {
  const fallback = snapshot("2026-06-25T00:00:00Z");
  const remote = snapshot();
  const result = await loadScanData({ readSnapshot: async () => remote, fallback });
  assert.deepEqual(result, remote);
  assert.equal(result.meta.last_sweep_iso, remote.meta.last_sweep_iso);
});

test("a cold fetch failure preserves bundled data and its true freshness", async () => {
  const fallback = snapshot("2026-06-25T00:00:00Z");
  fallback.meta.last_sweep_failed = true;
  const result = await loadScanData({ readSnapshot: async () => { throw new Error("offline"); }, fallback });
  assert.equal(result, fallback);
  assert.equal(result.meta.last_sweep_iso, "2026-06-25T00:00:00Z");
  assert.equal(result.meta.last_sweep_failed, true);
});

test("older persisted data never replaces a newer bundled snapshot", async () => {
  const fallback = snapshot();
  const result = await loadScanData({ readSnapshot: async () => snapshot("2026-06-25T00:00:00Z"), fallback });
  assert.equal(result, fallback);
});
