"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays, Plus, ChevronLeft, ChevronRight, Clock, MapPin, Users,
  CalendarCheck, Star, Navigation, Loader2, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { createEvent, updateEvent, deleteEvent } from "@/lib/actions/event-actions";
import type { EventFormData } from "@/lib/validations/event";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

const MONTHS_PT = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
const WEEKDAYS_PT = ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"];

const TYPE_DOT: Record<string, string> = {
  culto: "bg-primary",
  reuniao: "bg-gold",
  congresso: "bg-red-500",
};
const TYPE_BG: Record<string, string> = {
  culto: "bg-primary/15 text-primary",
  reuniao: "bg-gold/15 text-gold-muted dark:text-gold",
  congresso: "bg-red-500/10 text-red-600",
};

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  time: string | null;
  location: string | null;
  type: string | null;
  isRecurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function formatDateToKey(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateForInput(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

interface AgendaClientProps {
  initialEvents: EventRow[];
  stats: {
    totalEvents: number;
    eventsThisMonth: number;
    upcomingEvents: number;
  };
}

export function AgendaClient({ initialEvents, stats }: AgendaClientProps) {
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth());
  const [selDate, setSelDate] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<"Mês" | "Semana" | "Dia">("Mês");
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<EventRow | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const prev = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1);
  };
  const fmtKey = (d: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const evtsFor = (d: number) =>
    initialEvents.filter((e) => formatDateToKey(e.date) === fmtKey(d));
  const isTdy = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const todayStr = formatDateToKey(today);
  const upcoming = initialEvents
    .filter((e) => formatDateToKey(e.date) >= todayStr)
    .sort((a, b) => formatDateToKey(a.date).localeCompare(formatDateToKey(b.date)))
    .slice(0, 4);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData(e.currentTarget);
    const data: EventFormData = {
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      date: fd.get("date") as string,
      time: fd.get("time") as string,
      location: fd.get("location") as string,
      type: (fd.get("type") as EventFormData["type"]) || "culto",
      isRecurrent: fd.get("isRecurrent") === "on",
    };

    try {
      const result = selectedEvent
        ? await updateEvent(selectedEvent.id, data)
        : await createEvent(data);

      if (result.success) {
        toast.success(
          selectedEvent ? "Evento atualizado!" : "Evento criado com sucesso!"
        );
        setSheetOpen(false);
        setSelectedEvent(null);
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

  function requestDelete(id: string) {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try {
      const result = await deleteEvent(pendingDeleteId);
      if (result.success) {
        toast.success("Evento excluído!");
        setSheetOpen(false);
        setSelectedEvent(null);
        setDeleteDialogOpen(false);
        setPendingDeleteId(null);
        router.refresh();
      } else {
        toast.error("Erro ao excluir.");
      }
    } catch {
      toast.error("Erro inesperado ao excluir.");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Agenda Central
          </p>
          <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground mb-0.5">
            Cronograma Eclesiástico
          </p>
          <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">
            Gestão de Ministérios
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-surface-high rounded-xl p-1">
            {(["Mês", "Semana", "Dia"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                  viewMode === m
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <Button
            onClick={() => {
              setSelectedEvent(null);
              setSheetOpen(true);
            }}
            className="gradient-primary text-white rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Evento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Calendar Card */}
        <div className="rounded-xl bg-card p-6 shadow-ambient">
          {/* Month Nav + Legend */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-heading font-bold text-foreground">
                {MONTHS_PT[month]} {year}
              </h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={prev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={next}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Culto
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gold" />
                Reunião
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Congresso
              </span>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS_PT.map((d) => (
              <div
                key={d}
                className="text-center text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground py-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} className="h-24 rounded-lg" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dk = fmtKey(day);
              const de = evtsFor(day);
              const it = isTdy(day);
              const is = selDate === dk;
              return (
                <button
                  key={day}
                  onClick={() => setSelDate(is ? null : dk)}
                  className={cn(
                    "h-24 rounded-lg p-1.5 text-left transition-all duration-150 flex flex-col",
                    it ? "bg-primary/8 ring-2 ring-primary" : "hover:bg-surface-low",
                    is && !it && "bg-primary/10 ring-2 ring-primary/50"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      it ? "bg-primary text-primary-foreground" : "text-foreground"
                    )}
                  >
                    {day}
                  </span>
                  <div className="mt-auto space-y-0.5 overflow-hidden">
                    {de.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-[0.5rem] font-semibold leading-tight cursor-pointer",
                          TYPE_BG[ev.type ?? "culto"] ?? "bg-primary/15 text-primary"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                          setSheetOpen(true);
                        }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {de.length > 2 && (
                      <span className="text-[0.5rem] text-muted-foreground px-1">
                        +{de.length - 2}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Próximos Eventos */}
          <div className="rounded-xl bg-card p-5 shadow-ambient">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-heading font-bold text-foreground">
                Próximos Eventos
              </h3>
              <span className="text-[0.65rem] font-semibold text-primary uppercase tracking-widest">
                {upcoming.length}
              </span>
            </div>
            <div className="space-y-5">
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum evento próximo
                </p>
              ) : (
                upcoming.map((ev) => {
                  const evDate = new Date(ev.date);
                  return (
                    <div
                      key={ev.id}
                      className="space-y-1.5 cursor-pointer"
                      onClick={() => {
                        setSelectedEvent(ev);
                        setSheetOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full shrink-0",
                            TYPE_DOT[ev.type ?? "culto"] ?? "bg-primary"
                          )}
                        />
                        <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground font-medium">
                          {evDate
                            .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                            .toUpperCase()}
                          {ev.time ? `, ${ev.time}` : ""}
                        </span>
                      </div>
                      <h4 className="text-sm font-heading font-semibold text-foreground leading-tight">
                        {ev.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {ev.description || "Atividade programada para todos os membros e obreiros."}
                      </p>
                      {ev.location && ev.type === "congresso" && (
                        <Badge
                          variant="secondary"
                          className="rounded-md text-[0.55rem] font-semibold border-0 bg-primary/10 text-primary mt-1 gap-1"
                        >
                          <MapPin className="h-2.5 w-2.5" />
                          {ev.location.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Location Card */}
          <div className="rounded-xl overflow-hidden relative">
            <div className="h-36 bg-gradient-to-br from-primary to-primary/70 relative">
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-[0.6rem] uppercase tracking-widest text-white/60 mb-1">
                  Localização Sede
                </p>
                <p className="text-sm font-heading font-semibold text-white flex items-center gap-1.5">
                  <Navigation className="h-3.5 w-3.5" />
                  Av. Principal, 1000 — Centro
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl gradient-primary p-5 text-white">
          <CalendarCheck className="h-5 w-5 text-white/60 mb-2" />
          <p className="text-2xl font-heading font-bold">{stats.eventsThisMonth}</p>
          <p className="text-[0.6rem] uppercase tracking-widest text-white/70">
            Eventos este mês
          </p>
        </div>
        <div className="rounded-xl bg-gold/10 p-5">
          <Users className="h-5 w-5 text-gold-muted mb-2" />
          <p className="text-2xl font-heading font-bold text-foreground">
            {stats.totalEvents}
          </p>
          <p className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">
            Total de Eventos
          </p>
        </div>
        <div className="rounded-xl bg-surface-high p-5">
          <Star className="h-5 w-5 text-muted-foreground mb-2" />
          <p className="text-2xl font-heading font-bold text-foreground">
            {stats.upcomingEvents}
          </p>
          <p className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">
            Eventos Futuros
          </p>
        </div>
      </div>

      {/* Sheet for Create/Edit Event */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md p-0 border-0 bg-card">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg font-heading font-bold">
                  {selectedEvent ? selectedEvent.title : "Novo Evento"}
                </SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedEvent ? "Editar evento" : "Criar novo evento"}
                </p>
              </div>
              {selectedEvent && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => requestDelete(selectedEvent.id)}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-8rem)]">
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
              <div>
                <Label className="text-xs text-muted-foreground">Título *</Label>
                <Input
                  name="title"
                  required
                  placeholder="Ex: Culto de Celebração"
                  defaultValue={selectedEvent?.title}
                  className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Detalhes do evento..."
                  defaultValue={selectedEvent?.description ?? ""}
                  className="mt-1.5 w-full rounded-xl bg-surface-high border-0 p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Data *</Label>
                  <Input
                    name="date"
                    type="date"
                    required
                    defaultValue={formatDateForInput(selectedEvent?.date ?? null)}
                    className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Horário</Label>
                  <Input
                    name="time"
                    placeholder="Ex: 19:30"
                    defaultValue={selectedEvent?.time ?? ""}
                    className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Local</Label>
                <Input
                  name="location"
                  placeholder="Ex: Templo Central"
                  defaultValue={selectedEvent?.location ?? ""}
                  className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <Select
                  name="type"
                  defaultValue={selectedEvent?.type ?? "culto"}
                >
                  <SelectTrigger className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="culto">Culto</SelectItem>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                    <SelectItem value="congresso">Congresso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-surface-high p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Evento Recorrente?</p>
                  <p className="text-xs text-muted-foreground">
                    Repete semanalmente no mesmo horário
                  </p>
                </div>
                <Switch
                  name="isRecurrent"
                  defaultChecked={selectedEvent?.isRecurrent ?? false}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 pb-8">
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11 rounded-xl border-border"
                    onClick={() => setSheetOpen(false)}
                  >
                    Cancelar
                  </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-11 rounded-xl gradient-primary text-white"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {selectedEvent ? "Salvar Alterações" : "Criar Evento"}
                </Button>
              </div>
            </form>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        loading={deleting}
        title="Excluir Evento"
        description="Esta ação é irreversível. O evento será permanentemente removido do calendário."
      />
    </div>
  );
}
