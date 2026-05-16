"use server";

import { revalidatePath } from "next/cache";
import { formatChurchLocationAddress } from "@/lib/church-locations";
import { prisma } from "@/lib/prisma";
import {
  churchLocationSchema,
  type ChurchLocationFormData,
} from "@/lib/validations/church-location";
import {
  getPermissionErrorMessage,
  requireAuth,
  requireRole,
  WRITE_ROLES,
} from "@/lib/permissions";

function revalidateChurchLocationPaths() {
  revalidatePath("/agenda");
  revalidatePath("/configuracoes");
}

function normalizeLocationData(data: ChurchLocationFormData) {
  return {
    name: data.name.trim(),
    type: data.type,
    cep: data.cep || null,
    street: data.street.trim(),
    number: data.number.trim(),
    complement: data.complement?.trim() || null,
    neighborhood: data.neighborhood.trim(),
    city: data.city.trim(),
    state: data.state.trim().toUpperCase(),
  };
}

export async function getChurchLocations() {
  await requireAuth();

  const locations = await prisma.churchLocation.findMany({
    orderBy: [{ type: "desc" }, { name: "asc" }],
  });

  return locations.map((location) => ({
    ...location,
    address: formatChurchLocationAddress(location),
    createdAt: location.createdAt.toISOString(),
    updatedAt: location.updatedAt.toISOString(),
  }));
}

export async function createChurchLocation(formData: ChurchLocationFormData) {
  try {
    await requireRole(WRITE_ROLES);

    const result = churchLocationSchema.safeParse(formData);
    if (!result.success) {
      return { success: false, error: result.error.flatten().fieldErrors };
    }

    await prisma.churchLocation.create({
      data: normalizeLocationData(result.data),
    });

    revalidateChurchLocationPaths();
    return { success: true };
  } catch (error) {
    const permissionMessage = getPermissionErrorMessage(error);
    if (permissionMessage) return { success: false, error: permissionMessage };

    console.error("Error creating church location:", error);
    return { success: false, error: "Erro ao criar local." };
  }
}

export async function updateChurchLocation(
  id: string,
  formData: ChurchLocationFormData
) {
  try {
    await requireRole(WRITE_ROLES);

    const result = churchLocationSchema.safeParse(formData);
    if (!result.success) {
      return { success: false, error: result.error.flatten().fieldErrors };
    }

    await prisma.churchLocation.update({
      where: { id },
      data: normalizeLocationData(result.data),
    });

    revalidateChurchLocationPaths();
    return { success: true };
  } catch (error) {
    const permissionMessage = getPermissionErrorMessage(error);
    if (permissionMessage) return { success: false, error: permissionMessage };

    console.error("Error updating church location:", error);
    return { success: false, error: "Erro ao atualizar local." };
  }
}

export async function deleteChurchLocation(id: string) {
  try {
    await requireRole(WRITE_ROLES);

    await prisma.churchLocation.delete({ where: { id } });

    revalidateChurchLocationPaths();
    return { success: true };
  } catch (error) {
    const permissionMessage = getPermissionErrorMessage(error);
    if (permissionMessage) return { success: false, error: permissionMessage };

    console.error("Error deleting church location:", error);
    return { success: false, error: "Erro ao excluir local." };
  }
}
