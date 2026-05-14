import { z } from "zod";

const currentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const isValidMonthKey = (value: string) => {
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
};

export const reportSchema = z.object({
  referenceMonth: z.string().min(1, "Mês de referência é obrigatório"),
  totalMembers: z.coerce.number().int().min(0).default(0),
  totalVisitors: z.coerce.number().int().min(0).default(0),
  totalBaptisms: z.coerce.number().int().min(0).default(0),
  totalConversions: z.coerce.number().int().min(0).default(0),
  totalTransfers: z.coerce.number().int().min(0).default(0),
  totalTithes: z.coerce.number().min(0).default(0),
  totalOfferings: z.coerce.number().min(0).default(0),
  totalOtherIncome: z.coerce.number().min(0).default(0),
  totalExpenses: z.coerce.number().min(0).default(0),
  notes: z.string().max(800, "Observações muito longas").optional().or(z.literal("")),
}).refine((data) => isValidMonthKey(data.referenceMonth), {
  message: "Mês de referência inválido",
  path: ["referenceMonth"],
}).refine((data) => data.referenceMonth <= currentMonthKey(), {
  message: "Não é possível lançar relatório de mês futuro",
  path: ["referenceMonth"],
});

export type ReportFormData = z.infer<typeof reportSchema>;
