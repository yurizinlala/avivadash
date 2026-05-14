export const dynamic = "force-dynamic";
import { getAllEvents, getEventStats } from "@/lib/actions/event-actions";
import { getCells } from "@/lib/actions/cell-actions";
import { AgendaClient } from "./agenda-client";

export default async function AgendaPage() {
  const [events, stats, cells] = await Promise.all([
    getAllEvents(),
    getEventStats(),
    getCells(),
  ]);

  return <AgendaClient initialEvents={events} stats={stats} cells={cells} />;
}
