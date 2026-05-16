export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  FileText,
  Network,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import {
  AppCard,
  MetricCard,
  PageHeader,
  SectionHeader,
} from "@/components/design-system";
import { getDashboardStats } from "@/lib/actions/dashboard-actions";
import { getCurrentUser } from "@/lib/auth";
import { BirthdayCard } from "./birthday-card";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const user = await getCurrentUser();
  const firstName = user?.name?.split(" ")[0] || "Líder";

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Visão geral"
        title={`Olá, ${firstName}`}
        description="Acompanhe os principais sinais da comunidade, próximos eventos e pontos de cuidado pastoral."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Total de membros"
          value={stats.totalMembers.toLocaleString("pt-BR")}
          icon={Users}
          tone="primary"
          helper={
            <span className="inline-flex items-center gap-1 font-medium text-success">
              <TrendingUp className="h-3 w-3" />
              {stats.newMembersThisMonth >= 0 ? "+" : ""}
              {stats.newMembersThisMonth} este mês
            </span>
          }
        />
        <MetricCard
          label="Células ativas"
          value={stats.activeCells}
          icon={Network}
          tone="gold"
          helper="Em todas as regiões cadastradas"
        />
        <MetricCard
          label="Novos visitantes"
          value={stats.recentVisitors}
          icon={UserPlus}
          tone="success"
          helper="Últimos 7 dias"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BirthdayCard people={stats.birthdaysToday} />

        <AppCard>
          <SectionHeader
            icon={Calendar}
            title="Próximos eventos"
            description="Agenda ministerial com as datas mais recentes" className="mb-5"
          />

          <div className="space-y-3">
            {stats.upcomingEvents.length === 0 ? (
              <p className="rounded-lg bg-surface-low p-4 text-center text-sm text-muted-foreground">
                Nenhum evento programado
              </p>
            ) : (
              stats.upcomingEvents.map((event) => {
                const eventDate = new Date(event.date);
                const day = String(eventDate.getDate()).padStart(2, "0");
                const month = eventDate
                  .toLocaleDateString("pt-BR", { month: "short" })
                  .toUpperCase()
                  .replace(".", "");

                return (
                  <Link
                    href={`/agenda?eventId=${event.id}`}
                    key={event.id} className="item-row flex items-center gap-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-card text-center">
                      <span className="font-heading text-sm font-bold leading-none text-primary">
                        {day}
                      </span>
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        {month}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {event.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {event.time || "Horário a definir"} · {event.location || "Local a definir"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <Link
            href="/agenda" className="mt-4 inline-flex w-full items-center justify-center gap-1 text-xs font-semibold uppercase tracking-widest text-primary transition-colors hover:text-primary/80"
          >
            Ver agenda completa
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </AppCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AppCard className="overflow-hidden gradient-primary text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="icon-tile mb-4 bg-white/15 text-white">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="font-heading text-base font-semibold text-white">
                Relatórios mensais
              </h3>
              <p className="mt-1 max-w-sm text-sm text-white/75">
                Consolide crescimento, presenças e dados financeiros do mês.
              </p>
            </div>
            <Link
              href="/relatorios" className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-white/15 px-4 text-sm font-medium text-white transition-colors hover:bg-white/25"
            >
              Gerar PDF
            </Link>
          </div>
        </AppCard>

        <AppCard>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="icon-tile icon-tile-warning mb-4">
                <AlertCircle className="h-4 w-4" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Visitantes pendentes
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {stats.recentVisitors} visitantes recentes aguardam acompanhamento pastoral.
              </p>
            </div>
            <Link
              href="/pessoas?tab=visitantes" className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-high"
            >
              Ver todos
            </Link>
          </div>
        </AppCard>
      </div>
    </div>
  );
}
