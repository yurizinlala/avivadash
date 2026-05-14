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

  const cells = await prisma.cell.findMany({
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

  // Construct readable address from separate fields
  return cells.map((cell) => {
    const addressParts = [
      cell.street,
      cell.number,
      cell.complement,
      cell.neighborhood,
      cell.city,
      cell.state,
    ].filter(Boolean);
    return {
      ...cell,
      address: addressParts.length > 0 ? addressParts.join(", ") : null,
    };
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
    const d = result.data;

    // Geocode address if provided
    let latitude: number | undefined;
    let longitude: number | undefined;
    const fullAddress = [d.street, d.number, d.neighborhood, d.city, d.state].filter(Boolean).join(", ");
    if (fullAddress && fullAddress.length > 5) {
      const geo = await geocodeAddress(fullAddress);
      if (geo) {
        latitude = geo.latitude;
        longitude = geo.longitude;
      }
    }

    let foundedAtDate: Date | null = null;
    if (d.foundedAt) {
      const parsedDate = new Date(d.foundedAt + "T12:00:00Z");
      if (!isNaN(parsedDate.getTime())) foundedAtDate = parsedDate;
    }

    let leaderBirthDateParsed: Date | null = null;
    if (d.leaderBirthDate) {
      const parsed = new Date(d.leaderBirthDate + "T12:00:00Z");
      if (!isNaN(parsed.getTime())) leaderBirthDateParsed = parsed;
    }

    await prisma.cell.create({
      data: {
        name: d.name,
        coverUrl: d.coverUrl || null,
        foundedAt: foundedAtDate,
        leaderId: d.leaderId || null,
        leaderName: d.leaderName,
        leaderPhone: d.leaderPhone || null,
        leaderCpf: d.leaderCpf || null,
        leaderBirthDate: leaderBirthDateParsed,
        cep: d.cep || null,
        street: d.street || null,
        number: d.number || null,
        complement: d.complement || null,
        neighborhood: d.neighborhood || null,
        city: d.city || null,
        state: d.state || null,
        dayOfWeek: d.dayOfWeek || null,
        time: d.time || null,
        isActive: d.isActive,
        latitude,
        longitude,
      },
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
    const d = result.data;

    // Geocode address if changed
    let latitude: number | undefined;
    let longitude: number | undefined;
    const fullAddress = [d.street, d.number, d.neighborhood, d.city, d.state].filter(Boolean).join(", ");
    if (fullAddress && fullAddress.length > 5) {
      const geo = await geocodeAddress(fullAddress);
      if (geo) {
        latitude = geo.latitude;
        longitude = geo.longitude;
      }
    }

    let foundedAtDate: Date | null = null;
    if (d.foundedAt) {
      const parsedDate = new Date(d.foundedAt + "T12:00:00Z");
      if (!isNaN(parsedDate.getTime())) foundedAtDate = parsedDate;
    }

    let leaderBirthDateParsed: Date | null = null;
    if (d.leaderBirthDate) {
      const parsed = new Date(d.leaderBirthDate + "T12:00:00Z");
      if (!isNaN(parsed.getTime())) leaderBirthDateParsed = parsed;
    }

    await prisma.cell.update({
      where: { id },
      data: {
        name: d.name,
        coverUrl: d.coverUrl || null,
        foundedAt: foundedAtDate,
        leaderId: d.leaderId || null,
        leaderName: d.leaderName,
        leaderPhone: d.leaderPhone || null,
        leaderCpf: d.leaderCpf || null,
        leaderBirthDate: leaderBirthDateParsed,
        cep: d.cep || null,
        street: d.street || null,
        number: d.number || null,
        complement: d.complement || null,
        neighborhood: d.neighborhood || null,
        city: d.city || null,
        state: d.state || null,
        dayOfWeek: d.dayOfWeek || null,
        time: d.time || null,
        isActive: d.isActive,
        latitude,
        longitude,
      },
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
