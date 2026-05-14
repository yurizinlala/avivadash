"use client";

import React from "react";
import Image from "next/image";
import { Navigation, Loader2, Users, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type L from "leaflet";

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
  coverUrl: string | null;
}

interface CellMapProps {
  cells: CellMapData[];
  pendingGeocode: number;
  onGeocode?: () => void;
  geocoding?: boolean;
}

type LeafletDefaultIconPrototype = L.Icon.Default & {
  _getIconUrl?: unknown;
};

function createTextLine(text: string) {
  const line = document.createElement("p");
  line.textContent = text;
  Object.assign(line.style, {
    fontSize: "11px",
    color: "#666",
    margin: "0 0 2px 0",
  });
  return line;
}

function createPopupContent(cell: CellMapData) {
  const container = document.createElement("div");
  Object.assign(container.style, {
    minWidth: "200px",
    maxWidth: "240px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  });

  if (cell.coverUrl) {
    const image = document.createElement("img");
    image.src = cell.coverUrl;
    image.alt = cell.name;
    Object.assign(image.style, {
      width: "calc(100% + 24px)",
      height: "80px",
      objectFit: "cover",
      borderRadius: "8px 8px 0 0",
      margin: "-12px -12px 8px -12px",
    });
    container.appendChild(image);
  }

  const title = document.createElement("p");
  title.textContent = cell.name;
  Object.assign(title.style, {
    fontSize: "13px",
    fontWeight: "700",
    margin: "0 0 4px 0",
    color: "#1a1a1a",
  });
  container.appendChild(title);

  container.appendChild(createTextLine(`Líder: ${cell.leaderName}`));

  if (cell.dayOfWeek) {
    container.appendChild(
      createTextLine(`Dia: ${cell.dayOfWeek}${cell.time ? ` às ${cell.time}` : ""}`)
    );
  }

  if (cell.address) {
    const address = createTextLine(`Endereço: ${cell.address}`);
    address.style.margin = "4px 0 0 0";
    container.appendChild(address);
  }

  const members = createTextLine(`Membros: ${cell.memberCount}`);
  members.style.color = "#888";
  members.style.margin = "4px 0 0 0";
  container.appendChild(members);

  return container;
}

export function CellMap({ cells, pendingGeocode, onGeocode, geocoding }: CellMapProps) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstance = React.useRef<L.Map | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [selectedCell, setSelectedCell] = React.useState<CellMapData | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted || !mapRef.current || mapInstance.current) return;

    import("leaflet").then((Leaflet) => {
      if (!mapRef.current) return;

      delete (Leaflet.Icon.Default.prototype as LeafletDefaultIconPrototype)._getIconUrl;
      Leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const defaultCenter: [number, number] =
        cells.length > 0 ? [cells[0].latitude, cells[0].longitude] : [-15.7801, -47.9292];

      const map = Leaflet.map(mapRef.current, {
        center: defaultCenter,
        zoom: cells.length > 0 ? 13 : 5,
        scrollWheelZoom: true,
        zoomControl: true,
      });

      Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const customIcon = Leaflet.divIcon({
        className: "custom-cell-marker",
        html: `<div style="
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #003275, #1d4994);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      cells.forEach((cell) => {
        const marker = Leaflet.marker([cell.latitude, cell.longitude], {
          icon: customIcon,
        }).addTo(map);

        marker.bindPopup(createPopupContent(cell), {
          maxWidth: 260,
          className: "cell-popup",
        });

        marker.on("click", () => {
          setSelectedCell(cell);
        });
      });

      if (cells.length > 1) {
        const group = Leaflet.featureGroup(
          cells.map((cell) => Leaflet.marker([cell.latitude, cell.longitude]))
        );
        map.fitBounds(group.getBounds().pad(0.2));
      }

      mapInstance.current = map;
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mounted, cells]);

  if (!mounted) {
    return (
      <div className="flex h-[calc(100vh-14rem)] items-center justify-center rounded-xl bg-surface-high">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cells.length === 0 && pendingGeocode === 0) {
    return (
      <div className="flex h-[calc(100vh-14rem)] flex-col items-center justify-center rounded-xl bg-surface-high p-8 text-center">
        <div className="icon-tile icon-tile-primary mb-4 h-14 w-14">
          <Navigation className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-heading font-bold text-foreground mb-1">
          Nenhuma célula no mapa
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          As células precisam ter um endereço válido cadastrado para aparecerem
          no mapa. Edite uma célula e preencha o endereço completo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingGeocode > 0 && (
        <div className="app-card flex items-center justify-between gap-4 border-gold/20 bg-gold/10 p-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {pendingGeocode} célula(s) com endereço mas sem localização no mapa
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clique para geocodificar automaticamente usando OpenStreetMap
            </p>
          </div>
          <Button
            size="sm"
            variant="brand" className="gap-2"
            onClick={onGeocode}
            disabled={geocoding}
          >
            {geocoding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {geocoding ? "Geocodificando..." : "Localizar"}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
        <div className="relative isolate z-0 h-[calc(100vh-18rem)] min-h-[400px] overflow-hidden rounded-xl border border-border shadow-ambient">
          <div ref={mapRef} className="h-full w-full" />
        </div>

        <div className="space-y-4 max-h-[calc(100vh-18rem)] overflow-y-auto pr-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
            {cells.length} célula(s) no mapa
          </p>
          {cells.map((cell) => (
            <div
              key={cell.id} className={cn(
                "app-card cursor-pointer p-4 transition-all hover:border-primary/30 hover:shadow-md",
                selectedCell?.id === cell.id && "border-primary/50 shadow-md ring-1 ring-primary/20"
              )}
              onClick={() => {
                setSelectedCell(cell);
                mapInstance.current?.setView([cell.latitude, cell.longitude], 16, {
                  animate: true,
                });
              }}
            >
              {cell.coverUrl && (
                <div className="relative h-24 rounded-t-xl overflow-hidden mb-3 -mx-4 -mt-4">
                  <Image
                    src={cell.coverUrl}
                    alt={cell.name}
                    fill
                    sizes="300px"
                    unoptimized className="object-cover"
                  />
                </div>
              )}
              <p className="text-sm font-bold text-foreground leading-tight">
                {cell.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Líder: {cell.leaderName}
              </p>
              {(cell.dayOfWeek || cell.time) && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {cell.dayOfWeek}
                    {cell.time ? ` às ${cell.time}` : ""}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-primary font-medium mt-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>{cell.memberCount} membros</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
