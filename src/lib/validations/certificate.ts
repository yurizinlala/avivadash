import { z } from "zod";
import { CERTIFICATE_TEMPLATE_IDS } from "@/lib/certificates";

export const CERTIFICATE_TYPES = CERTIFICATE_TEMPLATE_IDS;

const isValidDateKey = (value: string) =>
  !Number.isNaN(new Date(`${value}T12:00:00Z`).getTime());

const toDateKeyTime = (value: string) => new Date(`${value}T12:00:00Z`).getTime();

const todayTime = () => {
  const today = new Date().toISOString().split("T")[0];
  return toDateKeyTime(today);
};

export const certificateSchema = z
  .object({
    type: z.enum(CERTIFICATE_TYPES),
    recipientName: z
      .string()
      .trim()
      .min(3, "Nome do certificado é obrigatório")
      .max(120, "Nome muito longo"),
    personId: z.string().optional().or(z.literal("")),
    issueDate: z.string().min(1, "Data de emissão é obrigatória"),
  })
  .refine((data) => isValidDateKey(data.issueDate), {
    message: "Data de emissão inválida",
    path: ["issueDate"],
  })
  .refine(
    (data) => !isValidDateKey(data.issueDate) || toDateKeyTime(data.issueDate) <= todayTime(),
    {
      message: "Data de emissão não pode ser futura",
      path: ["issueDate"],
    }
  );

export const certificateUpdateSchema = z
  .object({
    id: z.string().min(1, "Certificado inválido"),
    recipientName: z
      .string()
      .trim()
      .min(3, "Nome do certificado é obrigatório")
      .max(120, "Nome muito longo"),
    personId: z.string().optional().or(z.literal("")),
    issueDate: z.string().min(1, "Data de emissão é obrigatória"),
  })
  .refine((data) => isValidDateKey(data.issueDate), {
    message: "Data de emissão inválida",
    path: ["issueDate"],
  })
  .refine(
    (data) => !isValidDateKey(data.issueDate) || toDateKeyTime(data.issueDate) <= todayTime(),
    {
      message: "Data de emissão não pode ser futura",
      path: ["issueDate"],
    }
  );

export type CertificateFormData = z.infer<typeof certificateSchema>;
export type CertificateUpdateData = z.infer<typeof certificateUpdateSchema>;
