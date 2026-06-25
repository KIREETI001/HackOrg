"use client";

import { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { nextDeadlines, urgencyBucket, formatDate } from "@/lib/eventModel";

const URGENCY_STYLE = {
  urgent: { border: "var(--urgent)", text: "#FF8B86", bg: "rgba(255,95,86,0.08)" },
  soon: { border: "var(--soon)", text: "#FFCB7F", bg: "rgba(255,179,71,0.06)" },
  ok: { border: "var(--accent)", text: "var(--accent)", bg: "rgba(216,255,61,0.04)" },
};

export default function DeadlineRadar({ events, tags = [], onSelect }) {
  const items = useMemo(() => nextDeadlines(events, { tags, limit: 5 }), [events, tags]);

  if (items.length === 0) {
    return (
      <div className="border border-[var(--line)] bg-[var(--card)] p-5 mb-6">
        <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase mb-2">
          ▸ Deadline radar
        </div>
        <div className="text-[14px] text-[#B8B0A0]">
          Nothing matches your tags right now. Try removing a tag, or scroll down to browse all open events.
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[var(--line)] bg-gradient-to-b from-[#0B0A08] to-[var(--bg)] p-4 sm:p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-4 h-4 text-[var(--urgent)]" strokeWidth={2.5} />
        <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] text-[var(--paper)] uppercase">
          Deadline radar
          {tags.length > 0 && (
            <span className="text-[var(--muted)] normal-case ml-2">— matching {tags.join(", ")}</span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {items.map((e) => {
          const bucket = urgencyBucket(e._days) || "ok";
          const s = URGENCY_STYLE[bucket] || URGENCY_STYLE.ok;
          return (
            <button
              key={e.id}
              onClick={() => onSelect(e)}
              className="text-left group p-3 border transition-all hover:translate-y-[-2px]"
              style={{ borderColor: s.border, backgroundColor: s.bg }}
            >
              <div className="flex items-baseline gap-2 mb-2">
                <span
                  className="font-display text-3xl leading-none tabular-nums"
                  style={{ color: s.text, fontWeight: 600 }}
                >
                  {e._days}
                </span>
                <span className="font-mono text-[9px] tracking-[0.15em] text-[#A8A299] uppercase">
                  d left
                </span>
              </div>
              <div className="font-display text-[15px] leading-tight text-[var(--paper)] mb-1 group-hover:underline decoration-[var(--accent)] underline-offset-4">
                {e.name}
              </div>
              <div className="font-mono text-[9px] tracking-[0.1em] text-[var(--muted)] uppercase truncate">
                {formatDate(e.application_deadline ?? e.deadline)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
