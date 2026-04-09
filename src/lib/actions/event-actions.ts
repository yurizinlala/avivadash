"use server";

import { prisma } from "@/lib/prisma";
import { eventSchema, type EventFormData } from "@/lib/validations/event";
import { revalidatePath } from "next/cache";

export async function getEvents(month?: number, year?: number) {
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
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return prisma.event.findMany({
    where: { date: { gte: now } },
    orderBy: { date: "asc" },
    take: limit,
  });
}

export async function createEvent(formData: EventFormData) {
  const result = eventSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.flatten().fieldErrors };
  }

  const data = result.data;

  try {
    await prisma.event.create({
      data: {
        title: data.title,
        description: data.description || null,
        date: new Date(data.date),
        time: data.time || null,
        location: data.location || null,
        type: data.type,
        isRecurrent: data.isRecurrent,
      },
    });

    revalidatePath("/agenda");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Error creating event:", e);
    return { success: false, error: "Erro ao criar evento." };
  }
}

export async function updateEvent(id: string, formData: EventFormData) {
  const result = eventSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.flatten().fieldErrors };
  }

  const data = result.data;

  try {
    await prisma.event.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description || null,
        date: new Date(data.date),
        time: data.time || null,
        location: data.location || null,
        type: data.type,
        isRecurrent: data.isRecurrent,
      },
    });

    revalidatePath("/agenda");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Error updating event:", e);
    return { success: false, error: "Erro ao atualizar evento." };
  }
}

export async function getAllEvents() {
  return prisma.event.findMany({
    orderBy: { date: "asc" },
  });
}

export async function deleteEvent(id: string) {
  try {
    await prisma.event.delete({ where: { id } });
    revalidatePath("/agenda");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Error deleting event:", e);
    return { success: false, error: "Erro ao excluir evento." };
  }
}

export async function getEventStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [totalEvents, eventsThisMonth, upcomingEvents] = await Promise.all([
    prisma.event.count(),
    prisma.event.count({
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
    }),
    prisma.event.count({
      where: { date: { gte: now } },
    }),
  ]);

  return { totalEvents, eventsThisMonth, upcomingEvents };
}
