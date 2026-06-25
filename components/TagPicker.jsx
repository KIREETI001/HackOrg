"use client";

import { ONBOARDING_TAGS } from "@/lib/tags";

export default function TagPicker({ selected, onChange, onDone }) {
  const set = new Set(selected);

  function toggle(tag) {
    const next = new Set(set);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    onChange([...next]);
  }

  return (
    <div className="border border-[var(--line)] bg-[var(--card)] p-5 sm:p-6 mb-6">
      <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--accent)] uppercase mb-2">
        ▸ 60-second setup
      </div>
      <h2 className="font-display text-2xl sm:text-3xl text-[var(--paper)] mb-2 leading-tight">
        What are you into?
      </h2>
      <p className="text-[13px] text-[#B8B0A0] mb-4">
        Pick 2–4 tags. Deadlines that match get pushed to the top. You can change this later.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {ONBOARDING_TAGS.map((t) => {
          const active = set.has(t.key);
          return (
            <button
              key={t.key}
              onClick={() => toggle(t.key)}
              className={`font-mono text-[11px] tracking-[0.1em] uppercase px-3 py-1.5 border transition-colors ${
                active
                  ? "bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]"
                  : "bg-transparent text-[#B8B0A0] border-[#2A2722] hover:border-[#4A453B]"
              }`}
            >
              {active ? "✓ " : ""}{t.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onDone}
          className="font-mono text-[11px] tracking-[0.15em] uppercase px-5 py-2.5 bg-[var(--accent)] text-[var(--bg)] font-semibold hover:bg-[#E5FF55] transition-colors"
        >
          See my deadlines →
        </button>
        <button
          onClick={() => {
            onChange([]);
            onDone();
          }}
          className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--muted)] hover:text-[var(--paper)] transition-colors"
        >
          Skip — show me everything
        </button>
      </div>
    </div>
  );
}
