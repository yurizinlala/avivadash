"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Download, TrendingUp, Clock, AlertTriangle, CheckCircle2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createReport } from "@/lib/actions/report-actions";
import { reportSchema, type ReportFormData } from "@/lib/validations/report";
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

const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

type ReportFormState = Record<keyof ReportFormData, string>;

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

interface RelatoriosClientProps {
  initialReports: ReportRow[];
}

export function RelatoriosClient({ initialReports }: RelatoriosClientProps) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [formData, setFormData] = React.useState<ReportFormState>(EMPTY_REPORT_FORM);
  const [formErrors, setFormErrors] = React.useState<Record<string, string[]>>({});

  // Calculate financial summary from most recent report
  const latest = initialReports[0];
  const currentBalance = latest
    ? (latest.totalTithes + latest.totalOfferings + latest.totalOtherIncome - latest.totalExpenses)
    : 0;

  // Build chart-like data from available reports (last 7)
  const chartReports = [...initialReports].reverse().slice(-7);

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

      {/* Middle Row — Insert Data Form (left) + Report History (right) */}
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
