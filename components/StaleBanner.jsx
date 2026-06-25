"use client";

import { AlertCircle } from "lucide-react";
import TriggerScanButton from "./TriggerScanButton";

const STALE_THRESHOLD_HOURS = 48;

export default function StaleBanner({ meta }) {
  if (!meta?.last_sweep_iso && !meta?.last_sweep_failed) return null;

  const failed = meta.last_sweep_failed === true;
  let stale = false;
  if (meta.last_sweep_iso) {
    const ageMs = Date.now() - new Date(meta.last_sweep_iso).getTime();
    stale = ageMs > STALE_THRESHOLD_HOURS * 60 * 60 * 1000;
  }

  if (!failed && !stale) return null;

  return (
    <div
      className="border-b border-[var(--urgent)]/40 bg-[var(--urgent)]/10 px-4 sm:px-6 lg:px-8 py-2"
      role="status"
    >
      <div className="max-w-[1280px] mx-auto flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-[var(--urgent)]" strokeWidth={2.5} />
        <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.15em] text-[var(--urgent)] uppercase">
          {failed ? "Last data sweep failed" : "Data may be stale"} ·{" "}
          {meta.last_sweep ? `last sweep ${meta.last_sweep}` : "timestamp unknown"}
        </span>
        <TriggerScanButton className="ml-auto text-[var(--urgent)] hover:opacity-80" />
      </div>
    </div>
  );
}
