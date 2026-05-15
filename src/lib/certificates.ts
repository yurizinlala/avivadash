export const CERTIFICATE_TEMPLATES = [
  {
    id: "BATISMO",
    title: "Certificado de Batismo",
    shortDescription: "Batismo em águas.",
    backgroundPath: "/certificates/backgrounds/batismo.png",
    preName: "Certificamos que",
    bodyText:
      "foi batizado(a) no dia [Data] em águas em nome do Pai, do Filho e do Espírito Santo, conforme mandamento do Senhor Jesus Cristo em Mateus 28:19.",
    verse:
      '"E indo eles caminhando, chegando a certo lugar aonde havia água; disse o Eunuco: Eis água que impede que eu seja batizado?" - Atos 8:36',
  },
  {
    id: "APRESENTACAO_MENINO",
    title: "Certificado de Apresentação",
    shortDescription: "Apresentação de menino ao Senhor.",
    backgroundPath: "/certificates/backgrounds/apresentacao-menino.png",
    preName: "",
    bodyText:
      "foi apresentado diante da congregação no dia [Data], durante o culto de adoração em nossa igreja, conforme a tradição e os ensinamentos da IEAB.",
    verse:
      '"Deixai vir a mim as criancinhas, não as impeçais, pois o Reino dos céus é para aqueles que se parecem com elas." - Mateus 19:14',
  },
  {
    id: "APRESENTACAO_MENINA",
    title: "Certificado de Apresentação",
    shortDescription: "Apresentação de menina ao Senhor.",
    backgroundPath: "/certificates/backgrounds/apresentacao-menina.png",
    preName: "",
    bodyText:
      "foi apresentada diante da congregação no dia [Data], durante o culto de adoração em nossa igreja, conforme a tradição e os ensinamentos da IEAB.",
    verse:
      '"Deixai vir a mim as criancinhas, não as impeçais, pois o Reino dos céus é para aqueles que se parecem com elas." - Mateus 19:14',
  },
  {
    id: "RECEBIMENTO",
    title: "Certificado de Recebimento",
    shortDescription: "Recebimento de novo membro.",
    backgroundPath: "/certificates/backgrounds/recebimento.png",
    preName: "Certificamos que",
    bodyText:
      "foi recebido como novo membro na data de [Data], durante o culto de adoração em nossa igreja, em conformidade com os princípios e práticas estabelecidos pela IEAB.",
    verse:
      '"[...] assim também em Cristo nós, que somos muitos, formamos um corpo, e cada membro está ligado a todos os outros" - Romanos 12:5',
  },
  {
    id: "DIACONO",
    title: "Certificado de Diácono",
    shortDescription: "Consagração ministerial de diácono.",
    backgroundPath: "/certificates/backgrounds/diacono.png",
    preName: "Certificamos que",
    bodyText:
      "foi consagrado ao ministério como Diácono, no dia [Data], durante o culto solene de consagração, para servir a IEAB conforme Art. 126 da Constituição.\n\nEsta consagração é o reconhecimento público do chamado divino e do compromisso pessoal deste obreiro em servir fielmente ao Senhor e à sua igreja.",
    verse: "",
  },
  {
    id: "DIACONISA",
    title: "Certificado de Diaconisa",
    shortDescription: "Consagração ministerial de diaconisa.",
    backgroundPath: "/certificates/backgrounds/diaconisa.png",
    preName: "Certificamos que",
    bodyText:
      "foi consagrada ao ministério como Diaconisa, no dia [Data], durante o culto solene de consagração, para servir a IEAB conforme Art. 134 da Constituição.\n\nEsta consagração é o reconhecimento público do chamado divino e do compromisso pessoal desta obreira em servir fielmente ao Senhor e à sua igreja.",
    verse: "",
  },
  {
    id: "PRESBITERO",
    title: "Certificado de Presbítero",
    shortDescription: "Consagração ministerial de presbítero.",
    backgroundPath: "/certificates/backgrounds/presbitero.png",
    preName: "Certificamos que",
    bodyText:
      "foi consagrado ao ministério como Presbítero, no dia [Data], durante o culto solene de consagração, para servir a IEAB conforme Art. 142 § 2º da Constituição.\n\nEsta consagração é o reconhecimento público do chamado divino e do compromisso pessoal deste obreiro em servir fielmente ao Senhor e à sua igreja.",
    verse: "",
  },
  {
    id: "MISSIONARIA",
    title: "Certificado de Missionária",
    shortDescription: "Consagração ministerial de missionária.",
    backgroundPath: "/certificates/backgrounds/missionaria.png",
    preName: "Certificamos que",
    bodyText:
      "foi consagrada ao ministério como Missionária, no dia [Data], durante o culto solene de consagração, para servir a IEAB conforme Art. 197 da Constituição.\n\nEsta consagração é o reconhecimento público do chamado divino e do compromisso pessoal desta obreira em servir fielmente ao Senhor e à sua igreja.",
    verse: "",
  },
] as const;

export type CertificateTemplate = (typeof CERTIFICATE_TEMPLATES)[number];
export type CertificateTemplateId = CertificateTemplate["id"];

export const CERTIFICATE_TEMPLATE_IDS = CERTIFICATE_TEMPLATES.map(
  (template) => template.id
) as [CertificateTemplateId, ...CertificateTemplateId[]];

export function getCertificateTemplate(type: string) {
  return CERTIFICATE_TEMPLATES.find((template) => template.id === type) ?? null;
}

export function getCertificateTitle(type: string, fallback?: string | null) {
  return getCertificateTemplate(type)?.title ?? fallback ?? "Certificado";
}
