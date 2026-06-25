"use client";

import { Search, X, Bookmark } from "lucide-react";
import { ONBOARDING_TAGS } from "@/lib/tags";

export default function Toolbar({
  query,
  onQueryChange,
  tags,
  onTagsChange,
  showClosed,
  onShowClosedChange,
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

  return (
    <div className="border-y border-[var(--line)] bg-[var(--card)]/30 py-4 px-4 sm:px-6 lg:px-8 mb-6 sticky top-0 z-30 backdrop-blur">
      {/* Search + counter row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by name, organizer, tag…"
            className="w-full pl-10 pr-9 py-2 bg-[var(--bg)] border border-[var(--line)] text-[var(--paper)] text-[14px] font-mono focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--muted)]"
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

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.15em] text-[var(--muted)] uppercase whitespace-nowrap">
            {resultCount} / {totalCount} events
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-[var(--bg)] border border-[var(--line)] text-[var(--paper)] font-mono text-[10px] tracking-[0.1em] uppercase px-2 py-2 focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="deadline">Sort: Deadline</option>
            <option value="prize">Sort: Prize</option>
            <option value="name">Sort: A → Z</option>
          </select>
        </div>
      </div>

      {/* Tag chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {ONBOARDING_TAGS.map((t) => {
          const active = tags.includes(t.key);
          return (
            <button
              key={t.key}
              onClick={() => toggleTag(t.key)}
              className={`font-mono text-[10px] tracking-[0.1em] uppercase px-2.5 py-1 border transition-colors ${
                active
                  ? "bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]"
                  : "bg-transparent text-[#B8B0A0] border-[#2A2722] hover:border-[#4A453B]"
              }`}
            >
              {active ? "✓ " : ""}{t.label}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => onOnlyBookmarksChange(!onlyBookmarks)}
            className={`flex items-center gap-1 font-mono text-[10px] tracking-[0.1em] uppercase px-2.5 py-1 border transition-colors ${
              onlyBookmarks
                ? "bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]"
                : "text-[#B8B0A0] border-[#2A2722] hover:border-[#4A453B]"
            }`}
            title="Show only bookmarked events"
          >
            <Bookmark className="w-3 h-3" />
            Saved
          </button>
          <button
            onClick={() => onShowClosedChange(!showClosed)}
            className={`font-mono text-[10px] tracking-[0.1em] uppercase px-2.5 py-1 border transition-colors ${
              showClosed
                ? "bg-[var(--paper)] text-[var(--bg)] border-[var(--paper)]"
                : "text-[#B8B0A0] border-[#2A2722] hover:border-[#4A453B]"
            }`}
            title="Include events with passed deadlines"
          >
            {showClosed ? "Hide closed" : "Show closed"}
          </button>
        </div>
      </div>
    </div>
  );
}
