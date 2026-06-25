"use client";

import { Search, X, Bookmark } from "lucide-react";

const TOPIC_CHIPS = [
  { key: "ai",            label: "AI" },
  { key: "cybersecurity", label: "Cyber" },
  { key: "fintech",       label: "FinTech" },
  { key: "web3",          label: "Web3" },
  { key: "singapore",     label: "Singapore" },
  { key: "beginner",      label: "Beginner" },
];

export default function Toolbar({
  query,
  onQueryChange,
  tags,
  onTagsChange,
  onlyBookmarks,
  onOnlyBookmarksChange,
  resultCount,
  totalCount,
  sortBy,
  onSortChange,
}) {
  function toggleTag(tag) {
    const set = new Set(tags);
    if (set.has(tag)) set.delete(tag);
    else set.add(tag);
    onTagsChange([...set]);
  }

  const hasActiveTopicChips = tags.some((t) => TOPIC_CHIPS.some((c) => c.key === t));

  return (
    <div className="border-b border-[var(--line)] bg-[var(--card)]/30 px-4 sm:px-6 lg:px-8 py-3">
      {/* Row 1: search + sort + bookmarks */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search events, organizers…"
            className="w-full pl-10 pr-8 py-2 bg-[var(--bg)] border border-[var(--line)] text-[var(--paper)] text-[13px] font-mono focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--muted)]"
          />
          {query && (
            <button
              onClick={() => onQueryChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--muted)] hover:text-[var(--paper)]"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-[var(--bg)] border border-[var(--line)] text-[var(--paper)] font-mono text-[11px] tracking-[0.08em] uppercase px-3 py-2 focus:outline-none focus:border-[var(--accent)] shrink-0"
        >
          <option value="deadline">Deadline</option>
          <option value="prize">Prize</option>
          <option value="name">A → Z</option>
        </select>

        <button
          onClick={() => onOnlyBookmarksChange(!onlyBookmarks)}
          title="Show saved only"
          className={`flex items-center gap-1.5 px-3 py-2 border font-mono text-[11px] tracking-[0.08em] uppercase transition duration-150 shrink-0 ${
            onlyBookmarks
              ? "bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]"
              : "border-[var(--line)] text-[var(--muted)] hover:text-[var(--paper)] hover:border-[#3A3530]"
          }`}
        >
          <Bookmark className="w-3 h-3" />
          Saved
        </button>
      </div>

      {/* Row 2: topic chips + result count */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-[9px] tracking-[0.15em] text-[var(--muted)] uppercase mr-1 shrink-0">
          Filter
        </span>
        {TOPIC_CHIPS.map((t) => {
          const active = tags.includes(t.key);
          return (
            <button
              key={t.key}
              onClick={() => toggleTag(t.key)}
              className={`font-mono text-[10px] tracking-[0.08em] uppercase px-2.5 py-1 border transition duration-150 active:scale-[0.96] ${
                active
                  ? "bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]"
                  : "text-[var(--muted)] border-[var(--line)] hover:border-[#3A3530] hover:text-[var(--paper)]"
              }`}
            >
              {active ? "✓ " : ""}{t.label}
            </button>
          );
        })}
        {hasActiveTopicChips && (
          <button
            onClick={() => onTagsChange(tags.filter((t) => !TOPIC_CHIPS.some((c) => c.key === t)))}
            className="font-mono text-[10px] text-[var(--urgent)] hover:opacity-75 transition-opacity ml-1"
          >
            × clear
          </button>
        )}
        <span className="ml-auto font-mono text-[10px] tabular-nums text-[var(--muted)] shrink-0">
          {resultCount} / {totalCount}
        </span>
      </div>
    </div>
  );
}
