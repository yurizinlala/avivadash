"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Download, TrendingUp, Clock, AlertTriangle, CheckCircle2, Loader2,
  Award, CalendarCheck, Search, ShieldCheck, Trash2, UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createCertificate, deleteCertificate } from "@/lib/actions/certificate-actions";
import { createReport } from "@/lib/actions/report-actions";
import {
  CERTIFICATE_TYPES,
  certificateSchema,
  type CertificateFormData,
} from "@/lib/validations/certificate";
import { reportSchema, type ReportFormData } from "@/lib/validations/report";
import { generateCertificatePDF, type CertificatePDFData } from "@/lib/pdf/certificate-pdf";
import { generateReportPDF } from "@/lib/pdf/report-pdf";
import { FieldError, MetricCard, PageHeader, SectionHeader } from "@/components/design-system";

interface ReportRow {
  id: string;
  referenceMonth: Date;
  totalMembers: number;
  totalVisitors: number;
  totalBaptisms: number;
  totalConversions: number;
  totalTransfers: number;
  totalTithes: number;
  totalOfferings: number;
  totalOtherIncome: number;
  totalExpenses: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CertificateRow extends CertificatePDFData {
  createdAt: string;
  updatedAt: string;
  person: {
    id: string;
    fullName: string;
    photoUrl: string | null;
    personType: string;
  } | null;
}

interface CertificatePerson {
  id: string;
  fullName: string;
  phone: string | null;
  cpf: string | null;
  birthDate: Date | null;
  personType: string;
  photoUrl: string | null;
}

const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

type ReportFormState = Record<keyof ReportFormData, string>;
type CertificateFormState = Record<keyof CertificateFormData, string>;

const EMPTY_REPORT_FORM: ReportFormState = {
  referenceMonth: "",
  totalMembers: "0",
  totalVisitors: "0",
  totalBaptisms: "0",
  totalConversions: "0",
  totalTransfers: "0",
  totalTithes: "0",
  totalOfferings: "0",
  totalOtherIncome: "0",
  totalExpenses: "0",
  notes: "",
};

const CERTIFICATE_LABELS: Record<(typeof CERTIFICATE_TYPES)[number], string> = {
  BATISMO: "Batismo",
  MEMBRESIA: "Membresia",
  APRESENTACAO: "Apresentação",
  CURSO: "Conclusão de Curso",
  HONRA: "Honra",
  PARTICIPACAO: "Participação",
};

const CERTIFICATE_TITLES: Record<(typeof CERTIFICATE_TYPES)[number], string> = {
  BATISMO: "Certificado de Batismo",
  MEMBRESIA: "Certificado de Membresia",
  APRESENTACAO: "Certificado de Apresentação",
  CURSO: "Certificado de Conclusão",
  HONRA: "Certificado de Honra",
  PARTICIPACAO: "Certificado de Participação",
};

const CERTIFICATE_DESCRIPTIONS: Record<(typeof CERTIFICATE_TYPES)[number], string> = {
  BATISMO: "Design oficial para recém batizados.",
  MEMBRESIA: "Para novos membros integrados.",
  APRESENTACAO: "Registro de apresentação de crianças.",
  CURSO: "Conclusão de cursos e treinamentos.",
  HONRA: "Reconhecimento ministerial.",
  PARTICIPACAO: "Participação em eventos da igreja.",
};

const todayKey = () => new Date().toISOString().split("T")[0];

const EMPTY_CERTIFICATE_FORM: CertificateFormState = {
  type: "BATISMO",
  title: CERTIFICATE_TITLES.BATISMO,
  recipientName: "",
  personId: "manual",
  description: "",
  issueDate: todayKey(),
  eventDate: "",
  issuerName: "",
};

interface RelatoriosClientProps {
  initialReports: ReportRow[];
  initialCertificates: CertificateRow[];
  people: CertificatePerson[];
}

export function RelatoriosClient({
  initialReports,
  initialCertificates,
  people,
}: RelatoriosClientProps) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [formData, setFormData] = React.useState<ReportFormState>(EMPTY_REPORT_FORM);
  const [formErrors, setFormErrors] = React.useState<Record<string, string[]>>({});
  const [issuingCertificate, setIssuingCertificate] = React.useState(false);
  const [deletingCertificateId, setDeletingCertificateId] = React.useState<string | null>(null);
  const [certificateFormData, setCertificateFormData] = React.useState<CertificateFormState>({
    ...EMPTY_CERTIFICATE_FORM,
    issueDate: todayKey(),
  });
  const [certificateErrors, setCertificateErrors] = React.useState<Record<string, string[]>>({});
  const [certificateSearch, setCertificateSearch] = React.useState("");
  const [certificateTypeFilter, setCertificateTypeFilter] = React.useState("todos");

