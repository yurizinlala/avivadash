"use server";

import { prisma } from "@/lib/prisma";
import { personSchema, type PersonFormData } from "@/lib/validations/person";
import { revalidatePath } from "next/cache";

export type PersonWithCell = Awaited<ReturnType<typeof getPersons>>["data"][0];

export async function getPersons({
  search = "",
  type = "",
  page = 1,
  pageSize = 20,
  status = "",
  baptized = "",
  cell = "",
}: {
  search?: string;
  type?: string;
  page?: number;
  pageSize?: number;
  status?: string;
  baptized?: string;
  cell?: string;
} = {}) {
  const where: Record<string, unknown> = {};

  if (search) {
    where.fullName = { contains: search };
  }
  if (type && type !== "todos") {
    const typeMap: Record<string, string> = {
      membros: "MEMBRO",
      visitantes: "VISITANTE",
      congregados: "CONGREGADO",
    };
    if (typeMap[type]) {
      where.personType = typeMap[type];
    }
  }

  // Advanced filters
  if (status) {
    where.memberStatus = status;
  }
  if (baptized === "yes") {
    where.isBaptized = true;
  } else if (baptized === "no") {
    where.isBaptized = false;
  }
  if (cell === "none") {
    where.cellId = null;
  } else if (cell) {
    where.cellId = cell;
  }

  const [data, total] = await Promise.all([
    prisma.person.findMany({
      where,
      include: { cell: { select: { id: true, name: true } } },
      orderBy: { fullName: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.person.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getPersonById(id: string) {
  return prisma.person.findUnique({
    where: { id },
    include: { cell: { select: { id: true, name: true } } },
  });
}


export async function createPerson(formData: PersonFormData) {
  const result = personSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.flatten().fieldErrors };
  }

  const data = result.data;

  try {
    await prisma.person.create({
      data: {
        fullName: data.fullName,
        cpf: data.cpf || null,
        email: data.email || null,
        phone: data.phone || null,
        birthDate: data.birthDate ? new Date(`${data.birthDate}T12:00:00Z`) : null,
        maritalStatus: data.maritalStatus || null,
        weddingDate: data.weddingDate ? new Date(`${data.weddingDate}T12:00:00Z`) : null,
        profession: data.profession || null,
        personType: data.personType,
        memberStatus: data.memberStatus,
        isBaptized: data.isBaptized,
        baptismDate: data.baptismDate ? new Date(`${data.baptismDate}T12:00:00Z`) : null,
        conversionDate: data.conversionDate ? new Date(`${data.conversionDate}T12:00:00Z`) : null,
        cep: data.cep || null,
        street: data.street || null,
        number: data.number || null,
        complement: data.complement || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        state: data.state || null,
        cellId: data.cellId || null,
        notes: data.notes || null,
        photoUrl: data.photoUrl || null,
      },
    });

    revalidatePath("/pessoas");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Error creating person:", e);
    return { success: false, error: "Erro ao cadastrar pessoa." };
  }
}

export async function updatePerson(id: string, formData: PersonFormData) {
  const result = personSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.flatten().fieldErrors };
  }

  const data = result.data;

  try {
    await prisma.person.update({
      where: { id },
      data: {
        fullName: data.fullName,
        cpf: data.cpf || null,
        email: data.email || null,
        phone: data.phone || null,
        birthDate: data.birthDate ? new Date(`${data.birthDate}T12:00:00Z`) : null,
        maritalStatus: data.maritalStatus || null,
        weddingDate: data.weddingDate ? new Date(`${data.weddingDate}T12:00:00Z`) : null,
        profession: data.profession || null,
        personType: data.personType,
        memberStatus: data.memberStatus,
        isBaptized: data.isBaptized,
        baptismDate: data.baptismDate ? new Date(`${data.baptismDate}T12:00:00Z`) : null,
        conversionDate: data.conversionDate ? new Date(`${data.conversionDate}T12:00:00Z`) : null,
        cep: data.cep || null,
        street: data.street || null,
        number: data.number || null,
        complement: data.complement || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        state: data.state || null,
        cellId: data.cellId || null,
        notes: data.notes || null,
        photoUrl: data.photoUrl || null,
      },
    });

    revalidatePath("/pessoas");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Error updating person:", e);
    return { success: false, error: "Erro ao atualizar pessoa." };
  }
}

export async function deletePerson(id: string) {
  try {
    await prisma.person.delete({ where: { id } });
    revalidatePath("/pessoas");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Error deleting person:", e);
    return { success: false, error: "Erro ao excluir pessoa." };
  }
}

export async function getPersonStats() {
  const [total, membros, visitantes, congregados] = await Promise.all([
    prisma.person.count(),
    prisma.person.count({ where: { personType: "MEMBRO" } }),
    prisma.person.count({ where: { personType: "VISITANTE" } }),
    prisma.person.count({ where: { personType: "CONGREGADO" } }),
  ]);
  return { total, membros, visitantes, congregados };
}

export async function getPeopleSimple() {
  return prisma.person.findMany({
    where: { memberStatus: { not: "FALECIDO" } },
    select: { 
      id: true, 
      fullName: true, 
      phone: true,
      cpf: true,
      birthDate: true,
      personType: true
    },
    orderBy: { fullName: "asc" },
  });
}
