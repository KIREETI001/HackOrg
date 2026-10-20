"use client";

import { useEffect, useMemo, useState } from "react";
import StaleBanner from "./StaleBanner";
import DeadlineRadar from "./DeadlineRadar";
import StatusTabs from "./StatusTabs";
import Toolbar from "./Toolbar";
import EventCard from "./EventCard";
import EventDetail from "./EventDetail";
import TriggerScanButton from "./TriggerScanButton";
import { filterAndSort, statusCounts } from "@/lib/eventModel";
import { groupOf, niceDate } from "@/lib/display";
import { loadProfile, saveProfile, loadBookmarks, saveBookmarks } from "@/lib/storage";

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
  useEffect(() => { if (profileLoaded) saveProfile({ tags, onboarded: true }); }, [tags, profileLoaded]);
  useEffect(() => { if (profileLoaded) saveBookmarks(bookmarks); }, [bookmarks, profileLoaded]);

  const counts = useMemo(() => statusCounts(events), [events]);
  const filtered = useMemo(
    () => filterAndSort(events, { query, tags, statusBucket, onlyBookmarks, bookmarkedIds: bookmarks, sortBy }),
    [events, query, tags, statusBucket, onlyBookmarks, bookmarks, sortBy]
  );

  // Deadline order reads as an agenda; other sorts stay a single list.
  const groups = useMemo(() => {
    if (sortBy !== "deadline") return [{ key: "all", label: null, items: filtered }];
    const out = [];
    for (const e of filtered) {
      const g = groupOf(e._days);
      const last = out[out.length - 1];
      if (last && last.key === g.key) last.items.push(e);
      else out.push({ ...g, items: [e] });
    }
    return out;
  }, [filtered, sortBy]);

  function toggleBookmark(id) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const lastSweep = niceDate(meta.last_sweep_iso) || meta.last_sweep;

  return (
    <div className="min-h-screen">
      <StaleBanner meta={meta} />

      <header className="wrap pt-6 sm:pt-8 flex items-center justify-between gap-4">
        <span className="text-[19px] font-bold tracking-[-0.01em]" style={{ fontStretch: "88%" }}>HackOrg</span>
        <span className="text-[14px] text-[var(--ink-2)]">
          {lastSweep ? `Updated ${lastSweep}` : "Updated daily"}
        </span>
      </header>

      <section className="wrap pt-10 sm:pt-16 pb-10 sm:pb-14 grid lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] gap-x-16 gap-y-4 items-end">
        <h1 className="text-[34px] sm:text-[56px] font-bold leading-[1.0] tracking-[-0.025em] text-balance" style={{ fontStretch: "92%" }}>
          Every hackathon, fellowship and accelerator worth knowing about, by deadline.
        </h1>
        <p className="text-[17px] text-[var(--ink-2)] max-w-[44ch] lg:pb-2">
          {events.length} opportunities, checked against their official pages every day. Save the ones you want and come back before they close.
        </p>
      </section>

      {statusBucket !== "ended" && <DeadlineRadar events={events} tags={tags} onSelect={setSelected} />}

      <div className="sm:sticky top-0 z-30 bg-[var(--bg)] border-b border-[var(--line)] shadow-[0_1px_0_var(--line)]">
        <div className="wrap">
          <div className="border-b border-[var(--line)]">
            <StatusTabs counts={counts} active={statusBucket} onChange={setStatusBucket} />
          </div>
          <Toolbar
            query={query} onQueryChange={setQuery}
            tags={tags} onTagsChange={setTags}
            onlyBookmarks={onlyBookmarks} onOnlyBookmarksChange={setOnlyBookmarks}
            resultCount={filtered.length} totalCount={counts[statusBucket] ?? events.length}
            sortBy={sortBy} onSortChange={setSortBy}
          />
        </div>
      </div>

      <main className="wrap pt-4 pb-20">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[18px] font-semibold">Nothing matches those filters.</p>
            <p className="text-[15px] text-[var(--ink-2)] mt-2">Clear the search, remove a topic or switch tabs to see more.</p>
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.key} className="pt-8 first:pt-4">
              {g.label && (
                <h2 className="flex items-baseline gap-3 text-[15px] font-semibold pb-2 border-b border-[var(--ink)]">
                  {g.label}
                  <span className="text-[14px] font-normal text-[var(--ink-3)] tabular-nums">{g.items.length}</span>
                </h2>
              )}
              <ul>
                {g.items.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    onSelect={setSelected}
                    isBookmarked={bookmarks.has(e.id)}
                    onToggleBookmark={toggleBookmark}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </main>

      <footer className="border-t border-[var(--line)]">
        <div className="wrap py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[14px] text-[var(--ink-2)]">
          <span>
            {meta.total_events ?? events.length} opportunities tracked{lastSweep ? `, last checked ${lastSweep}` : ""}.
            Built by <a className="text-[var(--ink)] underline underline-offset-4 decoration-[var(--line)] hover:decoration-[var(--ink)]" href="https://kireeti001.github.io">Kireeti</a> so good deadlines stop slipping past.
          </span>
          <TriggerScanButton className="text-[var(--ink-2)] hover:text-[var(--ink)]" />
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
