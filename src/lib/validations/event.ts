import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().min(2, "Título do evento é obrigatório"),
  description: z.string().optional().or(z.literal("")),
  date: z.string().min(1, "Data é obrigatória"),
  time: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  type: z.enum(["culto", "reuniao", "congresso"]).default("culto"),
  isRecurrent: z.boolean().default(false),
});

export type EventFormData = z.infer<typeof eventSchema>;
