"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getPermissionErrorMessage, requireAuth } from "@/lib/permissions";
import {
  ensureNotificationSettingsForUser,
  serializeNotificationSettings,
} from "@/lib/notification-settings-service";
import {
  notificationSettingsSchema,
  type NotificationSettingsFormData,
} from "@/lib/validations/notification-settings";

export async function getNotificationSettings() {
  const session = await requireAuth();
  const settings = await ensureNotificationSettingsForUser(session.userId);
  return serializeNotificationSettings(settings);
}

export async function updateNotificationSettings(data: NotificationSettingsFormData) {
  try {
    const session = await requireAuth();
    const parsed = notificationSettingsSchema.safeParse(data);

    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().fieldErrors };
    }

    const settings = await prisma.userNotificationSettings.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        ...parsed.data,
      },
      update: parsed.data,
    });

    revalidatePath("/");
    revalidatePath("/configuracoes");

    return {
      success: true,
      settings: serializeNotificationSettings(settings),
    };
  } catch (error) {
    const permissionMessage = getPermissionErrorMessage(error);
    if (permissionMessage) return { success: false, error: permissionMessage };

    return { success: false, error: "Erro ao salvar notificações." };
  }
}
