"use client";

import { useEffect } from "react";
import {
  X,
  ExternalLink,
  Calendar,
  MapPin,
  Trophy,
  Bookmark,
  BookmarkCheck,
  Clock,
} from "lucide-react";
import { urgencyBucket, formatDate, formatPrize } from "@/lib/eventModel";

const URGENCY = {
  expired: { text: "var(--muted)", bg: "rgba(122,117,104,0.08)", border: "var(--line)" },
  urgent: { text: "#FF8B86", bg: "rgba(255,95,86,0.08)", border: "var(--urgent)" },
  soon: { text: "#FFCB7F", bg: "rgba(255,179,71,0.06)", border: "var(--soon)" },
  ok: { text: "var(--accent)", bg: "rgba(216,255,61,0.04)", border: "rgba(216,255,61,0.4)" },
};

export default function EventDetail({ event, onClose, isBookmarked, onToggleBookmark }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const days = event._days;
  const bucket = urgencyBucket(days) || "ok";
  const ub = URGENCY[bucket];
  const prize = formatPrize(event.prize_value_usd);
  const deadline = event.application_deadline ?? event.deadline;
  const applyUrl = event.application_url || event.url;
  const tagList = [...(event._tags || new Set())];

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end animate-fade-in"
      style={{ backgroundColor: "rgba(11,10,8,0.85)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:w-[600px] h-full bg-[var(--bg)] overflow-y-auto border-l border-[var(--line)] animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 sm:px-10 py-4 flex items-center justify-between border-b border-[var(--line)]">
          <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase">
            Dossier
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleBookmark(event.id)}
              className="p-2 hover:bg-[var(--line)] rounded transition-colors"
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-[var(--accent)] fill-[var(--accent)]" strokeWidth={2} />
              ) : (
                <Bookmark className="w-4 h-4 text-[var(--muted)] hover:text-[var(--paper)]" strokeWidth={2} />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--line)] rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-[#A8A299]" />
            </button>
          </div>
        </div>

        <div className="px-6 sm:px-10 py-6">
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--paper)] leading-tight text-balance mb-2">
            {event.name}
          </h2>
          <div className="font-mono text-[11px] tracking-[0.15em] text-[var(--accent)] uppercase mb-6">
            {event.organizer}
          </div>

          {/* Hero deadline */}
          {days !== null && days >= 0 && (
            <div
              className="mb-6 p-4 border"
              style={{ borderColor: ub.border, backgroundColor: ub.bg }}
            >
              <div className="flex items-baseline gap-3 mb-1">
                <span
                  className="font-display text-5xl tabular-nums leading-none"
                  style={{ color: ub.text, fontWeight: 600 }}
                >
                  {days}
                </span>
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#A8A299] uppercase">
                  {days === 0 ? "Days — today" : days === 1 ? "Day left" : "Days left"}
                </span>
              </div>
              <div className="font-mono text-[10px] tracking-[0.15em] text-[var(--muted)] uppercase">
                Application deadline — {formatDate(deadline)}
              </div>
            </div>
          )}

          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-6">
            <Stat icon={Calendar} label="Date" value={event.date} />
            <Stat icon={MapPin} label="Location" value={event.location} />
            {prize && <Stat icon={Trophy} label="Prize value" value={<span style={{ color: "var(--accent)" }}>{prize}</span>} />}
            <Stat icon={Clock} label="Status" value={event._status?.replace("-", " ")} />
          </div>

          {/* Prize text (if present) */}
          {event.prize && (
            <Section label="Prize">
              <p className="text-[14px] text-[#D9D2C2] leading-relaxed text-pretty">{event.prize}</p>
            </Section>
          )}

          {/* Summary */}
          {event.summary && (
            <Section label="Summary">
              <p className="text-[14px] text-[#D9D2C2] leading-relaxed text-pretty">{event.summary}</p>
            </Section>
          )}

          {/* Eligibility */}
          {event.eligibility && (
            <Section label="Eligibility">
              <p className="text-[14px] text-[#D9D2C2] leading-relaxed text-pretty">{event.eligibility}</p>
            </Section>
          )}

          {/* Highlights */}
          {event.highlights && event.highlights.length > 0 && (
            <Section label="Why this matters">
              <ul className="space-y-2">
                {event.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[var(--accent)] font-mono text-[10px] mt-1 flex-shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[14px] text-[#D9D2C2] leading-relaxed text-pretty">{h}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Tags */}
          {tagList.length > 0 && (
            <Section label="Tags">
              <div className="flex flex-wrap gap-1.5">
                {tagList.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[9px] tracking-[0.1em] uppercase px-2 py-1 bg-[var(--card)] text-[var(--muted)] border border-[var(--line)]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Apply */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {applyUrl && (
              <a
                href={applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 bg-[var(--accent)] text-[var(--bg)] font-mono text-[11px] tracking-[0.15em] uppercase font-semibold hover:bg-[#E5FF55] active:scale-[0.97] transition duration-150"
              >
                <span>Apply / official site</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {event.url && event.url !== applyUrl && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 border border-[#2A2722] text-[var(--paper)] font-mono text-[11px] tracking-[0.15em] uppercase hover:border-[#4A453B] active:scale-[0.97] transition duration-150"
              >
                <span>More info</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.15em] text-[var(--muted)] uppercase mb-1">
        <Icon className="w-2.5 h-2.5" />
        {label}
      </div>
      <div className="text-[13px] text-[var(--paper)] leading-snug">{value}</div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div className="mb-5">
      <div className="font-mono text-[10px] tracking-[0.18em] text-[var(--muted)] uppercase mb-2 pb-2 border-b border-[var(--line)]">
        {label}
      </div>
      {children}
    </div>
  );
}
