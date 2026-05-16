"use server";

import { prisma } from "@/lib/prisma";
import { ensureNotificationSettingsForUser } from "@/lib/notification-settings-service";
import { requireAuth } from "@/lib/permissions";

export interface Notification {
  id: string;
  type: "birthday" | "event" | "visitor" | "report";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function notificationDayLabel(daysUntil: number) {
  if (daysUntil === 0) return "Hoje";
  if (daysUntil === 1) return "Amanhã";
  return `Em ${daysUntil} dias`;
}

function nextBirthdayDate(birthDate: Date, startOfToday: Date) {
  const birthday = new Date(birthDate);
  let nextBirthday = new Date(
    startOfToday.getFullYear(),
    birthday.getMonth(),
    birthday.getDate()
  );
  nextBirthday.setHours(0, 0, 0, 0);

  if (nextBirthday < startOfToday) {
    nextBirthday = new Date(
      startOfToday.getFullYear() + 1,
      birthday.getMonth(),
      birthday.getDate()
    );
    nextBirthday.setHours(0, 0, 0, 0);
  }

  return nextBirthday;
}

function daysBetween(start: Date, target: Date) {
  return Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export async function getNotifications(): Promise<Notification[]> {
  const session = await requireAuth();
  const settings = await ensureNotificationSettingsForUser(session.userId);

  const today = new Date();
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  const notifications: Notification[] = [];

  if (settings.birthdaysEnabled) {
    const allPeopleWithBirthday = await prisma.person.findMany({
      where: { birthDate: { not: null } },
      select: { id: true, fullName: true, birthDate: true },
    });

    for (const person of allPeopleWithBirthday) {
      if (!person.birthDate) continue;

      const nextBirthday = nextBirthdayDate(person.birthDate, startOfToday);
      const daysUntil = daysBetween(startOfToday, nextBirthday);
      if (daysUntil < 0 || daysUntil > settings.birthdayLeadDays) continue;

      const age = nextBirthday.getFullYear() - new Date(person.birthDate).getFullYear();
      notifications.push({
        id: `birthday-${person.id}-${dateKey(nextBirthday)}`,
        type: "birthday",
        title: daysUntil === 0 ? "Aniversário hoje!" : "Aniversário chegando",
        description:
          daysUntil === 0
            ? `${person.fullName} completa ${age} anos hoje.`
            : `${person.fullName} completa ${age} anos ${
                daysUntil === 1 ? "amanhã" : `em ${daysUntil} dias`
              }.`,
        time: notificationDayLabel(daysUntil),
        read: false,
      });
    }
  }

  if (settings.eventsEnabled) {
    const eventRangeEnd = new Date(startOfToday);
    eventRangeEnd.setDate(eventRangeEnd.getDate() + settings.eventLeadDays);
    eventRangeEnd.setHours(23, 59, 59, 999);

    const upcomingEvents = await prisma.event.findMany({
      where: {
        date: { gte: startOfToday, lte: eventRangeEnd },
      },
      orderBy: { date: "asc" },
      take: 5,
    });

    for (const event of upcomingEvents) {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      const daysUntil = daysBetween(startOfToday, eventDate);

      notifications.push({
        id: `event-${event.id}`,
        type: "event",
        title: "Evento próximo",
        description: `${event.title}${event.time ? ` às ${event.time}` : ""}`,
        time: notificationDayLabel(daysUntil),
        read: false,
      });
    }
  }

  if (settings.visitorsEnabled) {
    const visitorsSince = new Date();
    visitorsSince.setDate(visitorsSince.getDate() - settings.visitorRecentDays);

    const recentVisitors = await prisma.person.findMany({
      where: {
        personType: "VISITANTE",
        createdAt: { gte: visitorsSince },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, fullName: true, createdAt: true },
    });

    for (const visitor of recentVisitors) {
      const daysAgo = Math.floor(
        (today.getTime() - new Date(visitor.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      notifications.push({
        id: `visitor-${visitor.id}`,
        type: "visitor",
        title: "Novo visitante",
        description: `${visitor.fullName} foi cadastrado(a).`,
        time: daysAgo === 0 ? "Hoje" : daysAgo === 1 ? "Ontem" : `${daysAgo}d atrás`,
        read: false,
      });
    }
  }

  return notifications;
}
