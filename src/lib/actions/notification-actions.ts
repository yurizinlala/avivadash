"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export interface Notification {
  id: string;
  type: "birthday" | "event" | "visitor" | "report";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export async function getNotifications(): Promise<Notification[]> {
  await requireAuth();

  const today = new Date();
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const notifications: Notification[] = [];

  // 1) Birthdays today
  const allPeopleWithBirthday = await prisma.person.findMany({
    where: { birthDate: { not: null } },
    select: { id: true, fullName: true, birthDate: true },
  });

  for (const person of allPeopleWithBirthday) {
    if (!person.birthDate) continue;
    const bd = new Date(person.birthDate);
    if (bd.getMonth() === todayMonth && bd.getDate() === todayDay) {
      const age = today.getFullYear() - bd.getFullYear();
      notifications.push({
        id: `birthday-${person.id}`,
        type: "birthday",
        title: "🎂 Aniversário hoje!",
        description: `${person.fullName} completa ${age} anos hoje.`,
        time: "Hoje",
        read: false,
      });
    }
  }

  // 2) Upcoming events in the next 3 days
  const threeDaysLater = new Date(startOfToday);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  threeDaysLater.setHours(23, 59, 59, 999);

  const upcomingEvents = await prisma.event.findMany({
    where: {
      date: { gte: startOfToday, lte: threeDaysLater },
    },
    orderBy: { date: "asc" },
    take: 5,
  });

  for (const event of upcomingEvents) {
    const eventDate = new Date(event.date);
    const isToday =
      eventDate.getDate() === todayDay && eventDate.getMonth() === todayMonth;
    const isTomorrow =
      eventDate.getFullYear() === startOfTomorrow.getFullYear() &&
      eventDate.getMonth() === startOfTomorrow.getMonth() &&
      eventDate.getDate() === startOfTomorrow.getDate();

    notifications.push({
      id: `event-${event.id}`,
      type: "event",
      title: "📅 Evento próximo",
      description: `${event.title}${event.time ? ` às ${event.time}` : ""}`,
      time: isToday ? "Hoje" : isTomorrow ? "Amanhã" : eventDate.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" }),
      read: false,
    });
  }

  // 3) New visitors in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentVisitors = await prisma.person.findMany({
    where: {
      personType: "VISITANTE",
      createdAt: { gte: sevenDaysAgo },
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
      title: "👋 Novo visitante",
      description: `${visitor.fullName} foi cadastrado(a).`,
      time: daysAgo === 0 ? "Hoje" : daysAgo === 1 ? "Ontem" : `${daysAgo}d atrás`,
      read: false,
    });
  }

  return notifications;
}
