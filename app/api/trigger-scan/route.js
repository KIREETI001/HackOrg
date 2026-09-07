import { SCAN_WORKFLOW_URL } from "@/lib/scanWorkflow.mjs";

// Kept for older clients: scans now use GitHub's authenticated workflow UI.
// No deployment credential or public workflow-dispatch endpoint is needed.
export async function POST() {
  return Response.json(
    { error: "Run manual scans from GitHub Actions.", workflowUrl: SCAN_WORKFLOW_URL },
    { status: 410 },
  );
}
