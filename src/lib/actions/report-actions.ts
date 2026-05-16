"use server";

import { prisma } from "@/lib/prisma";
import { reportSchema, type ReportFormData } from "@/lib/validations/report";
import { revalidatePath } from "next/cache";
import {
  getPermissionErrorMessage,
  requireAuth,
  requireRole,
  WRITE_ROLES,
} from "@/lib/permissions";

export async function getReports() {
  await requireAuth();

  return prisma.monthlyReport.findMany({
    orderBy: { referenceMonth: "desc" },
  });
}

export async function getLatestReport() {
  await requireAuth();

  return prisma.monthlyReport.findFirst({
    orderBy: { referenceMonth: "desc" },
  });
}

export async function createReport(formData: ReportFormData) {
  try {
    await requireRole(WRITE_ROLES);

    const result = reportSchema.safeParse(formData);
    if (!result.success) {
      return { success: false, error: result.error.flatten().fieldErrors };
    }

    const data = result.data;
    const refMonth = new Date(`${data.referenceMonth}-01T12:00:00Z`);

    // Upsert: update if same month already exists
    await prisma.monthlyReport.upsert({
      where: { referenceMonth: refMonth },
      update: {
        totalMembers: data.totalMembers,
        totalVisitors: data.totalVisitors,
        totalBaptisms: data.totalBaptisms,
        totalConversions: data.totalConversions,
        totalTransfers: data.totalTransfers,
        totalTithes: data.totalTithes,
        totalOfferings: data.totalOfferings,
        totalOtherIncome: data.totalOtherIncome,
        totalExpenses: data.totalExpenses,
        notes: data.notes || null,
        generatedAt: new Date(),
      },
      create: {
        referenceMonth: refMonth,
        totalMembers: data.totalMembers,
        totalVisitors: data.totalVisitors,
        totalBaptisms: data.totalBaptisms,
        totalConversions: data.totalConversions,
        totalTransfers: data.totalTransfers,
        totalTithes: data.totalTithes,
        totalOfferings: data.totalOfferings,
        totalOtherIncome: data.totalOtherIncome,
        totalExpenses: data.totalExpenses,
        notes: data.notes || null,
        generatedAt: new Date(),
      },
    });

    revalidatePath("/relatorios");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    const permissionMessage = getPermissionErrorMessage(e);
    if (permissionMessage) return { success: false, error: permissionMessage };

    console.error("Error creating report:", e);
    return { success: false, error: "Erro ao salvar relatório." };
  }
}

export async function deleteReport(id: string) {
  try {
    await requireRole(WRITE_ROLES);

    await prisma.monthlyReport.delete({ where: { id } });

    revalidatePath("/relatorios");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    const permissionMessage = getPermissionErrorMessage(e);
    if (permissionMessage) return { success: false, error: permissionMessage };

    console.error("Error deleting report:", e);
    return { success: false, error: "Erro ao excluir relatÃ³rio." };
  }
}
