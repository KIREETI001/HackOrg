"use client";

const TABS = [
  { key: "open", label: "Open", desc: "Registration is open" },
  { key: "reg-closed", label: "Registration closed", desc: "Running, but registration has closed" },
  { key: "ended", label: "Ended", desc: "The event has finished" },
];

export default function StatusTabs({ counts = {}, active, onChange }) {
  return (
    <div role="tablist" aria-label="Event status" className="flex items-center gap-1 overflow-x-auto">
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        const count = counts[tab.key] ?? 0;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            title={tab.desc}
            className={`flex items-center gap-2 whitespace-nowrap px-3.5 py-3 text-[15px] border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-[var(--ink)] text-[var(--ink)] font-semibold"
                : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
            }`}
          >
            {tab.label}
            <span className="tabular-nums text-[13px] text-[var(--ink-3)] font-normal">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
