"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { formatPrize } from "@/lib/eventModel";
import { countdownParts, niceDate, tagLabel, urgencyTone } from "@/lib/display";

// One agenda row: countdown, what it is, where, what you can win.
export default function EventCard({ event, onSelect, isBookmarked, onToggleBookmark }) {
  const days = event._days;
  const c = countdownParts(days);
  const tone = urgencyTone(days);
  const prize = formatPrize(event.prize_value_usd);
  const closed = event._status === "closed";
  const visibleTags = [...event._tags].slice(0, 3);
  const deadline = niceDate(event.application_deadline ?? event.deadline);

  return (
    <li className="relative group border-b border-[var(--line)] last:border-b-0" style={{ opacity: closed ? 0.6 : 1 }}>
      <button
        onClick={() => onSelect(event)}
        className="w-full text-left grid grid-cols-[64px_minmax(0,1fr)] sm:grid-cols-[88px_minmax(0,1fr)_200px] gap-x-4 sm:gap-x-6 gap-y-2 py-5 pl-1 pr-12 hover:bg-[var(--surface)] transition-colors rounded-lg"
      >
        <span className="flex flex-col items-start row-span-2 sm:row-span-1">
          <span className="num text-[40px] sm:text-[48px]" style={{ color: tone.fg }}>{c.big}</span>
          <span className="text-[12px] text-[var(--ink-3)] mt-1.5 leading-tight">{c.small}</span>
        </span>

        <span className="min-w-0">
          <span className="block text-[17px] font-semibold leading-snug text-balance group-hover:text-[var(--accent)] transition-colors">
            {event.name}
          </span>
          <span className="block text-[14.5px] text-[var(--ink-2)] mt-0.5">
            {event.organizer}
            {event.location ? <span className="text-[var(--ink-3)]">, {(event.location || "").split(",")[0]}</span> : null}
          </span>
          {visibleTags.length > 0 && (
            <span className="flex flex-wrap gap-1.5 mt-2.5">
              {visibleTags.map((t) => (
                <span key={t} className="text-[12.5px] px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--line)] text-[var(--ink-2)]">
                  {tagLabel(t)}
                </span>
              ))}
            </span>
          )}
        </span>

        <span className="col-start-2 sm:col-start-3 text-[14px] sm:text-right flex sm:flex-col gap-x-3 gap-y-1 flex-wrap">
          {prize && <span className="font-semibold text-[var(--ink)]">{prize} in prizes</span>}
          {deadline && <span className="text-[var(--ink-3)]">Closes {deadline}</span>}
        </span>
      </button>

      <button
        onClick={() => onToggleBookmark(event.id)}
        className="absolute top-4 right-1 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[var(--surface)] transition-colors"
        aria-label={isBookmarked ? `Remove ${event.name} from saved` : `Save ${event.name}`}
        aria-pressed={isBookmarked}
      >
        {isBookmarked ? (
          <BookmarkCheck className="w-[18px] h-[18px] text-[var(--accent)] fill-[var(--accent)]" strokeWidth={2} />
        ) : (
          <Bookmark className="w-[18px] h-[18px] text-[var(--ink-3)]" strokeWidth={2} />
        )}
      </button>
    </li>
  );
}
