import { z } from "zod";

export const notificationSettingsSchema = z.object({
  birthdaysEnabled: z.boolean(),
  birthdayLeadDays: z.coerce.number().int().min(0).max(30),
  eventsEnabled: z.boolean(),
  eventLeadDays: z.coerce.number().int().min(0).max(30),
  visitorsEnabled: z.boolean(),
  visitorRecentDays: z.coerce.number().int().min(1).max(30),
});

export type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;
