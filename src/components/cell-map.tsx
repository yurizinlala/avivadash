"use client";

import React from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation, Loader2 } from "lucide-react";

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface CellMapData {
  id: string;
  name: string;
  leaderName: string;
  address: string | null;
  dayOfWeek: string | null;
  time: string | null;
  latitude: number;
  longitude: number;
  memberCount: number;
}

interface CellMapProps {
  cells: CellMapData[];
}

export function CellMap({ cells }: CellMapProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Default center: Brazil
  const defaultCenter: [number, number] = cells.length > 0
    ? [cells[0].latitude, cells[0].longitude]
    : [-15.7801, -47.9292]; // Brasília

  if (!mounted) {
    return (
      <div className="h-[calc(100vh-14rem)] rounded-2xl bg-surface-high flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cells.length === 0) {
    return (
      <div className="h-[calc(100vh-14rem)] rounded-2xl bg-surface-high flex flex-col items-center justify-center text-center p-8">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Navigation className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-heading font-bold text-foreground mb-1">
          Nenhuma célula no mapa
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          As células precisam ter um endereço válido cadastrado para aparecerem no mapa.
          Edite uma célula e preencha o endereço para geolocalizá-la automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-14rem)] rounded-2xl overflow-hidden border border-border shadow-ambient">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {cells.map((cell) => (
          <Marker key={cell.id} position={[cell.latitude, cell.longitude]}>
            <Popup>
              <div className="min-w-[200px]">
                <p className="font-bold text-sm">{cell.name}</p>
                <p className="text-xs text-gray-600 mt-1">
                  <strong>Líder:</strong> {cell.leaderName}
                </p>
                {cell.dayOfWeek && (
                  <p className="text-xs text-gray-600">
                    <strong>Dia:</strong> {cell.dayOfWeek} {cell.time ? `às ${cell.time}` : ""}
                  </p>
                )}
                {cell.address && (
                  <p className="text-xs text-gray-600 mt-1">
                    <MapPin className="inline h-3 w-3 mr-1" />
                    {cell.address}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {cell.memberCount} membro(s)
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
