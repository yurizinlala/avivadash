import { z } from "zod";

export const personSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  maritalStatus: z.enum(["SOLTEIRO", "CASADO", "DIVORCIADO", "VIUVO"]).optional().or(z.literal("")),
  weddingDate: z.string().optional().or(z.literal("")),
  profession: z.string().optional().or(z.literal("")),
  personType: z.enum(["MEMBRO", "VISITANTE", "CONGREGADO"]).default("VISITANTE"),
  memberStatus: z.enum(["ATIVO", "INATIVO", "TRANSFERIDO", "FALECIDO"]).default("ATIVO"),
  isBaptized: z.boolean().default(false),
  baptismDate: z.string().optional().or(z.literal("")),
  conversionDate: z.string().optional().or(z.literal("")),
  cep: z.string().optional().or(z.literal("")),
  street: z.string().optional().or(z.literal("")),
  number: z.string().optional().or(z.literal("")),
  complement: z.string().optional().or(z.literal("")),
  neighborhood: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  cellId: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  photoUrl: z.string().optional().or(z.literal("")),
});

export type PersonFormData = z.infer<typeof personSchema>;
