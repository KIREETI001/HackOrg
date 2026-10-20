"use client";

import { useEffect, useRef } from "react";
import { X, Bookmark, BookmarkCheck } from "lucide-react";
import { formatPrize } from "@/lib/eventModel";
import { countdownParts, niceDate, tagLabel, urgencyTone } from "@/lib/display";

const STATUS_TEXT = {
  open: "Open",
  "closing-soon": "Closing soon",
  closed: "Closed",
  rolling: "Rolling applications",
};

export default function EventDetail({ event, onClose, isBookmarked, onToggleBookmark }) {
  const closeRef = useRef(null);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { document.body.style.overflow = ""; };
  }, []);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const days = event._days;
  const c = countdownParts(days);
  const tone = urgencyTone(days);
  const prize = formatPrize(event.prize_value_usd);
  const deadline = niceDate(event.application_deadline ?? event.deadline);
  const applyUrl = event.application_url || event.url;
  const tagList = [...(event._tags || new Set())];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end animate-fade-in" style={{ backgroundColor: "var(--veil)" }} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-title"
        className="relative w-full sm:w-[620px] h-full bg-[var(--bg)] overflow-y-auto shadow-2xl animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-[var(--bg)]/95 backdrop-blur flex items-center justify-end gap-1 px-4 sm:px-8 py-3 border-b border-[var(--line)]">
          <button
            onClick={() => onToggleBookmark(event.id)}
            aria-pressed={isBookmarked}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] hover:bg-[var(--surface)] transition-colors"
          >
            {isBookmarked ? (
              <><BookmarkCheck className="w-4 h-4 text-[var(--accent)] fill-[var(--accent)]" /> Saved</>
            ) : (
              <><Bookmark className="w-4 h-4 text-[var(--ink-2)]" /> Save</>
            )}
          </button>
          <button ref={closeRef} onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors" aria-label="Close">
            <X className="w-5 h-5 text-[var(--ink-2)]" />
          </button>
        </div>

        <div className="px-6 sm:px-10 pt-8 pb-12">
          <p className="text-[15px] text-[var(--ink-2)]">{event.organizer}</p>
          <h2 id="event-title" className="text-[30px] sm:text-[38px] font-bold leading-[1.08] tracking-[-0.02em] text-balance mt-1" style={{ fontStretch: "92%" }}>
            {event.name}
          </h2>

          <div className="mt-8 flex items-end gap-5 pb-8 border-b border-[var(--line)]">
            <span className="num text-[96px] sm:text-[120px]" style={{ color: tone.fg }}>{c.big}</span>
            <span className="pb-1">
              <span className="block text-[17px] font-semibold">{c.small}</span>
              {deadline && <span className="block text-[15px] text-[var(--ink-2)] mt-0.5">Applications close {deadline}</span>}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 py-8 border-b border-[var(--line)]">
            <Fact label="When" value={event.date} />
            <Fact label="Where" value={event.location} />
            <Fact label="Prize pool" value={prize} />
            <Fact label="Status" value={STATUS_TEXT[event._status] || event._status} />
          </dl>

          {event.summary && <Section title="What it is"><p>{event.summary}</p></Section>}
          {event.prize && <Section title="What you can win"><p>{event.prize}</p></Section>}
          {event.eligibility && <Section title="Who can join"><p>{event.eligibility}</p></Section>}
          {event.highlights?.length > 0 && (
            <Section title="Worth knowing">
              <ul className="list-disc pl-5 space-y-2 marker:text-[var(--ink-3)]">
                {event.highlights.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </Section>
          )}
          {tagList.length > 0 && (
            <Section title="Topics">
              <div className="flex flex-wrap gap-1.5">
                {tagList.map((t) => (
                  <span key={t} className="text-[13px] px-2.5 py-1 rounded-full border border-[var(--line)] text-[var(--ink-2)]">{tagLabel(t)}</span>
                ))}
              </div>
            </Section>
          )}

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            {applyUrl && (
              <a href={applyUrl} target="_blank" rel="noopener noreferrer"
                className="text-center px-6 py-3 rounded-lg bg-[var(--accent)] text-white text-[15px] font-semibold hover:brightness-110 transition">
                Go to the application page
              </a>
            )}
            {event.url && event.url !== applyUrl && (
              <a href={event.url} target="_blank" rel="noopener noreferrer"
                className="text-center px-6 py-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[15px] hover:border-[var(--ink-3)] transition-colors">
                Read the event page
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[13px] text-[var(--ink-3)]">{label}</dt>
      <dd className="text-[15.5px] mt-1 leading-snug">{value}</dd>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="pt-7">
      <h3 className="text-[15px] font-semibold mb-2">{title}</h3>
      <div className="text-[16px] leading-relaxed text-[var(--ink-2)] text-pretty max-w-[60ch]">{children}</div>
    </section>
  );
}
