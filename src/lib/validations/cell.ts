import { z } from "zod";

export const cellSchema = z.object({
  name: z.string().min(2, "Nome da célula é obrigatório"),
  coverUrl: z.string().optional().or(z.literal("")),
  foundedAt: z.string().optional().or(z.literal("")),

  // Leader Information
  leaderId: z.string().optional().or(z.literal("")),
  leaderName: z.string().min(2, "Nome do líder é obrigatório"),
  leaderPhone: z.string().optional().or(z.literal("")),
  leaderCpf: z.string().optional().or(z.literal("")),
  leaderBirthDate: z.string().optional().or(z.literal("")),

  // Address
  cep: z.string().optional().or(z.literal("")),
  street: z.string().optional().or(z.literal("")),
  number: z.string().optional().or(z.literal("")),
  complement: z.string().optional().or(z.literal("")),
  neighborhood: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),

  // Functioning
  dayOfWeek: z.string().optional().or(z.literal("")),
  time: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export type CellFormData = z.infer<typeof cellSchema>;
