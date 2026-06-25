"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

const MESSAGES = {
  idle:    "Trigger scan",
  loading: "Triggering…",
  done:    "Scan started — check back in ~2 min",
  error:   "Failed — check GitHub token",
};

export default function TriggerScanButton({ className = "" }) {
  const [state, setState] = useState("idle");

  async function trigger() {
    setState("loading");
    try {
      const res = await fetch("/api/trigger-scan", { method: "POST" });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
    setTimeout(() => setState("idle"), 8000);
  }

  return (
    <button
      onClick={trigger}
      disabled={state === "loading" || state === "done"}
      className={`flex items-center gap-1.5 font-mono text-[10px] tracking-[0.15em] uppercase transition-colors disabled:opacity-50 ${className}`}
    >
      <RefreshCw className={`w-3 h-3 ${state === "loading" ? "animate-spin" : ""}`} />
      {MESSAGES[state]}
    </button>
  );
}
