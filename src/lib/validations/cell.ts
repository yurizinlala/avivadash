import { z } from "zod";

const isValidCPF = (cpf: string) => {
  const digits = cpf.replace(/[^\d]+/g, "");
  if (digits.length !== 11 || /(\d)\1{10}/.test(digits)) return false;
  const numbers = digits.split("").map(Number);
  const rest = (count: number) =>
    (numbers.slice(0, count - 12).reduce((sum, digit, index) => sum + digit * (count - index), 0) * 10) % 11 % 10;
  return rest(10) === numbers[9] && rest(11) === numbers[10];
};

const isValidDateString = (value: string) => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
};

const isNotFutureDate = (value: string) => {
  if (!value) return true;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return new Date(`${value}T12:00:00Z`) <= today;
};

export const cellSchema = z.object({
  name: z.string().min(2, "Nome da célula é obrigatório").max(120, "Nome muito longo"),
  coverUrl: z.string().optional().or(z.literal("")),
  foundedAt: z.string().optional().or(z.literal("")),

  // Leader Information
  leaderId: z.string().optional().or(z.literal("")),
  leaderName: z.string().min(2, "Nome do líder é obrigatório").max(120, "Nome do líder muito longo"),
  leaderPhone: z.string().optional().or(z.literal("")),
  leaderCpf: z.string().optional().or(z.literal("")).refine((value) => !value || isValidCPF(value), "CPF do líder inválido"),
  leaderBirthDate: z.string().optional().or(z.literal("")),

  // Address
  cep: z.string().optional().or(z.literal("")).refine((value) => !value || value.replace(/\D/g, "").length === 8, "CEP deve ter 8 dígitos"),
  street: z.string().optional().or(z.literal("")),
  number: z.string().optional().or(z.literal("")),
  complement: z.string().optional().or(z.literal("")),
  neighborhood: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")).refine((value) => !value || /^[A-Z]{2}$/.test(value), "UF deve ter 2 letras"),

  // Functioning
  dayOfWeek: z.string().optional().or(z.literal("")),
  time: z.string().optional().or(z.literal("")).refine(
    (value) => !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
    "Horário inválido"
  ),
  isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.foundedAt && (!isValidDateString(data.foundedAt) || !isNotFutureDate(data.foundedAt))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Data de fundação não pode ser futura",
      path: ["foundedAt"],
    });
  }

  if (data.leaderBirthDate && (!isValidDateString(data.leaderBirthDate) || !isNotFutureDate(data.leaderBirthDate))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Nascimento do líder não pode ser futuro",
      path: ["leaderBirthDate"],
    });
  }

  if (data.foundedAt && data.leaderBirthDate) {
    const foundedAt = new Date(`${data.foundedAt}T12:00:00Z`);
    const leaderBirthDate = new Date(`${data.leaderBirthDate}T12:00:00Z`);
    if (foundedAt < leaderBirthDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fundação não pode ser anterior ao nascimento do líder",
        path: ["foundedAt"],
      });
    }
  }

  const hasAddress = Boolean(
    data.street ||
    data.number ||
    data.neighborhood ||
    data.city ||
    data.state ||
    (data.cep ?? "").replace(/\D/g, "").length === 8
  );
  if (hasAddress) {
    const requiredFields: Array<[keyof typeof data, string]> = [
      ["street", "Informe a rua"],
      ["number", "Informe o número"],
      ["neighborhood", "Informe o bairro"],
      ["city", "Informe a cidade"],
      ["state", "Informe a UF"],
    ];

    requiredFields.forEach(([field, message]) => {
      if (!data[field]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message,
          path: [field],
        });
      }
    });
  }

  if (data.dayOfWeek && !data.time) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe o horário da célula",
      path: ["time"],
    });
  }

  if (data.time && !data.dayOfWeek) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe o dia da semana",
      path: ["dayOfWeek"],
    });
  }
});

export type CellFormData = z.infer<typeof cellSchema>;