  // Calculate financial summary from most recent report
  const latest = initialReports[0];
  const currentBalance = latest
    ? (latest.totalTithes + latest.totalOfferings + latest.totalOtherIncome - latest.totalExpenses)
    : 0;

  // Build chart-like data from available reports (last 7)
  const chartReports = [...initialReports].reverse().slice(-7);
  const normalizedCertificateSearch = certificateSearch.trim().toLowerCase();
  const filteredCertificates = initialCertificates.filter((certificate) => {
    const certificateType = certificate.type as (typeof CERTIFICATE_TYPES)[number];
    const typeLabel = CERTIFICATE_LABELS[certificateType] ?? certificate.title;
    const matchesType =
      certificateTypeFilter === "todos" || certificate.type === certificateTypeFilter;
    const matchesSearch =
      !normalizedCertificateSearch ||
      [certificate.recipientName, certificate.title, typeLabel]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedCertificateSearch));

    return matchesType && matchesSearch;
  });
  const currentMonthCertificateCount = initialCertificates.filter((certificate) => {
    const issueDate = new Date(certificate.issueDate);
    const now = new Date();
    return issueDate.getMonth() === now.getMonth() && issueDate.getFullYear() === now.getFullYear();
  }).length;

  const validateFormData = (data: ReportFormState) => {
    const parsed = reportSchema.safeParse(data);
    setFormErrors(parsed.success ? {} : parsed.error.flatten().fieldErrors);
    return parsed.success;
  };

  const updateField = (field: keyof ReportFormData, value: string) => {
    setFormData((current) => {
      const next = { ...current, [field]: value };
      validateFormData(next);
      return next;
    });
  };

  const validateCertificateFormData = (data: CertificateFormState) => {
    const parsed = certificateSchema.safeParse(data);
    setCertificateErrors(parsed.success ? {} : parsed.error.flatten().fieldErrors);
    return parsed.success;
  };

  const updateCertificateField = (field: keyof CertificateFormData, value: string) => {
    setCertificateFormData((current) => {
      const next = { ...current, [field]: value };
      validateCertificateFormData(next);
      return next;
    });
  };

  const handleCertificateTypeChange = (type: string) => {
    const certificateType = type as (typeof CERTIFICATE_TYPES)[number];
    setCertificateFormData((current) => {
      const next = {
        ...current,
        type: certificateType,
        title: CERTIFICATE_TITLES[certificateType],
      };
      validateCertificateFormData(next);
      return next;
    });
  };

  const handleCertificatePersonChange = (personId: string) => {
    const selectedPerson = people.find((person) => person.id === personId);
    setCertificateFormData((current) => {
      const next = {
        ...current,
        personId,
        recipientName: selectedPerson ? selectedPerson.fullName : current.recipientName,
      };
      if (personId === "manual") {
        next.recipientName = "";
      }
      validateCertificateFormData(next);
      return next;
    });
  };

  const handleCertificateTemplateSelect = (type: (typeof CERTIFICATE_TYPES)[number]) => {
    setCertificateFormData((current) => {
      const next = {
        ...current,
        type,
        title: CERTIFICATE_TITLES[type],
        description: current.description || CERTIFICATE_DESCRIPTIONS[type],
      };
      validateCertificateFormData(next);
      return next;
    });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const data: ReportFormData = {
      referenceMonth: formData.referenceMonth,
      totalMembers: Number(formData.totalMembers || 0),
      totalVisitors: Number(formData.totalVisitors || 0),
      totalBaptisms: Number(formData.totalBaptisms || 0),
      totalConversions: Number(formData.totalConversions || 0),
      totalTransfers: Number(formData.totalTransfers || 0),
      totalTithes: Number(formData.totalTithes || 0),
      totalOfferings: Number(formData.totalOfferings || 0),
      totalOtherIncome: Number(formData.totalOtherIncome || 0),
      totalExpenses: Number(formData.totalExpenses || 0),
      notes: formData.notes,
    };

    if (!validateFormData(formData)) {
      setSaving(false);
      toast.error("Corrija os erros do formulário antes de salvar.");
      return;
    }

    try {
      const result = await createReport(data);
      if (result.success) {
        toast.success("Relatório salvo com sucesso!");
        setFormData({ ...EMPTY_REPORT_FORM });
        setFormErrors({});
        router.refresh();
      } else {
        toast.error(
          typeof result.error === "string" ? result.error : "Erro de validação."
        );
      }
    } catch {
      toast.error("Erro inesperado ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCertificateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIssuingCertificate(true);

    const data: CertificateFormData = {
      type: certificateFormData.type as CertificateFormData["type"],
      title: certificateFormData.title,
      recipientName: certificateFormData.recipientName,
      personId: certificateFormData.personId,
      description: certificateFormData.description,
      issueDate: certificateFormData.issueDate,
      eventDate: certificateFormData.eventDate,
      issuerName: certificateFormData.issuerName,
    };

    const parsed = certificateSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setCertificateErrors(fieldErrors);
      toast.error(Object.values(fieldErrors).flat()[0] || "Corrija os dados do certificado.");
      setIssuingCertificate(false);
      return;
    }

    try {
      const result = await createCertificate(data);
      if (result.success && result.certificate) {
        toast.success("Certificado emitido com sucesso!");
        generateCertificatePDF(result.certificate);
        setCertificateFormData({ ...EMPTY_CERTIFICATE_FORM, issueDate: todayKey() });
        setCertificateErrors({});
        router.refresh();
      } else if (typeof result.error === "object") {
        setCertificateErrors(result.error as Record<string, string[]>);
        toast.error("Revise os campos do certificado.");
      } else {
        toast.error(result.error || "Erro ao emitir certificado.");
      }
    } catch {
      toast.error("Erro inesperado ao emitir certificado.");
    } finally {
      setIssuingCertificate(false);
    }
  }

  async function handleDeleteCertificate(id: string) {
    setDeletingCertificateId(id);
    try {
      const result = await deleteCertificate(id);
      if (result.success) {
        toast.success("Certificado removido do histórico.");
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao excluir certificado.");
      }
    } catch {
      toast.error("Erro inesperado ao excluir certificado.");
    } finally {
      setDeletingCertificateId(null);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Relatórios e Financeiro"
        title="Gestão Regional"
        description="Consolidação de dados mensais, atas e exportação financeira."
      />

      {/* Top Row — Balance card + Impact Report CTA */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-5">
        {/* Balance Card */}
        <MetricCard
          label={`Saldo mensal ${latest ? `(${new Date(latest.referenceMonth).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })})` : ""}`}
          value={
            <span className="inline-flex items-baseline gap-2">
              <span className="text-sm text-primary">R$</span>
              {currentBalance.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          }
          icon={TrendingUp}
          tone="success"
          helper={
            latest ? (
              <span className="font-medium text-success">
                {latest.totalConversions} conversões neste mês
              </span>
            ) : (
              "Nenhum relatório registrado"
            )
          }
        />

        {/* Relatório de Impacto */}
        <div className="app-card gradient-primary flex items-center justify-between gap-4 p-6 text-white">
          <div>
            <h3 className="text-base font-heading font-bold text-white">
              Relatório de Impacto Consolidado
            </h3>
            <p className="text-xs text-white/70 mt-1 max-w-[280px] leading-relaxed">
              {initialReports.length} relatório(s) registrado(s). Dados processados e prontos para exportação ministerial.
            </p>
          </div>
          <Button
            variant="outline" className="shrink-0 gap-2 border-white bg-white text-primary shadow-sm hover:bg-white/90 hover:text-primary"
            onClick={() => {
              if (latest) {
                generateReportPDF(latest);
                toast.success("PDF gerado com sucesso!");
              } else {
                toast.error("Nenhum relatório disponível para exportar.");
              }
            }}
          >
            <Download className="h-4 w-4" />
            Gerar Relatório PDF
          </Button>
        </div>
      </div>

      {/* Certificate issuing and management */}
      <div className="app-card p-6">
        <SectionHeader
          icon={Award}
          title="Certificados"
          description="Emissão, impressão e gestão de certificados oficiais da igreja."
          className="mb-5"
        />

        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={certificateSearch}
              onChange={(e) => setCertificateSearch(e.target.value)}
              placeholder="Buscar por pessoa, tipo ou título..."
              className="h-11 rounded-xl bg-surface-high border-0 pl-10 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
          <Select
            value={certificateTypeFilter}
            onValueChange={(value) => setCertificateTypeFilter(value ?? "todos")}
          >
            <SelectTrigger className="h-11 w-full rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {CERTIFICATE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {CERTIFICATE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-heading font-bold text-foreground">
              Templates rápidos
            </h3>
            <span className="text-xs text-muted-foreground">
              Use um modelo para preencher a emissão.
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {CERTIFICATE_TYPES.slice(0, 4).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleCertificateTemplateSelect(type)}
                className={cn(
                  "group rounded-xl bg-surface-high p-3 text-left transition-colors hover:bg-primary/10",
                  certificateFormData.type === type && "bg-primary/10 ring-2 ring-primary/15"
                )}
              >
                <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-background">
                  <Award className="h-8 w-8 text-primary/30 transition-colors group-hover:text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {CERTIFICATE_TITLES[type]}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {CERTIFICATE_DESCRIPTIONS[type]}
                </p>
                <Badge className="mt-3 rounded-md border-0 bg-background text-[10px] font-medium text-muted-foreground">
                  Orientação paisagem
                </Badge>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
          <form
            onSubmit={handleCertificateSubmit}
            onReset={() => {
              setCertificateFormData({ ...EMPTY_CERTIFICATE_FORM, issueDate: todayKey() });
              setCertificateErrors({});
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={cn("text-xs text-muted-foreground", certificateErrors.type && "text-destructive")}>
                  Tipo de Certificado *
                </Label>
                <Select
                  value={certificateFormData.type}
                  onValueChange={(value) => {
                    if (value) handleCertificateTypeChange(value);
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      "mt-1.5 h-10 w-full rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20",
                      certificateErrors.type && "border border-destructive"
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CERTIFICATE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {CERTIFICATE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError error={certificateErrors.type} />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  Pessoa cadastrada
                </Label>
                <Select
                  value={certificateFormData.personId || "manual"}
                  onValueChange={(value) => {
                    if (value) handleCertificatePersonChange(value);
                  }}
                >
                  <SelectTrigger className="mt-1.5 h-10 w-full rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="manual">Preencher manualmente</SelectItem>
                    {people.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={cn("text-xs text-muted-foreground", certificateErrors.recipientName && "text-destructive")}>
                  Nome no certificado *
                </Label>
                <Input
                  value={certificateFormData.recipientName}
                  onChange={(e) => updateCertificateField("recipientName", e.target.value)}
                  placeholder="Ex: Maria Souza"
                  className={cn(
                    "mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20",
                    certificateErrors.recipientName && "border border-destructive"
                  )}
                />
                <FieldError error={certificateErrors.recipientName} />
              </div>

              <div>
                <Label className={cn("text-xs text-muted-foreground", certificateErrors.title && "text-destructive")}>
                  Título *
                </Label>
                <Input
                  value={certificateFormData.title}
                  onChange={(e) => updateCertificateField("title", e.target.value)}
                  placeholder="Ex: Certificado de Batismo"
                  className={cn(
                    "mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20",
                    certificateErrors.title && "border border-destructive"
                  )}
                />
                <FieldError error={certificateErrors.title} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className={cn("text-xs text-muted-foreground", certificateErrors.issueDate && "text-destructive")}>
                  Data de Emissão *
                </Label>
                <Input
                  type="date"
                  value={certificateFormData.issueDate}
                  onChange={(e) => updateCertificateField("issueDate", e.target.value)}
                  className={cn(
                    "mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20",
                    certificateErrors.issueDate && "border border-destructive"
                  )}
                />
                <FieldError error={certificateErrors.issueDate} />
              </div>

              <div>
                <Label className={cn("text-xs text-muted-foreground", certificateErrors.eventDate && "text-destructive")}>
                  Data do Evento
                </Label>
                <Input
                  type="date"
                  value={certificateFormData.eventDate}
                  onChange={(e) => updateCertificateField("eventDate", e.target.value)}
                  className={cn(
                    "mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20",
                    certificateErrors.eventDate && "border border-destructive"
                  )}
                />
                <FieldError error={certificateErrors.eventDate} />
              </div>

              <div>
                <Label className={cn("text-xs text-muted-foreground", certificateErrors.issuerName && "text-destructive")}>
                  Responsável
                </Label>
                <Input
                  value={certificateFormData.issuerName}
                  onChange={(e) => updateCertificateField("issuerName", e.target.value)}
                  placeholder="Ex: Pastor Regional"
                  className={cn(
                    "mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20",
                    certificateErrors.issuerName && "border border-destructive"
                  )}
                />
                <FieldError error={certificateErrors.issuerName} />
              </div>
            </div>

            <div>
              <Label className={cn("text-xs text-muted-foreground", certificateErrors.description && "text-destructive")}>
                Descrição
              </Label>
              <textarea
                rows={3}
                value={certificateFormData.description}
                onChange={(e) => updateCertificateField("description", e.target.value)}
                placeholder="Texto opcional que aparecerá no certificado."
                className={cn(
                  "mt-1.5 w-full rounded-xl bg-surface-high border-0 p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 resize-none",
                  certificateErrors.description && "border border-destructive"
                )}
              />
              <div className="mt-1 flex items-center justify-between gap-3">
                <FieldError error={certificateErrors.description} />
                <span className="ml-auto text-xs text-muted-foreground">
                  {certificateFormData.description.length}/280
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                type="reset"
                variant="outline"
                className="h-10 flex-1 rounded-xl border-border"
              >
                Limpar Campos
              </Button>
              <Button
                type="submit"
                variant="brand"
                disabled={issuingCertificate}
                className="h-10 flex-1"
              >
                {issuingCertificate ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Emitir Certificado
              </Button>
            </div>
          </form>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface-high p-4">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                    Emitidos
                  </span>
                </div>
                <p className="mt-2 text-2xl font-heading font-bold text-foreground">
                  {initialCertificates.length}
                </p>
              </div>
              <div className="rounded-xl bg-surface-high p-4">
                <div className="flex items-center gap-2 text-success">
                  <CalendarCheck className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                    Este mês
                  </span>
                </div>
                <p className="mt-2 text-2xl font-heading font-bold text-foreground">
                  {currentMonthCertificateCount}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-surface-high p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Emissões recentes
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground">
                  {filteredCertificates.length}
                </span>
              </div>

              <div className="space-y-3">
                {filteredCertificates.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Nenhum certificado encontrado.
                  </p>
                ) : (
                  filteredCertificates.slice(0, 5).map((certificate) => (
                    <div key={certificate.id} className="item-row flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Award className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {certificate.recipientName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {CERTIFICATE_LABELS[certificate.type as (typeof CERTIFICATE_TYPES)[number]] ?? certificate.title}
                          {" • "}
                          {new Date(certificate.issueDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Baixar certificado"
                          onClick={() => generateCertificatePDF(certificate)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="destructive"
                          aria-label="Excluir certificado"
                          disabled={deletingCertificateId === certificate.id}
                          onClick={() => handleDeleteCertificate(certificate.id)}
                        >
                          {deletingCertificateId === certificate.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        {/* Inserir Dados Mensais */}
        <div className="app-card p-6">
          <SectionHeader
            icon={FileText}
            title="Inserir dados mensais"
            description="Preencha os indicadores do mês para gerar relatórios consistentes." className="mb-5"
          />

          <form
            onSubmit={handleSubmit}
            onReset={() => {
              setFormData({ ...EMPTY_REPORT_FORM });
              setFormErrors({});
            }} className="space-y-4"
          >
            <div>
              <Label className={cn("text-xs text-muted-foreground", formErrors.referenceMonth && "text-destructive")}>
                Mês de Referência *
              </Label>
              <Input
                name="referenceMonth"
                required
                type="month"
                value={formData.referenceMonth}
                onChange={(e) => updateField("referenceMonth", e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.referenceMonth && "border border-destructive")}
              />
              <FieldError error={formErrors.referenceMonth} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Total de Presentes nos Cultos
                </Label>
                <Input
                  name="totalMembers"
                  type="number"
                  min="0"
                  value={formData.totalMembers}
                  onChange={(e) => updateField("totalMembers", e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.totalMembers && "border border-destructive")}
                />
                <FieldError error={formErrors.totalMembers} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Conversões do Mês
                </Label>
                <Input
                  name="totalConversions"
                  type="number"
                  min="0"
                  value={formData.totalConversions}
                  onChange={(e) => updateField("totalConversions", e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.totalConversions && "border border-destructive")}
                />
                <FieldError error={formErrors.totalConversions} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Total de Visitantes
                </Label>
                <Input
                  name="totalVisitors"
                  type="number"
                  min="0"
                  value={formData.totalVisitors}
                  onChange={(e) => updateField("totalVisitors", e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.totalVisitors && "border border-destructive")}
                />
                <FieldError error={formErrors.totalVisitors} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Batismos
                </Label>
                <Input
                  name="totalBaptisms"
                  type="number"
                  min="0"
                  value={formData.totalBaptisms}
                  onChange={(e) => updateField("totalBaptisms", e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.totalBaptisms && "border border-destructive")}
                />
                <FieldError error={formErrors.totalBaptisms} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Dízimos (R$)
                </Label>
                <Input
                  name="totalTithes"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalTithes}
                  onChange={(e) => updateField("totalTithes", e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.totalTithes && "border border-destructive")}
                />
                <FieldError error={formErrors.totalTithes} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Ofertas (R$)
                </Label>
                <Input
                  name="totalOfferings"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalOfferings}
                  onChange={(e) => updateField("totalOfferings", e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.totalOfferings && "border border-destructive")}
                />
                <FieldError error={formErrors.totalOfferings} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Despesas (R$)
                </Label>
                <Input
                  name="totalExpenses"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalExpenses}
                  onChange={(e) => updateField("totalExpenses", e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.totalExpenses && "border border-destructive")}
                />
                <FieldError error={formErrors.totalExpenses} />
              </div>
            </div>

            {/* Hidden fields */}
            <input type="hidden" name="totalTransfers" value={formData.totalTransfers} />
            <input type="hidden" name="totalOtherIncome" value={formData.totalOtherIncome} />

            <div>
              <Label className="text-xs text-muted-foreground">Observações</Label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Anotações gerais..."
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)} className={cn("mt-1.5 w-full rounded-xl bg-surface-high border-0 p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 resize-none", formErrors.notes && "border border-destructive")}
              />
              <FieldError error={formErrors.notes} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="reset"
                variant="outline" className="flex-1 h-10 rounded-xl border-border"
              >
                Limpar Campos
              </Button>
              <Button
                type="submit"
                variant="brand"
                disabled={saving} className="h-10 flex-1"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar Registro
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column — Report History + Sync Status */}
        <div className="space-y-5">
          {/* Histórico de Relatórios */}
          <div className="app-card p-5">
            <SectionHeader
              icon={Clock}
              title="Histórico de relatórios" className="mb-4"
            />
            <div className="space-y-3">
              {initialReports.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum relatório registrado.
                </p>
              ) : (
                initialReports.slice(0, 5).map((report) => {
                  const totalIncome = report.totalTithes + report.totalOfferings + report.totalOtherIncome;
                  const balance = totalIncome - report.totalExpenses;
                  return (
                    <div
                      key={report.id} className="item-row group flex cursor-pointer items-center gap-3"
                    onClick={() => {
                      generateReportPDF(report);
                      toast.success("PDF gerado!");
                    }}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          Relatório — {new Date(report.referenceMonth).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Saldo: R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          {" • "}{report.totalConversions} conversões
                        </p>
                      </div>
                      <div className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full shrink-0",
                          balance >= 0 ? "bg-success/10" : "bg-destructive/10"
                        )}
                      >
                        <CheckCircle2 className={cn(
                            "h-3.5 w-3.5",
                            balance >= 0 ? "text-success" : "text-destructive"
                          )}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sync Status */}
          <div className="app-card border-gold/20 bg-gold/10 p-5">
            <Badge className="mb-3 rounded-md border-0 bg-gold/90 text-xs font-semibold uppercase text-primary">
              Sincronizado com Sede Nacional
            </Badge>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-gold-muted shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Lembrete Fiscal
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Todas as atas devem ser impressas e assinadas fisicamente pelo
                  Pastor Regional e Secretário antes do envio digital definitivo
                  à sede nacional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Engagement History Chart */}
      <div className="app-card p-6">
        <SectionHeader
          icon={TrendingUp}
          title="Histórico de engajamento" className="mb-4"
        />
        <div className="flex items-end gap-3 h-44">
          {chartReports.length === 0 ? (
            <p className="text-sm text-muted-foreground m-auto">
              Adicione relatórios para visualizar o gráfico.
            </p>
          ) : (
            chartReports.map((report) => {
              const maxMembers = Math.max(
                ...chartReports.map((r) => r.totalMembers),
                1
              );
              const pct = (report.totalMembers / maxMembers) * 100;
              const refDate = new Date(report.referenceMonth);
                const monthLabel = MONTHS_PT[refDate.getMonth()] ?? refDate.toLocaleDateString("pt-BR", { month: "short" });

              return (
                <div
                  key={report.id} className="flex-1 flex flex-col items-center gap-1.5"
                >
                  <div className="w-full rounded-t-lg bg-primary transition-all"
                    style={{ height: `${Math.max(pct, 5)}%` }}
                  />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {monthLabel}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
