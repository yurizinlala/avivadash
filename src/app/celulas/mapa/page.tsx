export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { CellMap } from "@/components/cell-map";
import { MapPin } from "lucide-react";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

export default async function CellMapPage() {
  const cells = await prisma.cell.findMany({
    where: {
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    include: {
      _count: { select: { members: true } },
    },
  });

  const mapCells = cells
    .filter((c) => c.latitude !== null && c.longitude !== null)
    .map((c) => ({
      id: c.id,
      name: c.name,
      leaderName: c.leaderName,
      address: c.address,
      dayOfWeek: c.dayOfWeek,
      time: c.time,
      latitude: c.latitude!,
      longitude: c.longitude!,
      memberCount: c._count.members,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Visualização Geográfica
          </p>
          <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">
            Mapa de Células
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mapCells.length} célula(s) geolocalizadas
          </p>
        </div>
        <Link
          href="/celulas"
          className="inline-flex items-center gap-2 rounded-xl bg-surface-high px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-lowest transition-colors"
        >
          <MapPin className="h-4 w-4" />
          Voltar para Lista
        </Link>
      </div>

      {/* Map */}
      <CellMap cells={mapCells} />
    </div>
  );
}
