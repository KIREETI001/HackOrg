import events from "@/data/events.json";
import meta from "@/data/meta.json";
import Scanner from "@/components/Scanner";

export default function Home() {
  return <Scanner events={events} meta={meta} />;
}

// Re-read the JSON files at most once per hour.
export const revalidate = 3600;
