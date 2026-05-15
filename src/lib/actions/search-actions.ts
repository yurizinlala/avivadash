"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "person" | "cell" | "event";
  href: string;
  photoUrl?: string | null;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  await requireAuth();

  if (!query || query.trim().length < 2) return [];

  const q = query.trim();
  const results: SearchResult[] = [];

  // Search Persons
  const persons = await prisma.person.findMany({
    where: {
      fullName: { contains: q, mode: "insensitive" },
    },
    take: 5,
    select: { id: true, fullName: true, personType: true, phone: true, photoUrl: true },
  });
  for (const p of persons) {
    results.push({
      id: p.id,
      title: p.fullName,
      subtitle: `${p.personType} ${p.phone ? `• ${p.phone}` : ""}`,
      type: "person",
      href: `/pessoas?search=${encodeURIComponent(p.fullName)}`,
      photoUrl: p.photoUrl,
    });
  }

  // Search Cells
  const cells = await prisma.cell.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { leaderName: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 5,
    select: { id: true, name: true, leaderName: true, dayOfWeek: true },
  });
  for (const c of cells) {
    results.push({
      id: c.id,
      title: c.name,
      subtitle: `Líder: ${c.leaderName} ${c.dayOfWeek ? `• ${c.dayOfWeek}` : ""}`,
      type: "cell",
      href: `/celulas?highlight=${c.id}`,
    });
  }

  // Search Events
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 5,
    select: { id: true, title: true, date: true, location: true },
  });
  for (const e of events) {
    const dateStr = new Date(e.date).toLocaleDateString("pt-BR");
    results.push({
      id: e.id,
      title: e.title,
      subtitle: `${dateStr} ${e.location ? `• ${e.location}` : ""}`,
      type: "event",
      href: `/agenda?eventId=${e.id}`,
    });
  }

  return results;
}
