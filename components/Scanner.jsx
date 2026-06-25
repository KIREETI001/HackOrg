"use client";

import { useEffect, useMemo, useState } from "react";
import StaleBanner from "./StaleBanner";
import DeadlineRadar from "./DeadlineRadar";
import TagPicker from "./TagPicker";
import Toolbar from "./Toolbar";
import EventCard from "./EventCard";
import EventDetail from "./EventDetail";
import { filterAndSort } from "@/lib/eventModel";
import { loadProfile, saveProfile, loadBookmarks, saveBookmarks } from "@/lib/storage";
import TriggerScanButton from "./TriggerScanButton";

export default function Scanner({ events = [], meta = {} }) {
  // Profile / onboarding
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [tags, setTags] = useState([]);
  const [onboarded, setOnboarded] = useState(false);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState(() => new Set());

  // UI state
  const [query, setQuery] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [onlyBookmarks, setOnlyBookmarks] = useState(false);
  const [sortBy, setSortBy] = useState("deadline");
  const [selected, setSelected] = useState(null);

  // Hydrate from localStorage after mount.
  useEffect(() => {
    const p = loadProfile();
    setTags(p.tags);
    setOnboarded(p.onboarded);
    setBookmarks(loadBookmarks());
    setProfileLoaded(true);
  }, []);

  // Persist tag changes.
  useEffect(() => {
    if (!profileLoaded) return;
    saveProfile({ tags, onboarded });
  }, [tags, onboarded, profileLoaded]);

  // Persist bookmark changes.
  useEffect(() => {
    if (!profileLoaded) return;
    saveBookmarks(bookmarks);
  }, [bookmarks, profileLoaded]);

  const filtered = useMemo(
    () =>
      filterAndSort(events, {
        query,
        tags,
        showClosed,
        onlyBookmarks,
        bookmarkedIds: bookmarks,
        sortBy,
      }),
    [events, query, tags, showClosed, onlyBookmarks, bookmarks, sortBy]
  );

  function toggleBookmark(id) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function completeOnboarding() {
    setOnboarded(true);
  }

  const showOnboarding = profileLoaded && !onboarded;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--paper)]">
      <StaleBanner meta={meta} />

      {/* Hero */}
      <header className="border-b border-[var(--line)] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-[1280px] mx-auto">
          <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.25em] text-[var(--accent)] uppercase mb-3">
            Field Station · v3
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] text-[var(--paper)] mb-3 max-w-3xl">
            The next door that closes.{" "}
            <span className="italic font-light text-[var(--accent)]">Before it does.</span>
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#B8B0A0] max-w-2xl">
            {events.length} live hackathons, fellowships and accelerators for university students and beyond —{" "}
            sorted by what closes next. Pick a couple of tags, see your radar.
          </p>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        <div className="max-w-[1280px] mx-auto">
          {showOnboarding ? (
            <TagPicker selected={tags} onChange={setTags} onDone={completeOnboarding} />
          ) : (
            <DeadlineRadar events={events} tags={tags} onSelect={setSelected} />
          )}

          <Toolbar
            query={query}
            onQueryChange={setQuery}
            tags={tags}
            onTagsChange={setTags}
            showClosed={showClosed}
            onShowClosedChange={setShowClosed}
            onlyBookmarks={onlyBookmarks}
            onOnlyBookmarksChange={setOnlyBookmarks}
            resultCount={filtered.length}
            totalCount={events.length}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {filtered.length === 0 ? (
            <div className="border border-dashed border-[var(--line)] p-10 text-center">
              <div className="font-mono text-[11px] tracking-[0.2em] text-[var(--muted)] uppercase mb-2">
                No matches
              </div>
              <p className="text-[14px] text-[#B8B0A0]">
                Try removing a tag, clearing the search, or toggling "Show closed."
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
