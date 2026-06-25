"use client";

import { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { nextDeadlines, urgencyBucket, formatDate } from "@/lib/eventModel";

const URGENCY_STYLE = {
  urgent: { color: "#FF8B86", border: "var(--urgent)" },
  soon:   { color: "#FFCB7F", border: "var(--soon)" },
  ok:     { color: "var(--accent)", border: "rgba(216,255,61,0.35)" },
};

export default function DeadlineRadar({ events, tags = [], onSelect }) {
  const items = useMemo(() => nextDeadlines(events, { tags, limit: 3 }), [events, tags]);

  if (items.length === 0) return null;

  return (
    <div className="mb-0 px-4 sm:px-6 lg:px-8 py-3 border-b border-[var(--line)] bg-[#0B0A08]">
      <div className="max-w-[1280px] mx-auto flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-[var(--urgent)]" strokeWidth={2.5} />
          <span className="font-mono text-[9px] tracking-[0.2em] text-[var(--muted)] uppercase">
            Closing soon
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {items.map((e) => {
            const bucket = urgencyBucket(e._days) || "ok";
            const s = URGENCY_STYLE[bucket] || URGENCY_STYLE.ok;
            return (
              <button
                key={e.id}
                onClick={() => onSelect(e)}
                className="flex items-center gap-2 px-3 py-1.5 border transition duration-150 hover:opacity-80 active:scale-[0.98]"
                style={{ borderColor: s.border }}
              >
                <span
                  className="font-display text-xl tabular-nums leading-none"
                  style={{ color: s.color, fontWeight: 600 }}
                >
                  {e._days}d
                </span>
                <span className="font-mono text-[11px] text-[var(--paper)] max-w-[160px] truncate">
                  {e.name}
                </span>
                <span className="font-mono text-[9px] text-[var(--muted)] hidden sm:inline">
                  {formatDate(e.application_deadline ?? e.deadline)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
