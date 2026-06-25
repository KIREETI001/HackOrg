"use client";

import { useEffect, useMemo, useState } from "react";
import StaleBanner from "./StaleBanner";
import DeadlineRadar from "./DeadlineRadar";
import StatusTabs from "./StatusTabs";
import Toolbar from "./Toolbar";
import EventCard from "./EventCard";
import EventDetail from "./EventDetail";
import { filterAndSort, statusCounts } from "@/lib/eventModel";
import { loadProfile, saveProfile, loadBookmarks, saveBookmarks } from "@/lib/storage";
import TriggerScanButton from "./TriggerScanButton";

export default function Scanner({ events = [], meta = {} }) {
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [tags, setTags] = useState([]);
  const [bookmarks, setBookmarks] = useState(() => new Set());

  const [query, setQuery] = useState("");
  const [statusBucket, setStatusBucket] = useState("open");
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);
  const [sortBy, setSortBy] = useState("deadline");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const p = loadProfile();
    setTags(p.tags ?? []);
    setBookmarks(loadBookmarks());
    setProfileLoaded(true);
  }, []);

  useEffect(() => {
    if (!profileLoaded) return;
    saveProfile({ tags, onboarded: true });
  }, [tags, profileLoaded]);

  useEffect(() => {
    if (!profileLoaded) return;
    saveBookmarks(bookmarks);
  }, [bookmarks, profileLoaded]);

  const counts = useMemo(() => statusCounts(events), [events]);

  const filtered = useMemo(
    () =>
      filterAndSort(events, {
        query,
        tags,
        statusBucket,
        onlyBookmarks,
        bookmarkedIds: bookmarks,
        sortBy,
      }),
    [events, query, tags, statusBucket, onlyBookmarks, bookmarks, sortBy]
  );

  function toggleBookmark(id) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--paper)]">
      <StaleBanner meta={meta} />

      {/* Hero */}
      <header className="border-b border-[var(--line)] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-[1280px] mx-auto">
          <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.25em] text-[var(--accent)] uppercase mb-3">
            Field Station · v3
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] text-balance text-[var(--paper)] mb-3 max-w-3xl">
            The next door that closes.{" "}
            <span className="italic font-light text-[var(--accent)]">Before it does.</span>
          </h1>
          <p className="text-[14px] sm:text-[15px] text-pretty text-[#B8B0A0] max-w-2xl">
            {events.length} hackathons, fellowships and accelerators — sorted by what closes next.
          </p>
        </div>
      </header>

      {/* Closing-soon strip — hidden on Ended tab (irrelevant there) */}
      {statusBucket !== "ended" && (
        <DeadlineRadar events={events} tags={tags} onSelect={setSelected} />
      )}

      {/* Sticky nav: status tabs + toolbar stacked together */}
      <div className="sticky top-0 z-30 backdrop-blur bg-[var(--bg)]/95">
        <div className="border-b border-[var(--line)] px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1280px] mx-auto">
            <StatusTabs counts={counts} active={statusBucket} onChange={setStatusBucket} />
          </div>
        </div>

        <Toolbar
        query={query}
        onQueryChange={setQuery}
        tags={tags}
        onTagsChange={setTags}
        onlyBookmarks={onlyBookmarks}
        onOnlyBookmarksChange={setOnlyBookmarks}
        resultCount={filtered.length}
        totalCount={counts[statusBucket] ?? events.length}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      </div>

      <main className="px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        <div className="max-w-[1280px] mx-auto">
          {filtered.length === 0 ? (
            <div className="border border-dashed border-[var(--line)] p-10 text-center mt-2">
              <div className="font-mono text-[11px] tracking-[0.2em] text-[var(--muted)] uppercase mb-2">
                No matches
              </div>
              <p className="text-[14px] text-[#B8B0A0]">
                Try removing a filter, clearing the search, or switching tabs.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filtered.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  onSelect={setSelected}
                  isBookmarked={bookmarks.has(e.id)}
                  onToggleBookmark={toggleBookmark}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-[var(--line)] px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 font-mono text-[10px] tracking-[0.15em] text-[var(--muted)] uppercase">
          <span>
            Field Station · {meta.total_events ?? events.length} events · last sweep {meta.last_sweep || "—"}
          </span>
          <span>
            Built as an antidote to "I never hear about cool things in time."
          </span>
          <TriggerScanButton className="text-[var(--muted)] hover:text-[var(--paper)]" />
        </div>
      </footer>

      {selected && (
        <EventDetail
          event={selected}
          onClose={() => setSelected(null)}
          isBookmarked={bookmarks.has(selected.id)}
          onToggleBookmark={toggleBookmark}
        />
      )}
    </div>
  );
}
