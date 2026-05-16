import { z } from "zod";

export const churchLocationSchema = z.object({
  name: z.string().trim().min(2, "Nome do local é obrigatório").max(120, "Nome muito longo"),
  type: z.enum(["SEDE", "CONGREGACAO"]).default("CONGREGACAO"),
  cep: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || value.replace(/\D/g, "").length === 8,
      "CEP deve ter 8 dígitos"
    ),
  street: z.string().trim().min(2, "Informe a rua").max(120, "Rua muito longa"),
  number: z.string().trim().min(1, "Informe o número").max(20, "Número muito longo"),
  complement: z.string().trim().max(80, "Complemento muito longo").optional().or(z.literal("")),
  neighborhood: z.string().trim().min(2, "Informe o bairro").max(120, "Bairro muito longo"),
  city: z.string().trim().min(2, "Informe a cidade").max(120, "Cidade muito longa"),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => /^[A-Z]{2}$/.test(value), "UF deve ter 2 letras"),
});

export type ChurchLocationFormData = z.infer<typeof churchLocationSchema>;
