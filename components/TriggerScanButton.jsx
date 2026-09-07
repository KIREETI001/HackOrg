import { ExternalLink } from "lucide-react";
import { SCAN_WORKFLOW_URL } from "@/lib/scanWorkflow.mjs";

export default function TriggerScanButton({ className = "" }) {
  return (
    <a
      href={SCAN_WORKFLOW_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Open GitHub Actions and choose Run workflow. Repository write access is required."
      className={`flex items-center gap-1.5 font-mono text-[10px] tracking-[0.15em] uppercase transition-colors ${className}`}
    >
      <ExternalLink className="w-3 h-3" aria-hidden="true" />
      Run scan on GitHub
    </a>
  );
}
