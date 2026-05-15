"use client";

import React from "react";
import Image from "next/image";
import {
  Clock,
  Crosshair,
  Loader2,
  Navigation,
  RefreshCw,
  Save,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type L from "leaflet";

interface CellMapData {
  id: string;
  name: string;
  leaderName: string;
  leaderPhotoUrl: string | null;
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
  onRefreshCellGeocode?: (
    cellId: string
  ) => Promise<{ success?: boolean; error?: string }>;
  refreshingCellId?: string | null;
  onSaveCoordinates?: (
    cellId: string,
    latitude: number,
    longitude: number
  ) => Promise<{ success?: boolean; error?: string }>;
  savingCoordinateId?: string | null;
}

type LeafletDefaultIconPrototype = L.Icon.Default & {
  _getIconUrl?: unknown;
};

interface DraftCoordinates {
  latitude: number;
  longitude: number;
}

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

function createCellIcon(Leaflet: typeof import("leaflet"), isAdjusting: boolean) {
  return Leaflet.divIcon({
    className: "custom-cell-marker",
    html: `<div style="
      width: 36px; height: 36px;
      background: ${isAdjusting ? "linear-gradient(135deg, #c28500, #f5b700)" : "linear-gradient(135deg, #003275, #1d4994)"};
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
}

export function CellMap({
  cells,
  pendingGeocode,
  onGeocode,
  geocoding,
  onRefreshCellGeocode,
  refreshingCellId,
  onSaveCoordinates,
  savingCoordinateId,
}: CellMapProps) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstance = React.useRef<L.Map | null>(null);
  const markerLayerRef = React.useRef<L.LayerGroup | null>(null);
  const hasFitBoundsRef = React.useRef(false);
  const [mounted, setMounted] = React.useState(false);
  const [leafletReady, setLeafletReady] = React.useState(false);
  const [selectedCell, setSelectedCell] = React.useState<CellMapData | null>(null);
  const [adjustingCellId, setAdjustingCellId] = React.useState<string | null>(null);
  const [draftCoordinates, setDraftCoordinates] = React.useState<DraftCoordinates | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!selectedCell) return;
    setSelectedCell(cells.find((cell) => cell.id === selectedCell.id) ?? null);
  }, [cells, selectedCell]);

  React.useEffect(() => {
    if (!mounted || !mapRef.current || mapInstance.current) return;

    let cancelled = false;

    import("leaflet").then((Leaflet) => {
      if (!mapRef.current || cancelled) return;

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

      markerLayerRef.current = Leaflet.layerGroup().addTo(map);
      mapInstance.current = map;
      setLeafletReady(true);
    });

    return () => {
      cancelled = true;
      markerLayerRef.current = null;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mounted, cells]);

  React.useEffect(() => {
    if (!leafletReady || !mapInstance.current || !markerLayerRef.current) return;

    let cancelled = false;

    import("leaflet").then((Leaflet) => {
      if (cancelled || !mapInstance.current || !markerLayerRef.current) return;

      const layer = markerLayerRef.current;
      layer.clearLayers();

      cells.forEach((cell) => {
        const isAdjusting = adjustingCellId === cell.id;
        const coordinates =
          isAdjusting && draftCoordinates
            ? draftCoordinates
            : { latitude: cell.latitude, longitude: cell.longitude };

        const marker = Leaflet.marker([coordinates.latitude, coordinates.longitude], {
          icon: createCellIcon(Leaflet, isAdjusting),
          draggable: isAdjusting,
        }).addTo(layer);

        marker.bindPopup(createPopupContent(cell), {
          maxWidth: 260,
          className: "cell-popup",
        });

        marker.on("click", () => {
          setSelectedCell(cell);
        });

        if (isAdjusting) {
          marker.on("dragend", () => {
            const latLng = marker.getLatLng();
            setDraftCoordinates({ latitude: latLng.lat, longitude: latLng.lng });
          });
        }
      });

      if (!hasFitBoundsRef.current && cells.length === 1) {
        mapInstance.current.setView([cells[0].latitude, cells[0].longitude], 15);
        hasFitBoundsRef.current = true;
      }

      if (!hasFitBoundsRef.current && cells.length > 1) {
        const group = Leaflet.featureGroup(
          cells.map((cell) => Leaflet.marker([cell.latitude, cell.longitude]))
        );
        mapInstance.current.fitBounds(group.getBounds().pad(0.2));
        hasFitBoundsRef.current = true;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [leafletReady, cells, adjustingCellId, draftCoordinates]);

  React.useEffect(() => {
    if (!leafletReady || !mapInstance.current || !adjustingCellId) return;

    const map = mapInstance.current;
    const handleMapClick = (event: L.LeafletMouseEvent) => {
      setDraftCoordinates({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [leafletReady, adjustingCellId]);

  function startAdjusting(cell: CellMapData) {
    setSelectedCell(cell);
    setAdjustingCellId(cell.id);
    setDraftCoordinates({ latitude: cell.latitude, longitude: cell.longitude });
    mapInstance.current?.setView([cell.latitude, cell.longitude], 18, { animate: true });
  }

  function cancelAdjusting() {
    setAdjustingCellId(null);
    setDraftCoordinates(null);
  }

  async function saveDraftCoordinates(cell: CellMapData) {
    if (!draftCoordinates || !onSaveCoordinates) return;

    const result = await onSaveCoordinates(
      cell.id,
      draftCoordinates.latitude,
      draftCoordinates.longitude
    );

    if (result.success) {
      setAdjustingCellId(null);
      setDraftCoordinates(null);
    }
  }

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
          As células precisam ter um endereço válido cadastrado para aparecerem no mapa.
          Edite uma célula e preencha o endereço completo.
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
            variant="brand"
            className="gap-2"
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

      {adjustingCellId && (
        <div className="app-card border-primary/20 bg-primary/5 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Ajuste fino do pin ativo</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Arraste o marcador dourado ou clique no ponto correto do mapa e salve a posição.
              </p>
            </div>
            <Button size="sm" variant="outline" className="gap-2" onClick={cancelAdjusting}>
              <X className="h-4 w-4" />
              Cancelar ajuste
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_300px]">
        <div
          className={cn(
            "relative isolate z-0 h-[calc(100vh-18rem)] min-h-[400px] overflow-hidden rounded-xl border border-border shadow-ambient",
            adjustingCellId && "cursor-crosshair ring-2 ring-primary/20"
          )}
        >
          <div ref={mapRef} className="h-full w-full" />
        </div>

        <div className="max-h-[calc(100vh-18rem)] space-y-4 overflow-y-auto pr-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {cells.length} célula(s) no mapa
          </p>
          {cells.map((cell) => {
            const isSelected = selectedCell?.id === cell.id;
            const isAdjusting = adjustingCellId === cell.id;
            const isSaving = savingCoordinateId === cell.id;
            const isRefreshing = refreshingCellId === cell.id;

            return (
              <div
                key={cell.id}
                className={cn(
                  "app-card cursor-pointer p-4 transition-all hover:border-primary/30 hover:shadow-md",
                  isSelected && "border-primary/50 shadow-md ring-1 ring-primary/20",
                  isAdjusting && "border-gold/60 ring-1 ring-gold/30"
                )}
                onClick={() => {
                  setSelectedCell(cell);
                  mapInstance.current?.setView([cell.latitude, cell.longitude], 16, {
                    animate: true,
                  });
                }}
              >
                {cell.coverUrl && (
                  <div className="relative -mx-4 -mt-4 mb-3 h-24 overflow-hidden rounded-t-xl">
                    <Image
                      src={cell.coverUrl}
                      alt={cell.name}
                      fill
                      sizes="300px"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                )}
                <p className="text-sm font-bold leading-tight text-foreground">{cell.name}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  {cell.leaderPhotoUrl && (
                    <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-primary/10">
                      <Image
                        src={cell.leaderPhotoUrl}
                        alt={cell.leaderName}
                        fill
                        sizes="24px"
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span>Líder: {cell.leaderName}</span>
                </div>
                {(cell.dayOfWeek || cell.time) && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {cell.dayOfWeek}
                      {cell.time ? ` às ${cell.time}` : ""}
                    </span>
                  </div>
                )}
                <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Users className="h-3.5 w-3.5" />
                  <span>{cell.memberCount} membros</span>
                </div>

                {isAdjusting && draftCoordinates && (
                  <div className="mt-3 rounded-xl border border-gold/30 bg-gold/10 p-3 text-xs">
                    <p className="font-medium text-foreground">Nova posição selecionada</p>
                    <p className="mt-1 text-muted-foreground">
                      {draftCoordinates.latitude.toFixed(6)},{" "}
                      {draftCoordinates.longitude.toFixed(6)}
                    </p>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {isAdjusting ? (
                    <>
                      <Button
                        size="sm"
                        variant="brand"
                        className="gap-2"
                        disabled={isSaving || !draftCoordinates}
                        onClick={(event) => {
                          event.stopPropagation();
                          void saveDraftCoordinates(cell);
                        }}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Salvar pin
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={(event) => {
                          event.stopPropagation();
                          cancelAdjusting();
                        }}
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        disabled={!onSaveCoordinates}
                        onClick={(event) => {
                          event.stopPropagation();
                          startAdjusting(cell);
                        }}
                      >
                        <Crosshair className="h-4 w-4" />
                        Ajustar pin
                      </Button>
                      {onRefreshCellGeocode && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-2"
                          disabled={isRefreshing}
                          onClick={(event) => {
                            event.stopPropagation();
                            void onRefreshCellGeocode(cell.id);
                          }}
                        >
                          {isRefreshing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Recalcular
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
