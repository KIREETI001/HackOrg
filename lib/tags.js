// Canonical tag taxonomy for v2.
// The TagPicker uses the curated subset; full-text search reads any tag.

export const ONBOARDING_TAGS = [
  { key: "ai", label: "AI" },
  { key: "web3", label: "Web3" },
  { key: "cybersecurity", label: "Cybersecurity" },
  { key: "fintech", label: "FinTech" },
  { key: "healthcare", label: "Healthcare" },
  { key: "sustainability", label: "Sustainability / Climate" },
  { key: "singapore", label: "Singapore" },
  { key: "asia", label: "Asia" },
  { key: "global", label: "Global / Online" },
  { key: "hackathon", label: "Hackathon" },
  { key: "fellowship", label: "Fellowship" },
  { key: "accelerator", label: "Accelerator / Startup" },
  { key: "beginner-friendly", label: "Beginner-Friendly" },
  { key: "free", label: "Free" },
];

const ALIAS = {
  climate: "sustainability",
  blockchain: "web3",
  "machine-learning": "ai",
  "ml": "ai",
  "general-tech": "general",
  "student-run": "student",
};

export function canonicalTag(t) {
  const k = String(t).toLowerCase();
  return ALIAS[k] || k;
}
