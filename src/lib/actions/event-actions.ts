"use server";

import { prisma } from "@/lib/prisma";
import { eventSchema, type EventFormData } from "@/lib/validations/event";
import { revalidatePath } from "next/cache";
import {
  getPermissionErrorMessage,
  requireAuth,
  requireRole,
  WRITE_ROLES,
} from "@/lib/permissions";

export async function getEvents(month?: number, year?: number) {
  await requireAuth();

  const now = new Date();
  const m = month ?? now.getMonth();
  const y = year ?? now.getFullYear();

  const startDate = new Date(y, m, 1);
  const endDate = new Date(y, m + 1, 0, 23, 59, 59);

  return prisma.event.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "asc" },
  });
}

export async function getUpcomingEvents(limit = 4) {
  await requireAuth();

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return prisma.event.findMany({
    where: { date: { gte: now } },
    orderBy: { date: "asc" },
    take: limit,
  });
}

export async function createEvent(formData: EventFormData) {
  try {
    await requireRole(WRITE_ROLES);

    const result = eventSchema.safeParse(formData);
    if (!result.success) {
      return { success: false, error: result.error.flatten().fieldErrors };
    }

    const data = result.data;

    await prisma.event.create({
      data: {
        title: data.title,
        description: data.description || null,
        date: new Date(`${data.date}T12:00:00Z`),
        time: data.time || null,
        location: data.location || null,
        churchLocationId: data.churchLocationId || null,
        type: data.type,
        isRecurrent: data.isRecurrent,
      },
    });

    revalidatePath("/agenda");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    const permissionMessage = getPermissionErrorMessage(e);
    if (permissionMessage) return { success: false, error: permissionMessage };

    console.error("Error creating event:", e);
    return { success: false, error: "Erro ao criar evento." };
  }
}

export async function updateEvent(id: string, formData: EventFormData) {
  try {
    await requireRole(WRITE_ROLES);

    const result = eventSchema.safeParse(formData);
    if (!result.success) {
      return { success: false, error: result.error.flatten().fieldErrors };
    }

    const data = result.data;

    await prisma.event.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description || null,
        date: new Date(`${data.date}T12:00:00Z`),
        time: data.time || null,
        location: data.location || null,
        churchLocationId: data.churchLocationId || null,
        type: data.type,
        isRecurrent: data.isRecurrent,
      },
    });

    revalidatePath("/agenda");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    const permissionMessage = getPermissionErrorMessage(e);
    if (permissionMessage) return { success: false, error: permissionMessage };

    console.error("Error updating event:", e);
    return { success: false, error: "Erro ao atualizar evento." };
  }
}

export async function getAllEvents() {
  await requireAuth();

  return prisma.event.findMany({
    orderBy: { date: "asc" },
  });
}

export async function deleteEvent(id: string) {
  try {
    await requireRole(WRITE_ROLES);

    await prisma.event.delete({ where: { id } });
    revalidatePath("/agenda");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    const permissionMessage = getPermissionErrorMessage(e);
    if (permissionMessage) return { success: false, error: permissionMessage };

    console.error("Error deleting event:", e);
    return { success: false, error: "Erro ao excluir evento." };
  }
}

export async function getEventStats() {
  await requireAuth();

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [totalEvents, eventsThisMonth, upcomingEvents] = await Promise.all([
    prisma.event.count(),
    prisma.event.count({
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
    }),
    prisma.event.count({
      where: { date: { gte: startOfToday } },
    }),
  ]);

  return { totalEvents, eventsThisMonth, upcomingEvents };
}
