"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Sessão expirada." };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { success: false, error: "Usuário não encontrado." };

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return { success: false, error: "Senha atual incorreta." };

  if (newPassword.length < 6) {
    return { success: false, error: "A nova senha deve ter pelo menos 6 caracteres." };
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  revalidatePath("/configuracoes");
  return { success: true };
}

export async function updateProfile(name: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Sessão expirada." };

  if (!name.trim()) return { success: false, error: "Nome é obrigatório." };

  await prisma.user.update({
    where: { id: session.userId },
    data: { name: name.trim() },
  });

  revalidatePath("/configuracoes");
  return { success: true };
}
