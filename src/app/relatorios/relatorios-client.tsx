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
import type { ReportFormData } from "@/lib/validations/report";
import { generateReportPDF } from "@/lib/pdf/report-pdf";

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

interface RelatoriosClientProps {
  initialReports: ReportRow[];
}

export function RelatoriosClient({ initialReports }: RelatoriosClientProps) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);

  // Calculate financial summary from most recent report
  const latest = initialReports[0];
  const currentBalance = latest
    ? (latest.totalTithes + latest.totalOfferings + latest.totalOtherIncome - latest.totalExpenses)
    : 0;

  // Build chart-like data from available reports (last 7)
  const chartReports = [...initialReports].reverse().slice(-7);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData(e.currentTarget);
    const data: ReportFormData = {
      referenceMonth: fd.get("referenceMonth") as string,
      totalMembers: Number(fd.get("totalMembers") || 0),
      totalVisitors: Number(fd.get("totalVisitors") || 0),
      totalBaptisms: Number(fd.get("totalBaptisms") || 0),
      totalConversions: Number(fd.get("totalConversions") || 0),
      totalTransfers: Number(fd.get("totalTransfers") || 0),
      totalTithes: Number(fd.get("totalTithes") || 0),
      totalOfferings: Number(fd.get("totalOfferings") || 0),
      totalOtherIncome: Number(fd.get("totalOtherIncome") || 0),
      totalExpenses: Number(fd.get("totalExpenses") || 0),
      notes: fd.get("notes") as string,
    };

    try {
      const result = await createReport(data);
      if (result.success) {
        toast.success("Relatório salvo com sucesso!");
        e.currentTarget.reset();
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Relatórios e Financeiro
          </p>
          <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">
            Gestão Regional
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Consolidação de dados mensais, atas e exportação financeira.
          </p>
        </div>
      </div>

      {/* Top Row — Balance card + Impact Report CTA */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-5">
        {/* Balance Card */}
        <div className="rounded-xl bg-card p-6 shadow-ambient">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Saldo Mensal {latest ? `(${new Date(latest.referenceMonth).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })})` : ""}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-heading font-bold text-primary">R$</span>
            <span className="text-3xl font-heading font-bold text-foreground">
              {currentBalance.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          {latest && (
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {latest.totalConversions} conversões neste mês
              </span>
            </div>
          )}
        </div>

        {/* Relatório de Impacto */}
        <div className="rounded-xl gradient-primary p-6 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-heading font-bold text-white">
              Relatório de Impacto Consolidado
            </h3>
            <p className="text-xs text-white/70 mt-1 max-w-[280px] leading-relaxed">
              {initialReports.length} relatório(s) registrado(s). Dados processados e prontos para exportação ministerial.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 rounded-xl gap-2 shrink-0"
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
        <div className="rounded-xl bg-card p-6 shadow-ambient">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 rounded-full bg-primary" />
            <h2 className="text-base font-heading font-bold text-foreground">
              Inserir Dados Mensais
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">
                Mês de Referência *
              </Label>
              <Input
                name="referenceMonth"
                required
                type="month"
                className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
              />
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
                  defaultValue="0"
                  className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Conversões do Mês
                </Label>
                <Input
                  name="totalConversions"
                  type="number"
                  min="0"
                  defaultValue="0"
                  className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
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
                  defaultValue="0"
                  className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Batismos
                </Label>
                <Input
                  name="totalBaptisms"
                  type="number"
                  min="0"
                  defaultValue="0"
                  className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
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
                  defaultValue="0"
                  className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
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
                  defaultValue="0"
                  className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
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
                  defaultValue="0"
                  className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
            </div>

            {/* Hidden fields */}
            <input type="hidden" name="totalTransfers" value="0" />
            <input type="hidden" name="totalOtherIncome" value="0" />

            <div>
              <Label className="text-xs text-muted-foreground">Observações</Label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Anotações gerais..."
                className="mt-1.5 w-full rounded-xl bg-surface-high border-0 p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="reset"
                variant="outline"
                className="flex-1 h-10 rounded-xl border-border"
              >
                Limpar Campos
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 h-10 rounded-xl gradient-primary text-white"
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
          <div className="rounded-xl bg-card p-5 shadow-ambient">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-heading font-bold text-foreground">
                Histórico de Relatórios
              </h3>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
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
                      key={report.id}
                      className="flex items-center gap-3 rounded-lg bg-surface-low p-3 group hover:bg-surface-high transition-colors cursor-pointer"
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
                        <p className="text-[0.65rem] text-muted-foreground">
                          Saldo: R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          {" • "}{report.totalConversions} conversões
                        </p>
                      </div>
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full shrink-0",
                          balance >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
                        )}
                      >
                        <CheckCircle2
                          className={cn(
                            "h-3.5 w-3.5",
                            balance >= 0 ? "text-emerald-500" : "text-red-500"
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
          <div className="rounded-xl bg-gold/10 p-5 border border-gold/20">
            <Badge className="bg-gold/90 text-primary text-[0.55rem] font-semibold uppercase rounded-md border-0 mb-3">
              Sincronizado com Sede Nacional
            </Badge>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-gold-muted shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Lembrete Fiscal
                </p>
                <p className="text-[0.65rem] text-muted-foreground leading-relaxed mt-0.5">
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
      <div className="rounded-xl bg-card p-6 shadow-ambient">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Histórico de Engajamento
        </h2>
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
                  key={report.id}
                  className="flex-1 flex flex-col items-center gap-1.5"
                >
                  <div
                    className="w-full rounded-t-lg bg-primary transition-all"
                    style={{ height: `${Math.max(pct, 5)}%` }}
                  />
                  <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-medium">
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
