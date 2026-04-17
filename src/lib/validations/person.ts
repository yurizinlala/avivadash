import { z } from "zod";

const isValidCPF = (cpf: string) => {
  if (typeof cpf !== 'string') return false;
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  const cpfArray = cpf.split('').map(el => +el);
  const rest = (count: number) => (cpfArray.slice(0, count - 12).reduce((soma, el, index) => soma + el * (count - index), 0) * 10) % 11 % 10;
  return rest(10) === cpfArray[9] && rest(11) === cpfArray[10];
};

export const personSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
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
}).refine(data => {
  if (data.birthDate && data.weddingDate) {
    return new Date(data.weddingDate) >= new Date(data.birthDate);
  }
  return true;
}, {
  message: "Data de casamento não pode ser anterior à de nascimento",
  path: ["weddingDate"]
}).refine(data => {
  if (data.baptismDate && data.conversionDate) {
    return new Date(data.conversionDate) <= new Date(data.baptismDate); // Or wait, "conversion depois do batismo"? No, usually you convert first, then baptize. So conversion <= baptism.
    // Let me re-read the prompt. "como conversão depois do batismo". Oh, conversão depois do batismo is WRONG, so they want to prevent it. Thus, conversion must be BEFORE or EQUAL to baptism.
  }
  return true;
}, {
  message: "Data de conversão não pode ser posterior ao batismo",
  path: ["conversionDate"]
});

export type PersonFormData = z.infer<typeof personSchema>;
