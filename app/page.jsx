import events from "@/data/events.json";
import meta from "@/data/meta.json";
import CompetitionScanner from "@/components/CompetitionScanner";

export default function Home() {
  return <CompetitionScanner events={events} meta={meta} />;
}

// Tell Next.js to rebuild the page when data files change.
export const revalidate = 3600; // 1 hour
