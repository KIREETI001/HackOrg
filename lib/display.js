// Presentation helpers shared by the list, the "closing next" strip and the detail drawer.
import { ONBOARDING_TAGS } from "./tags";

const LABELS = Object.fromEntries(ONBOARDING_TAGS.map((t) => [t.key, t.label]));
const SPECIAL = { iot: "IoT", web3: "Web3", fintech: "FinTech", opencv: "OpenCV", devpost: "Devpost", github: "GitHub", openai: "OpenAI", nvidia: "NVIDIA", ibm: "IBM", llm: "LLM", llms: "LLMs", genai: "GenAI", edtech: "EdTech", healthtech: "HealthTech", agritech: "AgriTech", "student-run": "Student-run" };

export function tagLabel(key) {
  const k = String(key).toLowerCase();
  if (LABELS[k]) return LABELS[k];
  if (SPECIAL[k]) return SPECIAL[k];
  if (/^[a-z]{2,3}$/.test(k)) return k.toUpperCase();
  return k.replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

// Semantic urgency colours: red within a week, amber within a month, neutral otherwise.
export function urgencyTone(days) {
  if (days === null || days === undefined) return { fg: "var(--ink-3)", bg: "transparent" };
  if (days < 0) return { fg: "var(--ink-3)", bg: "transparent" };
  if (days <= 7) return { fg: "var(--urgent)", bg: "var(--urgent-soft)" };
  if (days <= 30) return { fg: "var(--soon)", bg: "var(--soon-soft)" };
  return { fg: "var(--ink)", bg: "transparent" };
}

export function countdownParts(days) {
  if (days === null || days === undefined) return { big: "–", small: "rolling" };
  if (days < 0) return { big: String(-days), small: -days === 1 ? "day ago" : "days ago" };
  if (days === 0) return { big: "0", small: "closes today" };
  return { big: String(days), small: days === 1 ? "day left" : "days left" };
}

export function niceDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Agenda groups for the deadline-sorted list.
export function groupOf(days) {
  if (days === null || days === undefined) return { key: "rolling", label: "Rolling or no fixed deadline" };
  if (days < 0) return { key: "closed", label: "Already closed" };
  if (days <= 6) return { key: "week", label: "Closing this week" };
  if (days <= 13) return { key: "next", label: "Next week" };
  if (days <= 31) return { key: "month", label: "Within a month" };
  return { key: "later", label: "Later" };
}
