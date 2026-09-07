import events from "@/data/events.json";
import meta from "@/data/meta.json";
import Scanner from "@/components/Scanner";
import { unstable_cache } from "next/cache";
import { fetchScanData, loadScanData } from "@/lib/scanData.mjs";

// Cache the complete snapshot, not each file independently. A failed refresh
// throws inside this cache and preserves its last successful result.
const readSnapshot = unstable_cache(
  () => fetchScanData(),
  ["hackorg-main-scan-v1"],
  { revalidate: 3600 }
);

export default async function Home() {
  const snapshot = await loadScanData({
    readSnapshot,
    fallback: { events, meta },
    onError: (error) => console.warn("Using bundled scan snapshot:", error.message),
  });
  return <Scanner events={snapshot.events} meta={snapshot.meta} />;
}

// New repository scans become available without another application deployment.
export const revalidate = 3600;
