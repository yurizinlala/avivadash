import { z } from "zod";

export const cellSchema = z.object({
  name: z.string().min(2, "Nome da célula é obrigatório"),
  leaderName: z.string().min(2, "Nome do líder é obrigatório"),
  leaderPhone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  dayOfWeek: z.string().optional().or(z.literal("")),
  time: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export type CellFormData = z.infer<typeof cellSchema>;
