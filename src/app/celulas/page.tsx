export const dynamic = "force-dynamic";
import { getCells, getCellStats } from "@/lib/actions/cell-actions";
import { getPeopleSimple } from "@/lib/actions/person-actions";
import { CelulasClient } from "./celulas-client";

export default async function CelulasPage() {
  const [cells, stats, people] = await Promise.all([
    getCells(), 
    getCellStats(),
    getPeopleSimple()
  ]);

  return <CelulasClient initialCells={cells} stats={stats} people={people} />;
}
