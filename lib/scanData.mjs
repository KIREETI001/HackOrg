const REPO = "KIREETI001/HackOrg";
const REF_URL = `https://api.github.com/repos/${REPO}/git/ref/heads/main`;
const ARRAY_FIELDS = ["tags", "fields", "domains", "companies", "highlights"];
const TEXT_FIELDS = [
  "status", "location", "date", "prize", "summary", "eligibility",
  "application_deadline", "deadline", "application_url", "cost", "level", "scope",
];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isHttpUrl(value) {
  if (typeof value !== "string") return false;
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

// Reject a malformed update as a whole so a good snapshot remains usable.
export function validateScanData({ events, meta }) {
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error("Scan events must be a nonempty array");
  }
  const ids = new Set();
  for (const event of events) {
    if (!isObject(event) || ["id", "name", "organizer"].some(
      (field) => typeof event[field] !== "string" || !event[field].trim()
    ) || !isHttpUrl(event.url)) {
      throw new Error("Scan contains an invalid event");
    }
    if (ids.has(event.id)) throw new Error("Scan contains duplicate event IDs");
    ids.add(event.id);
    for (const field of ARRAY_FIELDS) {
      if (event[field] != null && (!Array.isArray(event[field]) ||
        event[field].some((value) => typeof value !== "string"))) {
        throw new Error(`Invalid event ${field}`);
      }
    }
    for (const field of TEXT_FIELDS) {
      if (event[field] != null && typeof event[field] !== "string") {
        throw new Error(`Invalid event ${field}`);
      }
    }
    for (const field of ["application_deadline", "deadline"]) {
      if (event[field] && !Number.isFinite(Date.parse(event[field]))) {
        throw new Error(`Invalid event ${field}`);
      }
    }
    if (event.application_url && !isHttpUrl(event.application_url)) {
      throw new Error("Invalid event application_url");
    }
    if (event.prize_value_usd != null &&
      (typeof event.prize_value_usd !== "number" || !Number.isFinite(event.prize_value_usd))) {
      throw new Error("Invalid event prize_value_usd");
    }
    if (event.beginner_friendly != null && typeof event.beginner_friendly !== "boolean") {
      throw new Error("Invalid event beginner_friendly");
    }
  }
  if (!isObject(meta) || typeof meta.last_sweep_iso !== "string" ||
    !Number.isFinite(Date.parse(meta.last_sweep_iso)) ||
    typeof meta.last_sweep !== "string" || !meta.last_sweep.trim() ||
    meta.total_events !== events.length ||
    (meta.last_sweep_failed != null && typeof meta.last_sweep_failed !== "boolean")) {
    throw new Error("Scan metadata is invalid or does not match the events");
  }
  return { events, meta };
}

// The caller caches only a complete, validated result. All three requests share
// a deadline, and both data files come from one immutable Git commit.
export async function fetchScanData({ fetchImpl = fetch, timeoutMs = 10000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  async function readJson(url) {
    const response = await fetchImpl(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/vnd.github+json", "User-Agent": "HackOrg" },
    });
    if (!response.ok) throw new Error(`Scan source returned HTTP ${response.status}`);
    return response.json();
  }
  try {
    const ref = await readJson(REF_URL);
    const sha = ref?.object?.sha;
    if (typeof sha !== "string" || !/^[a-f0-9]{40}$/.test(sha)) {
      throw new Error("Scan source returned an invalid commit");
    }
    const base = `https://raw.githubusercontent.com/${REPO}/${sha}/data`;
    const [events, meta] = await Promise.all([
      readJson(`${base}/events.json`),
      readJson(`${base}/meta.json`),
    ]);
    return validateScanData({ events, meta });
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

export async function loadScanData({ readSnapshot, fallback, onError = () => {} }) {
  try {
    const snapshot = validateScanData(await readSnapshot());
    // The data cache survives deployments; a newly bundled scan may be newer.
    return Date.parse(snapshot.meta.last_sweep_iso) >= Date.parse(fallback.meta.last_sweep_iso)
      ? snapshot : fallback;
  } catch (error) {
    onError(error);
    // Keep the original sweep timestamp and failure flag. Fetching the page is
    // not a scan, so it must never make old data appear freshly checked.
    return fallback;
  }
}
