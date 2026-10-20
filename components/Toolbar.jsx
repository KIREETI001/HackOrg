"use client";

import { Search, X, Bookmark } from "lucide-react";

const TOPIC_CHIPS = [
  { key: "ai", label: "AI" },
  { key: "cybersecurity", label: "Cybersecurity" },
  { key: "fintech", label: "FinTech" },
  { key: "web3", label: "Web3" },
  { key: "healthcare", label: "Healthcare" },
  { key: "singapore", label: "Singapore" },
  { key: "beginner", label: "Beginner-friendly" },
];

export default function Toolbar({
  query, onQueryChange, tags, onTagsChange, onlyBookmarks, onOnlyBookmarksChange,
  resultCount, totalCount, sortBy, onSortChange,
}) {
  function toggleTag(tag) {
    const set = new Set(tags);
    set.has(tag) ? set.delete(tag) : set.add(tag);
    onTagsChange([...set]);
  }
  const activeTopics = tags.filter((t) => TOPIC_CHIPS.some((c) => c.key === t));

  return (
    <div className="py-3 flex flex-col gap-3">
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
        <label className="relative flex-1 min-w-full sm:min-w-0">
          <span className="sr-only">Search</span>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-3)]" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by name, organiser or topic"
            className="w-full pl-10 pr-9 py-2.5 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:border-[var(--accent)]"
          />
          {query && (
            <button
              onClick={() => onQueryChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-[var(--ink-3)] hover:text-[var(--ink)]"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </label>

        <label className="shrink-0 flex-1 sm:flex-none">
          <span className="sr-only">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full sm:w-auto rounded-lg bg-[var(--surface)] border border-[var(--line)] text-[15px] text-[var(--ink)] px-3 py-2.5 focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="deadline">Soonest deadline</option>
            <option value="prize">Biggest prize</option>
            <option value="name">Name</option>
          </select>
        </label>

        <button
          onClick={() => onOnlyBookmarksChange(!onlyBookmarks)}
          aria-pressed={onlyBookmarks}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-[15px] transition-colors ${
            onlyBookmarks
              ? "bg-[var(--accent)] border-[var(--accent)] text-white"
              : "bg-[var(--surface)] border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink-3)]"
          }`}
        >
          <Bookmark className="w-4 h-4" aria-hidden="true" />
          <span>Saved</span>
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto sm:flex-wrap -mx-1 px-1 pb-1 sm:pb-0 [scrollbar-width:none]">
        {TOPIC_CHIPS.map((t) => {
          const active = tags.includes(t.key);
          return (
            <button
              key={t.key}
              onClick={() => toggleTag(t.key)}
              aria-pressed={active}
              className={`shrink-0 text-[14px] px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] font-medium"
                  : "border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--ink-3)]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
        {activeTopics.length > 0 && (
          <button
            onClick={() => onTagsChange(tags.filter((t) => !TOPIC_CHIPS.some((c) => c.key === t)))}
            className="shrink-0 text-[14px] text-[var(--accent)] hover:underline underline-offset-4 ml-1"
          >
            Clear topics
          </button>
        )}
        <span className="hidden sm:inline ml-auto text-[14px] tabular-nums text-[var(--ink-3)]">
          Showing {resultCount} of {totalCount}
        </span>
      </div>
    </div>
  );
}
