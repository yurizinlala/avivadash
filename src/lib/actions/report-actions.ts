"use server";

import { prisma } from "@/lib/prisma";
import { reportSchema, type ReportFormData } from "@/lib/validations/report";
import { revalidatePath } from "next/cache";

export async function getReports() {
  return prisma.monthlyReport.findMany({
    orderBy: { referenceMonth: "desc" },
  });
}

export async function getLatestReport() {
  return prisma.monthlyReport.findFirst({
    orderBy: { referenceMonth: "desc" },
  });
}

export async function createReport(formData: ReportFormData) {
  const result = reportSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.flatten().fieldErrors };
  }

  const data = result.data;
  const refMonth = new Date(data.referenceMonth);

  try {
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
    console.error("Error creating report:", e);
    return { success: false, error: "Erro ao salvar relatório." };
  }
}
