"use server";

import { prisma } from "@/lib/prisma";
import { geocodeAddress } from "@/lib/geocoding";
import { revalidatePath } from "next/cache";

/**
 * Batch-geocode all cells that have an address but no lat/lng.
 * Uses Nominatim with 1s delay between requests to respect rate limits.
 */
export async function geocodeAllCells() {
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
    const parts = [
      cell.street,
      cell.number,
      cell.neighborhood,
      cell.city,
      cell.state,
      cell.cep,
    ].filter(Boolean);

    const fullAddress = parts.join(", ");
    if (fullAddress.length < 5) continue;

    const geo = await geocodeAddress(fullAddress);
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

    // Nominatim rate limit: 1 request per second
    await new Promise((r) => setTimeout(r, 1100));
  }

  revalidatePath("/celulas/mapa");
  revalidatePath("/celulas");

  return { geocoded, total: cells.length };
}
