export const dynamic = "force-dynamic";
import { getAllEvents, getEventStats } from "@/lib/actions/event-actions";
import { AgendaClient } from "./agenda-client";

export default async function AgendaPage() {
  const [events, stats] = await Promise.all([getAllEvents(), getEventStats()]);

  return <AgendaClient initialEvents={events} stats={stats} />;
}
