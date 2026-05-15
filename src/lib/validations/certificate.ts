import { z } from "zod";

export const CERTIFICATE_TYPES = [
  "BATISMO",
  "MEMBRESIA",
  "APRESENTACAO",
  "CURSO",
  "HONRA",
  "PARTICIPACAO",
] as const;

const isValidDateKey = (value: string) => !Number.isNaN(new Date(`${value}T12:00:00Z`).getTime());
const toDateKeyTime = (value: string) => new Date(`${value}T12:00:00Z`).getTime();
const todayTime = () => {
  const today = new Date().toISOString().split("T")[0];
  return toDateKeyTime(today);
};

export const certificateSchema = z.object({
  type: z.enum(CERTIFICATE_TYPES),
  title: z.string().trim().min(3, "Título é obrigatório").max(90, "Título muito longo"),
  recipientName: z.string().trim().min(3, "Nome do certificado é obrigatório").max(120, "Nome muito longo"),
  personId: z.string().optional().or(z.literal("")),
  description: z.string().trim().max(280, "Descrição muito longa").optional().or(z.literal("")),
  issueDate: z.string().min(1, "Data de emissão é obrigatória"),
  eventDate: z.string().optional().or(z.literal("")),
  issuerName: z.string().trim().max(90, "Nome do emissor muito longo").optional().or(z.literal("")),
}).refine((data) => isValidDateKey(data.issueDate), {
  message: "Data de emissão inválida",
  path: ["issueDate"],
}).refine((data) => !data.eventDate || isValidDateKey(data.eventDate), {
  message: "Data do evento inválida",
  path: ["eventDate"],
}).refine((data) => !isValidDateKey(data.issueDate) || toDateKeyTime(data.issueDate) <= todayTime(), {
  message: "Data de emissão não pode ser futura",
  path: ["issueDate"],
}).refine((data) => {
  if (!data.eventDate || !isValidDateKey(data.eventDate) || !isValidDateKey(data.issueDate)) return true;
  return toDateKeyTime(data.eventDate) <= toDateKeyTime(data.issueDate);
}, {
  message: "Data do evento não pode ser posterior à emissão",
  path: ["eventDate"],
});

export type CertificateFormData = z.infer<typeof certificateSchema>;
