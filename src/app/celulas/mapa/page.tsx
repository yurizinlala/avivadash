export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { MapPin } from "lucide-react";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import { MapPageClient } from "./map-client";
import { requireAuth } from "@/lib/permissions";
import { PageHeader } from "@/components/design-system";

export default async function CellMapPage() {
  await requireAuth();

  // Fetch cells WITH coordinates (for the map)
  const geolocatedCells = await prisma.cell.findMany({
    where: {
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    include: {
      _count: { select: { members: true } },
      leader: { select: { photoUrl: true } },
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
      leaderPhotoUrl: c.leader?.photoUrl ?? null,
      address: [c.street, c.number, c.neighborhood, c.city, c.state, c.cep]
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
    <div className="page-stack">
      <PageHeader
        eyebrow="Visualização Geográfica"
        title="Mapa de Células"
        description={`${mapCells.length} célula(s) geolocalizadas e ${pendingGeocodeCount} endereço(s) pendentes.`}
        actions={(
          <Link
            href="/celulas" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-high"
          >
            <MapPin className="h-4 w-4" />
            Voltar para Lista
          </Link>
        )}
      />

      {/* Map Client Wrapper */}
      <MapPageClient cells={mapCells} pendingGeocode={pendingGeocodeCount} />
    </div>
  );
}
