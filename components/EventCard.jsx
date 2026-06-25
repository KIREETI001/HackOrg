"use client";

import { Bookmark, BookmarkCheck, MapPin, Clock, Trophy } from "lucide-react";
import { urgencyBucket, formatPrize } from "@/lib/eventModel";

const URGENCY = {
  expired: { text: "var(--muted)", border: "var(--line)" },
  urgent: { text: "#FF8B86", border: "var(--urgent)" },
  soon: { text: "#FFCB7F", border: "var(--soon)" },
  ok: { text: "var(--accent)", border: "rgba(216,255,61,0.3)" },
};

function deadlineLabel(days) {
  if (days === null || days === undefined) return "Rolling";
  if (days < 0) return `Closed ${-days}d ago`;
  if (days === 0) return "Closes today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export default function EventCard({ event, onSelect, isBookmarked, onToggleBookmark }) {
  const days = event._days;
  const status = event._status;
  const bucket = urgencyBucket(days) || "ok";
  const ub = URGENCY[bucket];
  const prize = formatPrize(event.prize_value_usd);
  const dim = status === "closed";

  // Up to 2 tags rendered as pills (after onboarding-style canonicalisation lives in _tags Set).
  const visibleTags = [...event._tags].slice(0, 2);

  return (
    <button
      onClick={() => onSelect(event)}
      className="text-left group relative bg-[var(--card)] border border-[var(--line)] hover:border-[var(--accent)]/40 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.45)] active:translate-y-0 active:scale-[0.99] active:shadow-none transition duration-150 ease-out p-4 sm:p-5 flex flex-col h-full focus:outline-none focus-visible:border-[var(--accent)]"
      style={{ opacity: dim ? 0.55 : 1 }}
    >
      {/* Bookmark — 32×32 hit area */}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onToggleBookmark(event.id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            e.preventDefault();
            onToggleBookmark(event.id);
          }
        }}
        className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--line)] transition-colors z-10 cursor-pointer"
        aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
      >
        {isBookmarked ? (
          <BookmarkCheck className="w-4 h-4 text-[var(--accent)] fill-[var(--accent)]" strokeWidth={2} />
        ) : (
          <Bookmark className="w-4 h-4 text-[var(--muted)]" strokeWidth={2} />
        )}
      </span>

      {/* Deadline pill (the headline) */}
      <div
        className="inline-flex items-center gap-1.5 self-start font-mono text-[10px] tracking-[0.12em] uppercase px-2 py-1 border mb-3"
        style={{ color: ub.text, borderColor: ub.border }}
      >
        <Clock className="w-3 h-3" strokeWidth={2.5} />
        {deadlineLabel(days)}
      </div>

      {/* Title */}
      <h3 className="font-display text-lg sm:text-xl leading-tight text-balance text-[var(--paper)] mb-1.5 pr-7 group-hover:text-[var(--accent)] transition-colors">
        {event.name}
      </h3>

      {/* Organizer */}
      <div className="font-mono text-[10px] tracking-[0.1em] text-[var(--muted)] uppercase mb-3">
        {event.organizer}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-auto pt-3 border-t border-[var(--line)]">
        <span className="flex items-center gap-1 font-mono text-[10px] text-[#B8B0A0]">
          <MapPin className="w-3 h-3 text-[var(--muted)]" />
          {(event.location || "Online").split(",")[0]}
        </span>
        {prize && (
          <span className="flex items-center gap-1 font-mono text-[10px] text-[var(--accent)]">
            <Trophy className="w-3 h-3" />
            {prize}
          </span>
        )}
        {visibleTags.map((t) => (
          <span
            key={t}
            className="font-mono text-[9px] tracking-[0.08em] uppercase px-1.5 py-0.5 bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)]"
          >
            #{t}
          </span>
        ))}
      </div>
    </button>
  );
}
