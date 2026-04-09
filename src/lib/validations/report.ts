import { z } from "zod";

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
  notes: z.string().optional().or(z.literal("")),
});

export type ReportFormData = z.infer<typeof reportSchema>;
