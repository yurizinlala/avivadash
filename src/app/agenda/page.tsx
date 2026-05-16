export const dynamic = "force-dynamic";
import { getAllEvents, getEventStats } from "@/lib/actions/event-actions";
import { getCells } from "@/lib/actions/cell-actions";
import { getChurchLocations } from "@/lib/actions/church-location-actions";
import { AgendaClient } from "./agenda-client";

export default async function AgendaPage() {
  const [events, stats, cells, churchLocations] = await Promise.all([
    getAllEvents(),
    getEventStats(),
    getCells(),
    getChurchLocations(),
  ]);

  return (
    <AgendaClient
      initialEvents={events}
      stats={stats}
      cells={cells}
      churchLocations={churchLocations}
    />
  );
}
