"use server";

import { revalidatePath } from "next/cache";
import { saveFile, deleteFile, ACCEPTED_TYPES, MAX_FILE_SIZE } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import {
  getPermissionErrorMessage,
  requireRole,
  WRITE_ROLES,
} from "@/lib/permissions";

function hasValidImageSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (mimeType === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  return false;
}

async function validateImage(formData: FormData, fieldName: string) {
  const file = formData.get(fieldName) as File | null;
  if (!file || file.size === 0) {
    return { error: "Nenhum arquivo selecionado." };
  }

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { error: "Tipo de arquivo inválido. Use JPG, PNG ou WebP." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "Arquivo muito grande. Máximo: 2MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidImageSignature(buffer, file.type)) {
    return { error: "Arquivo de imagem inválido." };
  }

  return { file, buffer };
}

export async function uploadPersonPhoto(personId: string, formData: FormData) {
  try {
    await requireRole(WRITE_ROLES);

    const image = await validateImage(formData, "photo");
    if (image.error || !image.file || !image.buffer) {
      return { success: false, error: image.error ?? "Arquivo inválido." };
    }

    const person = await prisma.person.findUnique({
      where: { id: personId },
      select: { photoUrl: true },
    });

    if (!person) {
      return { success: false, error: "Pessoa não encontrada." };
    }

    const photoUrl = await saveFile(image.buffer, image.file.name);

    try {
      await prisma.person.update({
        where: { id: personId },
        data: { photoUrl },
      });
    } catch (error) {
      await deleteFile(photoUrl);
      throw error;
    }

    if (person.photoUrl) {
      await deleteFile(person.photoUrl);
    }

    revalidatePath("/pessoas");
    revalidatePath("/");
    return { success: true, photoUrl };
  } catch (error) {
    const permissionMessage = getPermissionErrorMessage(error);
    if (permissionMessage) return { success: false, error: permissionMessage };

    console.error("Upload error:", error);
    return { success: false, error: "Erro ao fazer upload da foto." };
  }
}

export async function removePersonPhoto(personId: string) {
  try {
    await requireRole(WRITE_ROLES);

    const person = await prisma.person.findUnique({
      where: { id: personId },
      select: { photoUrl: true },
    });

    if (!person) {
      return { success: false, error: "Pessoa não encontrada." };
    }

    await prisma.person.update({
      where: { id: personId },
      data: { photoUrl: null },
    });

    if (person.photoUrl) {
      await deleteFile(person.photoUrl);
    }

    revalidatePath("/pessoas");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    const permissionMessage = getPermissionErrorMessage(error);
    if (permissionMessage) return { success: false, error: permissionMessage };

    return { success: false, error: "Erro ao remover a foto." };
  }
}

export async function uploadCellCover(cellId: string, formData: FormData) {
  try {
    await requireRole(WRITE_ROLES);

    const image = await validateImage(formData, "cover");
    if (image.error || !image.file || !image.buffer) {
      return { success: false, error: image.error ?? "Arquivo inválido." };
    }

    const cell = await prisma.cell.findUnique({
      where: { id: cellId },
      select: { coverUrl: true },
    });

    if (!cell) {
      return { success: false, error: "Célula não encontrada." };
    }

    const coverUrl = await saveFile(image.buffer, image.file.name);

    try {
      await prisma.cell.update({
        where: { id: cellId },
        data: { coverUrl },
      });
    } catch (error) {
      await deleteFile(coverUrl);
      throw error;
    }

    if (cell.coverUrl) {
      await deleteFile(cell.coverUrl);
    }

    revalidatePath("/celulas");
    revalidatePath("/celulas/mapa");
    revalidatePath("/");
    return { success: true, coverUrl };
  } catch (error) {
    const permissionMessage = getPermissionErrorMessage(error);
    if (permissionMessage) return { success: false, error: permissionMessage };

    console.error("Upload error:", error);
    return { success: false, error: "Erro ao fazer upload da capa." };
  }
}

export async function removeCellCover(cellId: string) {
  try {
    await requireRole(WRITE_ROLES);

    const cell = await prisma.cell.findUnique({
      where: { id: cellId },
      select: { coverUrl: true },
    });

    if (!cell) {
      return { success: false, error: "Célula não encontrada." };
    }

    await prisma.cell.update({
      where: { id: cellId },
      data: { coverUrl: null },
    });

    if (cell.coverUrl) {
      await deleteFile(cell.coverUrl);
    }

    revalidatePath("/celulas");
    revalidatePath("/celulas/mapa");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    const permissionMessage = getPermissionErrorMessage(error);
    if (permissionMessage) return { success: false, error: permissionMessage };

    return { success: false, error: "Erro ao remover a capa." };
  }
}
