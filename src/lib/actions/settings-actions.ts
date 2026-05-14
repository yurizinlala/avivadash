"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { getPermissionErrorMessage, requireAuth } from "@/lib/permissions";

export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    const session = await requireAuth();

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return { success: false, error: "Usuário não encontrado." };

    if (!currentPassword) {
      return { success: false, error: "Informe a senha atual." };
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) return { success: false, error: "Senha atual incorreta." };

    if (newPassword.length < 6) {
      return { success: false, error: "A nova senha deve ter pelo menos 6 caracteres." };
    }

    if (currentPassword === newPassword) {
      return { success: false, error: "A nova senha precisa ser diferente da senha atual." };
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    revalidatePath("/configuracoes");
    return { success: true };
  } catch (error) {
    const permissionMessage = getPermissionErrorMessage(error);
    if (permissionMessage) return { success: false, error: permissionMessage };

    throw error;
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function updateProfile(data: { name: string; email: string }) {
  try {
    const session = await requireAuth();
    const trimmedName = data.name.trim();
    const normalizedEmail = data.email.trim().toLowerCase();

    if (!trimmedName) return { success: false, error: "Nome é obrigatório." };
    if (!normalizedEmail) return { success: false, error: "E-mail é obrigatório." };
    if (!isValidEmail(normalizedEmail)) {
      return { success: false, error: "Informe um e-mail válido." };
    }

    const emailOwner = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (emailOwner && emailOwner.id !== session.userId) {
      return { success: false, error: "Este e-mail já está em uso por outra conta." };
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: trimmedName,
        email: normalizedEmail,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    await createSession({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
    });
    revalidatePath("/configuracoes");
    return {
      success: true,
      user: {
        email: updatedUser.email,
        name: updatedUser.name,
      },
    };
  } catch (error) {
    const permissionMessage = getPermissionErrorMessage(error);
    if (permissionMessage) return { success: false, error: permissionMessage };

    throw error;
  }
}
