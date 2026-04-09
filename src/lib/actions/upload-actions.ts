"use server";

import { saveFile, deleteFile, ACCEPTED_TYPES, MAX_FILE_SIZE } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

export async function uploadPersonPhoto(personId: string, formData: FormData) {
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "Nenhum arquivo selecionado." };
  }

  // Validate type
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Tipo de arquivo inválido. Use JPG, PNG ou WebP.",
    };
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "Arquivo muito grande. Máximo: 2MB.",
    };
  }

  try {
    // Delete old photo if exists
    const person = await prisma.person.findUnique({
      where: { id: personId },
      select: { photoUrl: true },
    });
    if (person?.photoUrl) {
      await deleteFile(person.photoUrl);
    }

    // Save new photo
    const buffer = Buffer.from(await file.arrayBuffer());
    const photoUrl = await saveFile(buffer, file.name);

    // Update person record
    await prisma.person.update({
      where: { id: personId },
      data: { photoUrl },
    });

    return { success: true, photoUrl };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: "Erro ao fazer upload da foto." };
  }
}

export async function removePersonPhoto(personId: string) {
  try {
    const person = await prisma.person.findUnique({
      where: { id: personId },
      select: { photoUrl: true },
    });

    if (person?.photoUrl) {
      await deleteFile(person.photoUrl);
    }

    await prisma.person.update({
      where: { id: personId },
      data: { photoUrl: null },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Erro ao remover a foto." };
  }
}
