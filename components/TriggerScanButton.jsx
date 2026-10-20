import { SCAN_WORKFLOW_URL } from "@/lib/scanWorkflow.mjs";

export default function TriggerScanButton({ className = "" }) {
  return (
    <a
      href={SCAN_WORKFLOW_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Opens GitHub Actions. Choose Run workflow; repository write access is required."
      className={`text-[14px] underline underline-offset-4 decoration-[var(--line)] hover:decoration-current transition-colors ${className}`}
    >
      Run a scan on GitHub
    </a>
  );
}
