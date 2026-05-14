import { z } from "zod";

const isValidCPF = (cpf: string) => {
  if (typeof cpf !== "string") return false;
  cpf = cpf.replace(/[^\d]+/g, "");
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  const cpfArray = cpf.split("").map(el => +el);
  const rest = (count: number) => (cpfArray.slice(0, count - 12).reduce((soma, el, index) => soma + el * (count - index), 0) * 10) % 11 % 10;
  return rest(10) === cpfArray[9] && rest(11) === cpfArray[10];
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

export const personSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(120, "Nome muito longo"),
  cpf: z.string().optional().or(z.literal("")).refine(val => !val || isValidCPF(val), "CPF inválido"),
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
  cep: z.string().optional().or(z.literal("")).refine((value) => !value || value.replace(/\D/g, "").length === 8, "CEP deve ter 8 dígitos"),
  street: z.string().optional().or(z.literal("")),
  number: z.string().optional().or(z.literal("")),
  complement: z.string().optional().or(z.literal("")),
  neighborhood: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")).refine((value) => !value || /^[A-Z]{2}$/.test(value), "UF deve ter 2 letras"),
  cellId: z.string().optional().or(z.literal("")),
  notes: z.string().max(1000, "Observações muito longas").optional().or(z.literal("")),
  photoUrl: z.string().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.birthDate) {
    if (!isValidDateString(data.birthDate) || !isNotFutureDate(data.birthDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de nascimento não pode ser futura",
        path: ["birthDate"],
      });
    }
  }

  if (data.weddingDate) {
    if (!isValidDateString(data.weddingDate) || !isNotFutureDate(data.weddingDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de casamento não pode ser futura",
        path: ["weddingDate"],
      });
    }
  }

  if (data.baptismDate) {
    if (!isValidDateString(data.baptismDate) || !isNotFutureDate(data.baptismDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de batismo não pode ser futura",
        path: ["baptismDate"],
      });
    }
  }

  if (data.conversionDate) {
    if (!isValidDateString(data.conversionDate) || !isNotFutureDate(data.conversionDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de conversão não pode ser futura",
        path: ["conversionDate"],
      });
    }
  }

  if (data.birthDate && data.weddingDate) {
    if (new Date(data.weddingDate) < new Date(data.birthDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de casamento não pode ser anterior à de nascimento",
        path: ["weddingDate"],
      });
    }
  }

  if (data.baptismDate && data.conversionDate) {
    if (new Date(data.conversionDate) > new Date(data.baptismDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de conversão não pode ser posterior ao batismo",
        path: ["conversionDate"],
      });
    }
  }

  if (data.isBaptized && !data.baptismDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe a data de batismo",
      path: ["baptismDate"],
    });
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
});

export type PersonFormData = z.infer<typeof personSchema>;
