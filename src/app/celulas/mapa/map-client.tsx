"use client";

import React from "react";
import { CellMap } from "@/components/cell-map";
import {
  geocodeAllCells,
  refreshCellGeocode,
  updateCellCoordinates,
} from "@/lib/actions/geocode-cells";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface MapPageClientProps {
  cells: {
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
  }[];
  pendingGeocode: number;
}

export function MapPageClient({ cells, pendingGeocode }: MapPageClientProps) {
  const router = useRouter();
  const [geocoding, setGeocoding] = React.useState(false);
  const [refreshingCellId, setRefreshingCellId] = React.useState<string | null>(null);
  const [savingCoordinateId, setSavingCoordinateId] = React.useState<string | null>(null);

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

  async function handleRefreshCellGeocode(cellId: string) {
    setRefreshingCellId(cellId);
    try {
      const result = await refreshCellGeocode(cellId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Localização recalculada pelo endereço.");
        router.refresh();
      }

      return result;
    } catch {
      toast.error("Erro ao recalcular a localização.");
      return { success: false, error: "Erro ao recalcular a localização." };
    } finally {
      setRefreshingCellId(null);
    }
  }

  async function handleSaveCoordinates(
    cellId: string,
    latitude: number,
    longitude: number
  ) {
    setSavingCoordinateId(cellId);
    try {
      const result = await updateCellCoordinates(cellId, latitude, longitude);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Pin da célula atualizado.");
        router.refresh();
      }

      return result;
    } catch {
      toast.error("Erro ao salvar a posição do pin.");
      return { success: false, error: "Erro ao salvar a posição do pin." };
    } finally {
      setSavingCoordinateId(null);
    }
  }

  return (
    <CellMap
      cells={cells}
      pendingGeocode={pendingGeocode}
      onGeocode={handleGeocode}
      geocoding={geocoding}
      onRefreshCellGeocode={handleRefreshCellGeocode}
      refreshingCellId={refreshingCellId}
      onSaveCoordinates={handleSaveCoordinates}
      savingCoordinateId={savingCoordinateId}
    />
  );
}
