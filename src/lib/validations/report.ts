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

const integerField = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}, z.number().int().min(0));

const currencyField = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const normalized = value
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  return normalized ? Number(normalized) : 0;
}, z.number().min(0));

export const reportSchema = z.object({
  referenceMonth: z.string().min(1, "Mês de referência é obrigatório"),
  totalMembers: integerField.default(0),
  totalVisitors: integerField.default(0),
  totalBaptisms: integerField.default(0),
  totalConversions: integerField.default(0),
  totalTransfers: integerField.default(0),
  totalTithes: currencyField.default(0),
  totalOfferings: currencyField.default(0),
  totalOtherIncome: currencyField.default(0),
  totalExpenses: currencyField.default(0),
  notes: z.string().max(800, "Observações muito longas").optional().or(z.literal("")),
}).refine((data) => isValidMonthKey(data.referenceMonth), {
  message: "Mês de referência inválido",
  path: ["referenceMonth"],
}).refine((data) => data.referenceMonth <= currentMonthKey(), {
  message: "Não é possível lançar relatório de mês futuro",
  path: ["referenceMonth"],
});

export type ReportFormData = z.infer<typeof reportSchema>;
