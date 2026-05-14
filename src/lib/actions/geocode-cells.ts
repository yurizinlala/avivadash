"use server";

import { prisma } from "@/lib/prisma";
import { geocodeCellAddress, type CellAddressInput } from "@/lib/geocoding";
import { revalidatePath } from "next/cache";
import {
  getPermissionErrorMessage,
  requireRole,
  WRITE_ROLES,
} from "@/lib/permissions";

function toAddressInput(cell: CellAddressInput): CellAddressInput {
  return {
    street: cell.street ?? null,
    number: cell.number ?? null,
    neighborhood: cell.neighborhood ?? null,
    city: cell.city ?? null,
    state: cell.state ?? null,
    cep: cell.cep ?? null,
  };
}

function isValidCoordinate(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function revalidateCellMap() {
  revalidatePath("/celulas/mapa");
  revalidatePath("/celulas");
  revalidatePath("/");
}

/**
 * Batch-geocode all active cells that have an address but no lat/lng.
 * Uses Nominatim with 1s delay between requests to respect rate limits.
 */
export async function geocodeAllCells() {
  try {
    await requireRole(WRITE_ROLES);

    const cells = await prisma.cell.findMany({
      where: {
        isActive: true,
        OR: [{ latitude: null }, { longitude: null }],
      },
      select: {
        id: true,
        street: true,
        number: true,
        neighborhood: true,
        city: true,
        state: true,
        cep: true,
      },
    });

    let geocoded = 0;

    for (const cell of cells) {
      const geo = await geocodeCellAddress(toAddressInput(cell));
      if (geo) {
        await prisma.cell.update({
          where: { id: cell.id },
          data: {
            latitude: geo.latitude,
            longitude: geo.longitude,
          },
        });
        geocoded++;
      }

      await new Promise((resolve) => setTimeout(resolve, 1100));
    }

    revalidateCellMap();

    return { geocoded, total: cells.length };
  } catch (error) {
    const permissionMessage = getPermissionErrorMessage(error);
    if (permissionMessage) return { geocoded: 0, total: 0, error: permissionMessage };

    throw error;
  }
}

export async function refreshCellGeocode(cellId: string) {
  try {
    await requireRole(WRITE_ROLES);

    const cell = await prisma.cell.findUnique({
      where: { id: cellId },
      select: {
        street: true,
        number: true,
        neighborhood: true,
        city: true,
        state: true,
        cep: true,
      },
    });

    if (!cell) {
      return { success: false, error: "Célula não encontrada." };
    }

    const geo = await geocodeCellAddress(toAddressInput(cell));
    if (!geo) {
      return {
        success: false,
        error: "Não foi possível localizar esse endereço automaticamente.",
      };
    }

    await prisma.cell.update({
      where: { id: cellId },
      data: {
        latitude: geo.latitude,
        longitude: geo.longitude,
      },
    });

    revalidateCellMap();

    return { success: true, precision: geo.precision, confidence: geo.confidence };
  } catch (error) {
    const permissionMessage = getPermissionErrorMessage(error);
    if (permissionMessage) return { success: false, error: permissionMessage };

    throw error;
  }
}

export async function updateCellCoordinates(
  cellId: string,
  latitude: number,
  longitude: number
) {
  try {
    await requireRole(WRITE_ROLES);

    if (!isValidCoordinate(latitude, longitude)) {
      return { success: false, error: "Coordenadas inválidas." };
    }

    await prisma.cell.update({
      where: { id: cellId },
      data: { latitude, longitude },
    });

    revalidateCellMap();

    return { success: true };
  } catch (error) {
    const permissionMessage = getPermissionErrorMessage(error);
    if (permissionMessage) return { success: false, error: permissionMessage };

    throw error;
  }
}
