"use client";

import TriggerScanButton from "./TriggerScanButton";
import { niceDate } from "@/lib/display";

const STALE_THRESHOLD_HOURS = 48;

export default function StaleBanner({ meta }) {
  if (!meta?.last_sweep_iso && !meta?.last_sweep_failed) return null;
  const failed = meta.last_sweep_failed === true;
  let stale = false;
  if (meta.last_sweep_iso) {
    stale = Date.now() - new Date(meta.last_sweep_iso).getTime() > STALE_THRESHOLD_HOURS * 3600 * 1000;
  }
  if (!failed && !stale) return null;
  const when = niceDate(meta.last_sweep_iso) || meta.last_sweep;

  return (
    <div className="bg-[var(--urgent-soft)] text-[var(--urgent)]" role="status">
      <div className="wrap py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px]">
        <span>
          {failed ? "The last daily check failed, so some deadlines may be out of date." : "These deadlines haven't been re-checked for over two days."}
          {when ? ` Last successful check: ${when}.` : ""}
        </span>
        <TriggerScanButton className="sm:ml-auto" />
      </div>
    </div>
  );
}
