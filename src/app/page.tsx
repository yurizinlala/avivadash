export const dynamic = "force-dynamic";
import {
  Users,
  Network,
  UserPlus,
  TrendingUp,
  MessageSquare,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";
import { getDashboardStats } from "@/lib/actions/dashboard-actions";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const user = await getCurrentUser();
  const firstName = user?.name?.split(' ')[0] || "Líder";

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
          Visão Geral
        </p>
        <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">
          Olá, {firstName}! 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aqui está o que está acontecendo no seu ministério hoje.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total de Membros */}
        <div className="rounded-xl bg-card p-5 shadow-ambient">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Total de Membros
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-heading font-bold text-foreground">
            {stats.totalMembers.toLocaleString("pt-BR")}
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {stats.newMembersThisMonth >= 0 ? "+" : ""}
              {stats.newMembersThisMonth} este mês
            </span>
          </div>
        </div>

        {/* Células Ativas */}
        <div className="rounded-xl bg-card p-5 shadow-ambient">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Células Ativas
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
              <Network className="h-4 w-4 text-gold" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-heading font-bold text-foreground">
            {stats.activeCells}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Em todas as regiões
          </p>
        </div>

        {/* Novos Visitantes */}
        <div className="rounded-xl bg-card p-5 shadow-ambient">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Novos Visitantes
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-heading font-bold text-foreground">
            {stats.recentVisitors}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Últimos 7 dias
          </p>
        </div>
      </div>

      {/* Middle Row — Aniversariantes & Próximos Eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aniversariantes do Dia */}
        <div className="rounded-xl bg-card p-6 shadow-ambient">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-heading font-semibold text-foreground">
              Aniversariantes do Dia
            </h2>
            <span className="rounded-full bg-gold/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-gold-muted dark:text-gold">
              Celebração
            </span>
          </div>
          <div className="space-y-3">
            {stats.birthdaysToday.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum aniversariante hoje 🎂
              </p>
            ) : (
              stats.birthdaysToday.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between rounded-lg bg-surface-low p-3 transition-colors hover:bg-surface-high"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {person.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {person.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {person.age ? `${person.age} anos` : ""} • {person.type}
                      </p>
                    </div>
                  </div>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                    aria-label={`Enviar mensagem para ${person.name} pelo WhatsApp`}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Próximos Eventos */}
        <div className="rounded-xl bg-card p-6 shadow-ambient">
          <h2 className="text-base font-heading font-semibold text-foreground mb-5">
            Próximos Eventos
          </h2>
          <div className="space-y-3">
            {stats.upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
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
                  <a
                    href={`/agenda?eventId=${event.id}`}
                    key={event.id}
                    className="flex items-center gap-4 rounded-lg bg-surface-low p-3 transition-colors hover:bg-surface-high cursor-pointer block"
                  >
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg border border-border bg-card text-center">
                      <span className="text-sm font-heading font-bold text-primary leading-none">
                        {day}
                      </span>
                      <span className="text-[0.55rem] uppercase tracking-wider text-muted-foreground font-medium">
                        {month}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Calendar className="h-3 w-3 mr-0.5" />
                        {event.time} • {event.location}
                      </div>
                    </div>
                  </a>
                );
              })
            )}
          </div>
          <a
            href="/agenda"
            className="mt-4 w-full text-center text-xs font-semibold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors block"
          >
            Ver Agenda Completa
          </a>
        </div>
      </div>

      {/* Bottom Row — Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Relatórios Mensais */}
        <div className="relative overflow-hidden rounded-xl gradient-primary p-6 text-white">
          <div className="relative z-10">
            <h3 className="text-lg font-heading font-bold">
              Relatórios Mensais
            </h3>
            <p className="mt-1 text-sm text-white/80 max-w-xs">
              Acompanhe o crescimento e a saúde espiritual das células
              este mês.
            </p>
            <a
              href="/relatorios"
              className="mt-4 inline-block rounded-lg bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium hover:bg-white/30 transition-colors"
            >
              Gerar PDF
            </a>
          </div>
          {/* Decorative icon */}
          <FileText className="absolute right-4 bottom-4 h-20 w-20 text-white/10" />
        </div>

        {/* Visitantes Pendentes */}
        <div className="relative overflow-hidden rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-6">
          <div className="relative z-10">
            <h3 className="text-lg font-heading font-bold text-amber-900 dark:text-amber-400">
              Visitantes Pendentes
            </h3>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-200/70 max-w-xs">
              {stats.recentVisitors} visitantes recentes aguardam acompanhamento pastoral.
            </p>
            <a
              href="/pessoas?tab=visitantes"
              className="mt-4 inline-block rounded-lg bg-amber-200/50 dark:bg-amber-900/50 backdrop-blur-sm px-4 py-2 text-sm font-medium text-amber-900 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/80 transition-colors"
            >
              Ver Todos
            </a>
          </div>
          <AlertCircle className="absolute right-4 bottom-4 h-20 w-20 text-amber-900/5 dark:text-amber-500/10" />
        </div>
      </div>
    </div>
  );
}
