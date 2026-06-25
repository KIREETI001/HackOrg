// Smoke test for data/events.json — catches schema regressions early.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVENTS_PATH = join(__dirname, "..", "data", "events.json");
const META_PATH = join(__dirname, "..", "data", "meta.json");

const REQUIRED = ["id", "name", "url", "organizer"];

test("events.json parses as a JSON array", async () => {
  const raw = await readFile(EVENTS_PATH, "utf8");
  const events = JSON.parse(raw);
  assert.ok(Array.isArray(events), "expected an array");
  assert.ok(events.length > 0, "expected at least one event");
});

test("every event has required fields", async () => {
  const raw = await readFile(EVENTS_PATH, "utf8");
  const events = JSON.parse(raw);
  for (const e of events) {
    for (const f of REQUIRED) {
      assert.ok(e[f] && typeof e[f] === "string", `event ${e.id || "?"} missing ${f}`);
    }
  }
});

test("every event id is unique", async () => {
  const raw = await readFile(EVENTS_PATH, "utf8");
  const events = JSON.parse(raw);
  const ids = events.map((e) => e.id);
  const unique = new Set(ids);
  assert.equal(unique.size, ids.length, "duplicate event ids detected");
});

test("every event URL is http(s)", async () => {
  const raw = await readFile(EVENTS_PATH, "utf8");
  const events = JSON.parse(raw);
  for (const e of events) {
    assert.match(e.url, /^https?:\/\//, `event ${e.id} url is not http(s): ${e.url}`);
  }
});

test("application_deadline (when present) parses as a date", async () => {
  const raw = await readFile(EVENTS_PATH, "utf8");
  const events = JSON.parse(raw);
  for (const e of events) {
    if (!e.application_deadline) continue;
    const d = new Date(e.application_deadline);
    assert.ok(!isNaN(d.getTime()), `event ${e.id} has invalid deadline: ${e.application_deadline}`);
  }
});

test("meta.json includes last_sweep_iso", async () => {
  const raw = await readFile(META_PATH, "utf8");
  const meta = JSON.parse(raw);
  assert.ok(meta.last_sweep_iso, "meta.last_sweep_iso missing");
  const d = new Date(meta.last_sweep_iso);
  assert.ok(!isNaN(d.getTime()), "meta.last_sweep_iso is not a valid date");
});
