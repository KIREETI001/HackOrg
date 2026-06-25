"use client";

const TABS = [
  { key: "open", label: "Open", desc: "Registration is open" },
  { key: "reg-closed", label: "Reg. Closed", desc: "Running but registration closed" },
  { key: "ended", label: "Ended", desc: "Event has concluded" },
];

export default function StatusTabs({ counts = {}, active, onChange }) {
  return (
    <div className="flex items-center">
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        const count = counts[tab.key] ?? 0;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            title={tab.desc}
            className={`flex items-center gap-2 px-5 py-3.5 font-mono text-[11px] tracking-[0.12em] uppercase border-b-2 transition duration-150 ${
              isActive
                ? "border-[var(--accent)] text-[var(--paper)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--paper)]"
            }`}
          >
            {tab.label}
            <span
              className={`tabular-nums text-[10px] px-1.5 py-0.5 font-mono ${
                isActive
                  ? "bg-[var(--accent)] text-[var(--bg)]"
                  : "bg-[var(--line)] text-[var(--muted)]"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
