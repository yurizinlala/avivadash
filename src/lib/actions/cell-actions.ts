"use server";

import { prisma } from "@/lib/prisma";
import { cellSchema, type CellFormData } from "@/lib/validations/cell";
import { revalidatePath } from "next/cache";
import { geocodeCellAddress, type CellAddressInput } from "@/lib/geocoding";
import { deleteFile } from "@/lib/storage";
import {
  getPermissionErrorMessage,
  requireAuth,
  requireRole,
  WRITE_ROLES,
} from "@/lib/permissions";

function getCellAddressInput(d: Pick<CellFormData, "street" | "number" | "neighborhood" | "city" | "state" | "cep">): CellAddressInput {
  return {
    street: d.street || null,
    number: d.number || null,
    neighborhood: d.neighborhood || null,
    city: d.city || null,
    state: d.state || null,
    cep: d.cep || null,
  };
}

function hasGeocodableAddress(address: CellAddressInput) {
  return Boolean(address.street && address.city && address.state);
}

export async function getCells(search?: string) {
  await requireAuth();

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { leaderName: { contains: search, mode: "insensitive" } },
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
  await requireAuth();

  return prisma.cell.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getCellById(id: string) {
  await requireAuth();

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
  try {
    await requireRole(WRITE_ROLES);

    const result = cellSchema.safeParse(formData);
    if (!result.success) {
      return { success: false, error: result.error.flatten().fieldErrors };
    }

    const d = result.data;

    // Geocode address if provided. The structured search gives Nominatim more
    // context than a single free-form string, especially for CEP and number.
    let latitude: number | undefined;
    let longitude: number | undefined;
    const addressInput = getCellAddressInput(d);
    if (hasGeocodableAddress(addressInput)) {
      const geo = await geocodeCellAddress(addressInput);
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
    revalidatePath("/celulas/mapa");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    const permissionMessage = getPermissionErrorMessage(e);
    if (permissionMessage) return { success: false, error: permissionMessage };

    console.error("Error creating cell:", e);
    return { success: false, error: "Erro ao cadastrar célula." };
  }
}

export async function updateCell(id: string, formData: CellFormData) {
  try {
    await requireRole(WRITE_ROLES);

    const result = cellSchema.safeParse(formData);
    if (!result.success) {
      return { success: false, error: result.error.flatten().fieldErrors };
    }

    const d = result.data;

    const currentCell = await prisma.cell.findUnique({
      where: { id },
      select: {
        cep: true,
        street: true,
        number: true,
        neighborhood: true,
        city: true,
        state: true,
      },
    });

    const addressInput = getCellAddressInput(d);
    const addressChanged = Boolean(
      currentCell &&
        (currentCell.cep !== (d.cep || null) ||
          currentCell.street !== (d.street || null) ||
          currentCell.number !== (d.number || null) ||
          currentCell.neighborhood !== (d.neighborhood || null) ||
          currentCell.city !== (d.city || null) ||
          currentCell.state !== (d.state || null))
    );

    let latitude: number | null | undefined;
    let longitude: number | null | undefined;
    if (addressChanged && hasGeocodableAddress(addressInput)) {
      const geo = await geocodeCellAddress(addressInput);
      if (geo) {
        latitude = geo.latitude;
        longitude = geo.longitude;
      } else {
        latitude = null;
        longitude = null;
      }
    } else if (addressChanged) {
      latitude = null;
      longitude = null;
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
    revalidatePath("/celulas/mapa");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    const permissionMessage = getPermissionErrorMessage(e);
    if (permissionMessage) return { success: false, error: permissionMessage };

    console.error("Error updating cell:", e);
    return { success: false, error: "Erro ao atualizar célula." };
  }
}

export async function deleteCell(id: string) {
  try {
    await requireRole(WRITE_ROLES);

    const cell = await prisma.cell.findUnique({
      where: { id },
      select: { coverUrl: true },
    });

    // Remove all member associations first
    await prisma.person.updateMany({
      where: { cellId: id },
      data: { cellId: null },
    });
    await prisma.cell.delete({ where: { id } });

    if (cell?.coverUrl) {
      await deleteFile(cell.coverUrl);
    }

    revalidatePath("/celulas");
    revalidatePath("/celulas/mapa");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    const permissionMessage = getPermissionErrorMessage(e);
    if (permissionMessage) return { success: false, error: permissionMessage };

    console.error("Error deleting cell:", e);
    return { success: false, error: "Erro ao excluir célula." };
  }
}

export async function getCellStats() {
  await requireAuth();

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
