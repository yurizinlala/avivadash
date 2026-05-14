"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

interface PersonBirthday {
  id: string;
  fullName: string;
  birthDate: Date | null;
  personType: string;
  cellId: string | null;
}

interface EventRow {
  id: string;
  title: string;
  date: Date;
  time: string | null;
  location: string | null;
  type: string | null;
  description: string | null;
  isRecurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function getDashboardStats() {
  await requireAuth();

  const today = new Date();
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  // Get 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalMembers,
    newMembersThisMonth,
    activeCells,
    recentVisitors,
    allPeople,
    upcomingEvents,
    latestReport,
  ] = await Promise.all([
    prisma.person.count({ where: { personType: "MEMBRO" } }),
    prisma.person.count({
      where: {
        personType: "MEMBRO",
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.cell.count({ where: { isActive: true } }),
    prisma.person.count({
      where: {
        personType: "VISITANTE",
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    // Get all people for birthday check (SQLite has limited date functions)
    prisma.person.findMany({
      where: { birthDate: { not: null } },
      select: { id: true, fullName: true, birthDate: true, personType: true, cellId: true },
    }),
    // Upcoming events
    prisma.event.findMany({
      where: { date: { gte: startOfToday } },
      orderBy: { date: "asc" },
      take: 3,
    }),
    // Latest report
    prisma.monthlyReport.findFirst({
      orderBy: { referenceMonth: "desc" },
    }),
  ]);

  // Filter birthdays today (month and day match)
  const birthdaysToday = allPeople.filter((p: PersonBirthday) => {
    if (!p.birthDate) return false;
    const bd = new Date(p.birthDate);
    return bd.getMonth() === todayMonth && bd.getDate() === todayDay;
  });

  return {
    totalMembers,
    activeCells,
    recentVisitors,
    newMembersThisMonth,
    birthdaysToday: birthdaysToday.map((p: PersonBirthday) => {
      const age = p.birthDate
        ? today.getFullYear() - new Date(p.birthDate).getFullYear()
        : null;
      const initials = p.fullName
        .split(" ")
        .map((w: string) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      return {
        id: p.id,
        name: p.fullName,
        age,
        type: p.personType,
        initials,
      };
    }),
    upcomingEvents: upcomingEvents.map((e: EventRow) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      time: e.time,
      location: e.location,
      type: e.type,
    })),
    latestReport,
  };
}
