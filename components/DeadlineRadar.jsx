"use client";

import { useMemo } from "react";
import { nextDeadlines } from "@/lib/eventModel";
import { countdownParts, niceDate, urgencyTone } from "@/lib/display";

// "Closing next": the three nearest deadlines, set as large calendar numerals.
export default function DeadlineRadar({ events, tags = [], onSelect, now }) {
  const items = useMemo(() => nextDeadlines(events, { tags, limit: 3, ref: now }), [events, tags, now]);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="closing-next" className="wrap pb-10 sm:pb-14">
      <h2 id="closing-next" className="text-[15px] font-semibold text-[var(--ink)] mb-4">
        Closing next
      </h2>
      <ol className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden">
        {items.map((e) => {
          const c = countdownParts(e._days);
          const tone = urgencyTone(e._days);
          return (
            <li key={e.id} className="bg-[var(--surface)]">
              <button
                onClick={() => onSelect(e)}
                className="w-full h-full text-left p-5 sm:p-6 flex gap-5 items-start hover:bg-[var(--bg)] transition-colors"
              >
                <span className="flex flex-col items-start shrink-0">
                  <span className="num text-[64px] sm:text-[76px]" style={{ color: tone.fg }}>
                    {c.big}
                  </span>
                  <span className="text-[13px] mt-2 text-[var(--ink-2)]">{c.small}</span>
                </span>
                <span className="min-w-0 pt-1">
                  <span className="block text-[17px] font-semibold leading-snug text-balance">{e.name}</span>
                  <span className="block text-[14px] text-[var(--ink-2)] mt-1">{e.organizer}</span>
                  <span className="block text-[13px] text-[var(--ink-3)] mt-3">
                    Applications close {niceDate(e.application_deadline ?? e.deadline)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
