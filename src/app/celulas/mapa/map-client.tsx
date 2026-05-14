"use client";

import React from "react";
import { CellMap } from "@/components/cell-map";
import { geocodeAllCells } from "@/lib/actions/geocode-cells";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface MapPageClientProps {
  cells: {
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
  }[];
  pendingGeocode: number;
}

export function MapPageClient({ cells, pendingGeocode }: MapPageClientProps) {
  const router = useRouter();
  const [geocoding, setGeocoding] = React.useState(false);

  async function handleGeocode() {
    setGeocoding(true);
    try {
      const result = await geocodeAllCells();
      if (result.error) {
        toast.error(result.error);
      } else if (result.geocoded > 0) {
        toast.success(
          `${result.geocoded} de ${result.total} célula(s) localizadas com sucesso!`
        );
        router.refresh();
      } else {
        toast.info(
          "Nenhuma célula pôde ser geocodificada. Verifique se os endereços estão preenchidos corretamente."
        );
      }
    } catch {
      toast.error("Erro ao geocodificar células.");
    } finally {
      setGeocoding(false);
    }
  }

  return (
    <CellMap
      cells={cells}
      pendingGeocode={pendingGeocode}
      onGeocode={handleGeocode}
      geocoding={geocoding}
    />
  );
}
