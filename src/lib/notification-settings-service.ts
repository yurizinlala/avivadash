import { prisma } from "@/lib/prisma";

export const DEFAULT_NOTIFICATION_SETTINGS = {
  birthdaysEnabled: true,
  birthdayLeadDays: 2,
  eventsEnabled: true,
  eventLeadDays: 3,
  visitorsEnabled: true,
  visitorRecentDays: 7,
};

export type NotificationSettingsDto = typeof DEFAULT_NOTIFICATION_SETTINGS & {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type NotificationSettingsRow = {
  id: string;
  userId: string;
  birthdaysEnabled: boolean;
  birthdayLeadDays: number;
  eventsEnabled: boolean;
  eventLeadDays: number;
  visitorsEnabled: boolean;
  visitorRecentDays: number;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeNotificationSettings(
  settings: NotificationSettingsRow
): NotificationSettingsDto {
  return {
    id: settings.id,
    userId: settings.userId,
    birthdaysEnabled: settings.birthdaysEnabled,
    birthdayLeadDays: settings.birthdayLeadDays,
    eventsEnabled: settings.eventsEnabled,
    eventLeadDays: settings.eventLeadDays,
    visitorsEnabled: settings.visitorsEnabled,
    visitorRecentDays: settings.visitorRecentDays,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export async function ensureNotificationSettingsForUser(userId: string) {
  return prisma.userNotificationSettings.upsert({
    where: { userId },
    create: {
      userId,
      ...DEFAULT_NOTIFICATION_SETTINGS,
    },
    update: {},
  });
}
