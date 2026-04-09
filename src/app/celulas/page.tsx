export const dynamic = "force-dynamic";
import { getCells, getCellStats } from "@/lib/actions/cell-actions";
import { CelulasClient } from "./celulas-client";

export default async function CelulasPage() {
  const [cells, stats] = await Promise.all([getCells(), getCellStats()]);

  return <CelulasClient initialCells={cells} stats={stats} />;
}
