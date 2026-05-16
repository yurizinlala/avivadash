import { z } from "zod";

const isValidDateString = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
};

export const eventSchema = z.object({
  title: z.string().trim().min(2, "Título do evento é obrigatório").max(120, "Título muito longo"),
  description: z.string().max(500, "Descrição muito longa").optional().or(z.literal("")),
  date: z.string().min(1, "Data é obrigatória"),
  time: z.string().optional().or(z.literal("")).refine(
    (value) => !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
    "Horário inválido"
  ),
  location: z.string().max(240, "Localização muito longa").optional().or(z.literal("")),
  churchLocationId: z.string().optional().or(z.literal("")),
  type: z.enum(["culto", "reuniao", "congresso"]).default("culto"),
  isRecurrent: z.boolean().default(false),
}).refine((data) => {
  return isValidDateString(data.date);
}, {
  message: "Data inválida",
  path: ["date"],
}).refine((data) => !data.isRecurrent || Boolean(data.time), {
  message: "Informe o horário para eventos recorrentes",
  path: ["time"],
});

export type EventFormData = z.infer<typeof eventSchema>;
