export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { MapPin } from "lucide-react";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import { MapPageClient } from "./map-client";

export default async function CellMapPage() {
  // Fetch cells WITH coordinates (for the map)
  const geolocatedCells = await prisma.cell.findMany({
    where: {
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    include: {
      _count: { select: { members: true } },
    },
  });

  // Count cells that have address but no coordinates (pending geocode)
  const pendingGeocodeCount = await prisma.cell.count({
    where: {
      isActive: true,
      OR: [{ latitude: null }, { longitude: null }],
      NOT: {
        AND: [
          { street: null },
          { city: null },
          { neighborhood: null },
        ],
      },
    },
  });

  const mapCells = geolocatedCells
    .filter((c) => c.latitude !== null && c.longitude !== null)
    .map((c) => ({
      id: c.id,
      name: c.name,
      leaderName: c.leaderName,
      address: [c.street, c.number, c.neighborhood, c.city, c.state]
        .filter(Boolean)
        .join(", ") || null,
      dayOfWeek: c.dayOfWeek,
      time: c.time,
      latitude: c.latitude!,
      longitude: c.longitude!,
      memberCount: c._count.members,
      coverUrl: c.coverUrl,
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

      {/* Map Client Wrapper */}
      <MapPageClient cells={mapCells} pendingGeocode={pendingGeocodeCount} />
    </div>
  );
}
