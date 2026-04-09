"use server";

import { prisma } from "@/lib/prisma";
import { cellSchema, type CellFormData } from "@/lib/validations/cell";
import { revalidatePath } from "next/cache";
import { geocodeAddress } from "@/lib/geocoding";

export async function getCells(search?: string) {
  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { leaderName: { contains: search } },
    ];
  }

  return prisma.cell.findMany({
    where,
    include: {
      members: {
        select: { id: true, fullName: true, personType: true },
        take: 5,
      },
      _count: { select: { members: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCellsSimple() {
  return prisma.cell.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getCellById(id: string) {
  return prisma.cell.findUnique({
    where: { id },
    include: {
      members: {
        select: { id: true, fullName: true, personType: true, phone: true },
      },
      _count: { select: { members: true } },
    },
  });
}

export async function createCell(formData: CellFormData) {
  const result = cellSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.flatten().fieldErrors };
  }

  try {
    // Geocode address if provided
    let latitude: number | undefined;
    let longitude: number | undefined;
    if (result.data.address) {
      const geo = await geocodeAddress(result.data.address);
      if (geo) {
        latitude = geo.latitude;
        longitude = geo.longitude;
      }
    }

    await prisma.cell.create({
      data: { ...result.data, latitude, longitude },
    });
    revalidatePath("/celulas");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Error creating cell:", e);
    return { success: false, error: "Erro ao cadastrar célula." };
  }
}

export async function updateCell(id: string, formData: CellFormData) {
  const result = cellSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.flatten().fieldErrors };
  }

  try {
    // Geocode address if changed
    let geoData: { latitude?: number; longitude?: number } = {};
    if (result.data.address) {
      const geo = await geocodeAddress(result.data.address);
      if (geo) {
        geoData = { latitude: geo.latitude, longitude: geo.longitude };
      }
    }

    await prisma.cell.update({
      where: { id },
      data: { ...result.data, ...geoData },
    });
    revalidatePath("/celulas");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Error updating cell:", e);
    return { success: false, error: "Erro ao atualizar célula." };
  }
}

export async function deleteCell(id: string) {
  try {
    // Remove all member associations first
    await prisma.person.updateMany({
      where: { cellId: id },
      data: { cellId: null },
    });
    await prisma.cell.delete({ where: { id } });
    revalidatePath("/celulas");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Error deleting cell:", e);
    return { success: false, error: "Erro ao excluir célula." };
  }
}

export async function getCellStats() {
  const [totalCells, activeCells] = await Promise.all([
    prisma.cell.count(),
    prisma.cell.count({ where: { isActive: true } }),
  ]);
  const totalParticipants = await prisma.person.count({
    where: { cellId: { not: null } },
  });
  const avgPerCell = activeCells > 0 ? Math.round(totalParticipants / activeCells) : 0;

  return { totalCells, activeCells, totalParticipants, avgPerCell };
}
