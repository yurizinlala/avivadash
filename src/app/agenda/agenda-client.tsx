"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus, ChevronLeft, ChevronRight, Clock, MapPin, Users,
  CalendarCheck, Star, Navigation, Loader2, Trash2, Search, Info
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
import { maskCep } from "@/lib/masks";
import { eventSchema, type EventFormData } from "@/lib/validations/event";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { FieldError, MetricCard, PageHeader } from "@/components/design-system";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const WEEKDAYS_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

const TYPE_DOT: Record<string, string> = {
  culto: "bg-primary",
  reuniao: "bg-gold",
  congresso: "bg-destructive",
};
const TYPE_BG: Record<string, string> = {
  culto: "bg-primary/15 text-primary",
  reuniao: "bg-gold/15 text-gold-muted dark:text-gold",
  congresso: "bg-destructive/10 text-destructive",
};

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  time: string | null;
  location: string | null;
  churchLocationId: string | null;
  type: string | null;
  isRecurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CalendarEventOccurrence {
  occurrenceId: string;
  occurrenceKey: string;
  occurrenceDate: Date;
  event: EventRow;
}

function formatDateToKey(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function startOfWeek(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

function endOfDay(date: Date) {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
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
  cells?: { id: string; name: string; address: string | null }[];
  churchLocations?: ChurchLocationRow[];
}

interface ChurchLocationRow {
  id: string;
  name: string;
  type: string;
  cep: string | null;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

interface ManualLocationState {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface EventFormState {
  title: string;
  description: string;
  date: string;
  time: string;
  type: EventFormData["type"];
  isRecurrent: boolean;
  churchLocationId: string;
}

const EMPTY_MANUAL_LOCATION: ManualLocationState = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

const EMPTY_EVENT_FORM: EventFormState = {
  title: "",
  description: "",
  date: "",
  time: "",
  type: "culto",
  isRecurrent: false,
  churchLocationId: "",
};

export function AgendaClient({
  initialEvents,
  stats,
  cells = [],
  churchLocations = [],
}: AgendaClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth());
  const [selDate, setSelDate] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<"Mês" | "Semana" | "Dia">("Mês");
  const [eventSearch, setEventSearch] = React.useState("");
  const [eventTypeFilter, setEventTypeFilter] = React.useState<"todos" | EventFormData["type"]>("todos");
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<EventRow | null>(null);
  const [newEventDate, setNewEventDate] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

  // Form states for Location Autocomplete
  const [searchLocationQuery, setSearchLocationQuery] = React.useState("");
  const [locationSearchOpen, setLocationSearchOpen] = React.useState(false);
  const [isManualLocation, setIsManualLocation] = React.useState(false);
  const [manualLocation, setManualLocation] = React.useState<ManualLocationState>(EMPTY_MANUAL_LOCATION);
  const [fetchingCep, setFetchingCep] = React.useState(false);
  const [eventForm, setEventForm] = React.useState<EventFormState>(EMPTY_EVENT_FORM);
  const [eventErrors, setEventErrors] = React.useState<Record<string, string[]>>({});
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const eventId = searchParams.get("eventId") ?? searchParams.get("highlight");
    if (!eventId) return;

    const highlightedEvent = initialEvents.find((event) => event.id === eventId);
    if (highlightedEvent) {
      setSelectedEvent(highlightedEvent);
      setSheetOpen(true);
      setYear(new Date(highlightedEvent.date).getFullYear());
      setMonth(new Date(highlightedEvent.date).getMonth());
      setSelDate(formatDateToKey(highlightedEvent.date));
    }
  }, [initialEvents, searchParams]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setLocationSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (sheetOpen) {
      if (selectedEvent) {
        setEventForm({
          title: selectedEvent.title,
          description: selectedEvent.description ?? "",
          date: formatDateForInput(selectedEvent.date),
          time: selectedEvent.time ?? "",
          type: (selectedEvent.type as EventFormData["type"]) ?? "culto",
          isRecurrent: selectedEvent.isRecurrent,
          churchLocationId: selectedEvent.churchLocationId ?? "",
        });
        setSearchLocationQuery(selectedEvent.location ?? "");
        setIsManualLocation(false);
        setManualLocation({ ...EMPTY_MANUAL_LOCATION });
      } else {
        setEventForm({ ...EMPTY_EVENT_FORM, date: newEventDate ?? "" });
        setSearchLocationQuery("");
        setIsManualLocation(false);
        setManualLocation({ ...EMPTY_MANUAL_LOCATION });
      }
      setEventErrors({});
    }
  }, [newEventDate, sheetOpen, selectedEvent]);

  const validateEventForm = (data: EventFormState, location = searchLocationQuery) => {
    const parsed = eventSchema.safeParse({
      ...data,
      location,
    });
    setEventErrors(parsed.success ? {} : parsed.error.flatten().fieldErrors);
    return parsed.success;
  };

  const updateEventField = <K extends keyof EventFormState>(
    field: K,
    value: EventFormState[K]
  ) => {
    setEventForm((current) => {
      const next = { ...current, [field]: value };
      validateEventForm(next);
      return next;
    });
  };

  const updateManualLocation = <K extends keyof ManualLocationState>(
    field: K,
    value: ManualLocationState[K]
  ) => {
    setManualLocation((current) => ({ ...current, [field]: value }));
  };

  const handleManualCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCep(e.target.value);
    setManualLocation((current) => ({ ...current, cep: masked }));

    const cleanCep = masked.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();

      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }

      setManualLocation((current) => ({
        ...current,
        street: data.logradouro || current.street,
        neighborhood: data.bairro || current.neighborhood,
        city: data.localidade || current.city,
        state: data.uf || current.state,
      }));
    } catch {
      toast.error("Não foi possível buscar o CEP.");
    } finally {
      setFetchingCep(false);
    }
  };

  const getFilteredLocations = () => {
    const lower = searchLocationQuery.toLowerCase();
    const churchMatches = churchLocations.filter((location) =>
      [location.name, location.address]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(lower))
    );
    const cellMatches = cells.filter((c) =>
      [c.name, c.address]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(lower))
    );

    return { churchMatches, cellMatches };
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const fmtKey = (d: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const isTdy = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const activeDate = selDate ? parseDateKey(selDate) : new Date(year, month, 1);
  const activeDateKey = formatDateToKey(activeDate);
  const weekStart = startOfWeek(activeDate);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  const eventTypeLabel: Record<EventFormData["type"], string> = {
    culto: "Culto",
    reuniao: "Reunião",
    congresso: "Congresso",
  };

  const locationSuggestions = getFilteredLocations();

  const setCalendarDate = (date: Date) => {
    setYear(date.getFullYear());
    setMonth(date.getMonth());
    setSelDate(formatDateToKey(date));
  };

  const prev = () => {
    if (viewMode === "Mês") {
      if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1);
      return;
    }

    setCalendarDate(addDays(activeDate, viewMode === "Semana" ? -7 : -1));
  };

  const next = () => {
    if (viewMode === "Mês") {
      if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1);
      return;
    }

    setCalendarDate(addDays(activeDate, viewMode === "Semana" ? 7 : 1));
  };

  const openNewEventForDate = (dateKey: string) => {
    const date = parseDateKey(dateKey);
    setSelectedEvent(null);
    setNewEventDate(dateKey);
    setYear(date.getFullYear());
    setMonth(date.getMonth());
    setSelDate(dateKey);
    setSheetOpen(true);
  };

  const getOccurrencesForRange = React.useCallback(
    (rangeStart: Date, rangeEnd: Date): CalendarEventOccurrence[] => {
      const normalizedStart = new Date(rangeStart);
      normalizedStart.setHours(0, 0, 0, 0);
      const normalizedEnd = endOfDay(rangeEnd);
      const occurrences: CalendarEventOccurrence[] = [];

      initialEvents.forEach((event) => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);

        if (!event.isRecurrent) {
          if (eventDate >= normalizedStart && eventDate <= normalizedEnd) {
            const occurrenceKey = formatDateToKey(eventDate);
            occurrences.push({
              occurrenceId: `${event.id}-${occurrenceKey}`,
              occurrenceKey,
              occurrenceDate: new Date(eventDate),
              event,
            });
          }
          return;
        }

        if (eventDate > normalizedEnd) return;

        const diffDays = Math.max(
          0,
          Math.ceil((normalizedStart.getTime() - eventDate.getTime()) / 86400000)
        );
        const weeksToSkip = Math.floor(diffDays / 7);
        let occurrenceDate = addDays(eventDate, weeksToSkip * 7);
        while (occurrenceDate < normalizedStart) {
          occurrenceDate = addDays(occurrenceDate, 7);
        }

        while (occurrenceDate <= normalizedEnd) {
          const occurrenceKey = formatDateToKey(occurrenceDate);
          occurrences.push({
            occurrenceId: `${event.id}-${occurrenceKey}`,
            occurrenceKey,
            occurrenceDate: new Date(occurrenceDate),
            event,
          });
          occurrenceDate = addDays(occurrenceDate, 7);
        }
      });

      return occurrences.sort((a, b) => {
        const dateCompare = a.occurrenceKey.localeCompare(b.occurrenceKey);
        if (dateCompare !== 0) return dateCompare;
        return (a.event.time ?? "").localeCompare(b.event.time ?? "");
      });
    },
    [initialEvents]
  );

  const matchesFilters = (occurrence: CalendarEventOccurrence) => {
    const event = occurrence.event;
    const normalizedSearch = eventSearch.trim().toLowerCase();
    const matchesType =
      eventTypeFilter === "todos" || event.type === eventTypeFilter;
    const matchesSearch =
      !normalizedSearch ||
      [event.title, event.description, event.location]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch));

    return matchesType && matchesSearch;
  };

  const monthOccurrences = React.useMemo(
    () =>
      getOccurrencesForRange(new Date(year, month, 1), new Date(year, month + 1, 0)).filter(
        matchesFilters
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventSearch, eventTypeFilter, getOccurrencesForRange, month, year]
  );
  const weekOccurrences = React.useMemo(
    () => getOccurrencesForRange(weekStart, addDays(weekStart, 6)).filter(matchesFilters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeDateKey, eventSearch, eventTypeFilter, getOccurrencesForRange]
  );
  const dayOccurrences = React.useMemo(
    () => getOccurrencesForRange(activeDate, activeDate).filter(matchesFilters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeDateKey, eventSearch, eventTypeFilter, getOccurrencesForRange]
  );
  const evtsFor = (d: number) =>
    monthOccurrences.filter((occurrence) => occurrence.occurrenceKey === fmtKey(d));

  const upcoming = getOccurrencesForRange(today, addDays(today, 180))
    .filter(matchesFilters)
    .slice(0, 4);
  const viewTitle =
    viewMode === "Mês"
      ? `${MONTHS_PT[month]} ${year}`
      : viewMode === "Semana"
        ? `${weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${addDays(weekStart, 6).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`
        : activeDate.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          });
  const sedeLocation =
    churchLocations.find((location) => location.type === "SEDE") ?? churchLocations[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    let finalLocation = "";
    if (isManualLocation) {
      if (
        !manualLocation.street ||
        !manualLocation.number ||
        !manualLocation.neighborhood ||
        !manualLocation.city ||
        !manualLocation.state
      ) {
        setSaving(false);
        toast.error("Preencha os campos obrigatórios do endereço manual.");
        return;
      }

      const addressLine = [
        manualLocation.street,
        manualLocation.number,
        manualLocation.complement,
      ].filter(Boolean).join(", ");
      const cityLine = [
        manualLocation.neighborhood,
        manualLocation.city,
        manualLocation.state,
      ].filter(Boolean).join(" - ");

      finalLocation = [
        addressLine,
        cityLine,
        manualLocation.cep ? `CEP: ${manualLocation.cep}` : "",
      ].filter(Boolean).join(" | ");
    } else {
      finalLocation = searchLocationQuery;
    }

    const data: EventFormData = {
      title: eventForm.title,
      description: eventForm.description,
      date: eventForm.date,
      time: eventForm.time,
      location: finalLocation,
      churchLocationId: isManualLocation ? "" : eventForm.churchLocationId,
      type: eventForm.type,
      isRecurrent: eventForm.isRecurrent,
    };

    if (!validateEventForm(eventForm, finalLocation)) {
      setSaving(false);
      toast.error("Corrija os erros do formulário antes de salvar.");
      return;
    }

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
    <div className="page-stack">
      <PageHeader
        eyebrow="Agenda Central"
        title="Gestão de Ministérios"
        description="Organize cultos, reuniões e eventos da igreja em um só lugar."
        actions={(
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl bg-surface-high p-1">
              {(["Mês", "Semana", "Dia"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setViewMode(m);
                    if (m !== "Mês" && !selDate) setCalendarDate(activeDate);
                  }} className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
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
              variant="brand"
              onClick={() => {
                setSelectedEvent(null);
                setNewEventDate(selDate ?? "");
                setSheetOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Novo Evento
            </Button>
          </div>
        )}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={eventSearch}
            onChange={(e) => setEventSearch(e.target.value)}
            placeholder="Filtrar por nome, descrição ou local..."
            className="h-11 rounded-xl bg-surface-high border-0 pl-10 focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>
        <Select
          value={eventTypeFilter}
          onValueChange={(value) =>
            setEventTypeFilter(value as "todos" | EventFormData["type"])
          }
        >
          <SelectTrigger className="h-11 w-full rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="culto">Culto</SelectItem>
            <SelectItem value="reuniao">Reunião</SelectItem>
            <SelectItem value="congresso">Congresso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Calendar Card */}
        <div className="app-card p-6">
          {/* Month Nav + Legend */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-heading font-bold text-foreground">
                {viewTitle}
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
                <span className="h-2 w-2 rounded-full bg-destructive" />
                Congresso
              </span>
            </div>
          </div>

          {viewMode === "Mês" && (
            <>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS_PT.map((d) => (
                  <div
                    key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>

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
                      type="button"
                      onDoubleClick={() => openNewEventForDate(dk)}
                      onClick={() => setSelDate(is ? null : dk)} className={cn(
                        "h-24 rounded-lg p-1.5 text-left transition-all duration-150 flex flex-col",
                        it ? "bg-primary/8 ring-2 ring-primary" : "hover:bg-surface-low",
                        is && !it && "bg-primary/10 ring-2 ring-primary/50"
                      )}
                    >
                      <span className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                          it ? "bg-primary text-primary-foreground" : "text-foreground"
                        )}
                      >
                        {day}
                      </span>
                      <div className="mt-auto space-y-0.5 overflow-hidden">
                        {de.slice(0, 2).map((occurrence) => (
                          <div
                            key={occurrence.occurrenceId} className={cn(
                              "cursor-pointer truncate rounded px-1 py-0.5 text-xs font-semibold leading-tight",
                              TYPE_BG[occurrence.event.type ?? "culto"] ?? "bg-primary/15 text-primary"
                            )}
                            onDoubleClick={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(occurrence.event);
                              setSheetOpen(true);
                            }}
                          >
                            {occurrence.event.title}
                          </div>
                        ))}
                        {de.length > 2 && (
                          <span className="px-1 text-xs text-muted-foreground">
                            +{de.length - 2}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {viewMode === "Semana" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
              {weekDays.map((date, index) => {
                const key = formatDateToKey(date);
                const occurrences = weekOccurrences.filter((occurrence) => occurrence.occurrenceKey === key);
                const isTodayDate = key === formatDateToKey(today);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCalendarDate(date)}
                    onDoubleClick={() => openNewEventForDate(key)}
                    className={cn(
                      "min-h-40 rounded-xl bg-surface-low p-3 text-left transition-colors hover:bg-surface-high",
                      selDate === key && "ring-2 ring-primary/50",
                      isTodayDate && "ring-2 ring-primary"
                    )}
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {WEEKDAYS_PT[index]}
                    </p>
                    <p className="mt-1 text-lg font-heading font-bold text-foreground">
                      {date.getDate()}
                    </p>
                    <div className="mt-4 space-y-2">
                      {occurrences.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sem eventos</p>
                      ) : (
                        occurrences.map((occurrence) => (
                          <div
                            key={occurrence.occurrenceId}
                            className={cn(
                              "rounded-lg px-2 py-1 text-xs font-semibold",
                              TYPE_BG[occurrence.event.type ?? "culto"] ?? "bg-primary/15 text-primary"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(occurrence.event);
                              setSheetOpen(true);
                            }}
                          >
                            {occurrence.event.time ? `${occurrence.event.time} · ` : ""}
                            {occurrence.event.title}
                          </div>
                        ))
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {viewMode === "Dia" && (
            <div
              className="min-h-96 rounded-xl bg-surface-low p-4"
              onDoubleClick={() => openNewEventForDate(activeDateKey)}
            >
              {dayOccurrences.length === 0 ? (
                <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                  Nenhum evento para este dia.
                </div>
              ) : (
                <div className="space-y-3">
                  {dayOccurrences.map((occurrence) => (
                    <div
                      key={occurrence.occurrenceId}
                      className="item-row cursor-pointer"
                      onDoubleClick={(e) => e.stopPropagation()}
                      onClick={() => {
                        setSelectedEvent(occurrence.event);
                        setSheetOpen(true);
                      }}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <Badge className={cn("mb-2 border-0", TYPE_BG[occurrence.event.type ?? "culto"] ?? "bg-primary/15 text-primary")}>
                            {eventTypeLabel[(occurrence.event.type as EventFormData["type"]) ?? "culto"] ?? "Evento"}
                          </Badge>
                          <h3 className="text-sm font-heading font-semibold text-foreground">
                            {occurrence.event.title}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {occurrence.event.description || "Sem descrição."}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {occurrence.event.time || "Horário a definir"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Próximos Eventos */}
          <div className="app-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-heading font-bold text-foreground">
                Próximos Eventos
              </h3>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                {upcoming.length}
              </span>
            </div>
            <div className="space-y-5">
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum evento próximo
                </p>
              ) : (
                upcoming.map((occurrence) => {
                  const ev = occurrence.event;
                  const evDate = occurrence.occurrenceDate;
                  return (
                    <div
                      key={occurrence.occurrenceId} className="space-y-1.5 cursor-pointer"
                      onClick={() => {
                        setSelectedEvent(ev);
                        setSheetOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn(
                            "h-2 w-2 rounded-full shrink-0",
                            TYPE_DOT[ev.type ?? "culto"] ?? "bg-primary"
                          )}
                        />
                        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
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
                          variant="secondary" className="mt-1 gap-1 rounded-md border-0 bg-primary/10 text-xs font-semibold text-primary"
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
          <div className="app-card overflow-hidden">
            <div className="bg-gradient-to-br from-primary to-primary/75 p-5 text-white">
              <p className="mb-1 text-xs uppercase tracking-widest text-white/65">
                Locais da Igreja
              </p>
              <p className="text-base font-heading font-semibold">
                {sedeLocation?.name ?? "Nenhum local cadastrado"}
              </p>
              {sedeLocation && (
                <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-white/85">
                  <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {sedeLocation.address}
                </p>
              )}
            </div>
            <div className="space-y-3 p-4">
              {churchLocations
                .filter((location) => location.id !== sedeLocation?.id)
                .slice(0, 3)
                .map((location) => (
                  <div key={location.id} className="rounded-xl bg-surface-high p-3">
                    <p className="text-sm font-semibold text-foreground">{location.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {location.address}
                    </p>
                  </div>
                ))}
              {churchLocations.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Cadastre sede e congregações em Configurações.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Eventos este mês"
          value={stats.eventsThisMonth}
          icon={CalendarCheck}
          tone="primary"
        />
        <MetricCard
          label="Total de eventos"
          value={stats.totalEvents}
          icon={Users}
          tone="gold"
        />
        <MetricCard
          label="Eventos futuros"
          value={stats.upcomingEvents}
          icon={Star}
          tone="info"
        />
      </div>

      {/* Sheet for Create/Edit Event */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setNewEventDate(null);
        }}
      >
        <SheetContent className="w-full sm:max-w-md p-0 border-0 bg-card flex flex-col h-full">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg font-heading font-bold">
                  {selectedEvent ? selectedEvent.title : "Novo Cadastro"}
                </SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedEvent ? "Editar informações" : "Preencha os dados do novo cadastro"}
                </p>
              </div>
              {selectedEvent && (
                <Button
                  variant="destructive"
                  size="icon" className="h-8 w-8"
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

          <div className="flex-1 overflow-y-auto">
            <form id="evento-form" onSubmit={handleSubmit} className="px-6 py-6 space-y-8">
              
              {/* SEÇÃO 1: GERAL */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Info className="h-4 w-4" />
                  <h3 className="text-xs font-semibold uppercase tracking-widest">
                    Informações Gerais
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className={cn("text-xs text-muted-foreground", eventErrors.title && "text-destructive")}>Título *</Label>
                    <Input
                      name="title"
                      required
                      placeholder="Ex: Culto de Celebração"
                      value={eventForm.title}
                      onChange={(e) => updateEventField("title", e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", eventErrors.title && "border border-destructive")}
                    />
                    <FieldError error={eventErrors.title} />
                  </div>

                  <div>
                    <Label className={cn("text-xs text-muted-foreground", eventErrors.description && "text-destructive")}>Descrição</Label>
                    <textarea
                      name="description"
                      rows={3}
                      placeholder="Detalhes do evento..."
                      value={eventForm.description}
                      onChange={(e) => updateEventField("description", e.target.value)} className={cn("mt-1.5 w-full rounded-xl bg-surface-high border-0 p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 resize-none", eventErrors.description && "border border-destructive")}
                    />
                    <FieldError error={eventErrors.description} />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <Select
                      name="type"
                      value={eventForm.type}
                      onValueChange={(value) => updateEventField("type", value as EventFormData["type"])}
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
                </div>
              </div>

              {/* SEÇÃO 2: DATA E HORA */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Clock className="h-4 w-4" />
                  <h3 className="text-xs font-semibold uppercase tracking-widest">
                    Data e Horário
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className={cn("text-xs text-muted-foreground", eventErrors.date && "text-destructive")}>Data *</Label>
                      <Input
                        name="date"
                        type="date"
                        required
                        value={eventForm.date}
                        onChange={(e) => updateEventField("date", e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", eventErrors.date && "border border-destructive")}
                      />
                      <FieldError error={eventErrors.date} />
                    </div>
                    <div>
                      <Label className={cn("text-xs text-muted-foreground", eventErrors.time && "text-destructive")}>Horário</Label>
                      <Input
                        name="time"
                        type="time"
                        value={eventForm.time}
                        onChange={(e) => updateEventField("time", e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", eventErrors.time && "border border-destructive")}
                      />
                      <FieldError error={eventErrors.time} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-surface-high p-3 border border-border/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">Evento Recorrente?</p>
                      <p className="text-xs text-muted-foreground">
                        Repete semanalmente
                      </p>
                    </div>
                    <Switch
                      name="isRecurrent"
                      checked={eventForm.isRecurrent}
                      onCheckedChange={(value) => updateEventField("isRecurrent", value)}
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: LOCALIZAÇÃO */}
              <div className="space-y-4 pb-4">
                <div className="flex items-center gap-2 text-primary">
                  <MapPin className="h-4 w-4" />
                  <h3 className="text-xs font-semibold uppercase tracking-widest">
                    Localização
                  </h3>
                </div>
                <div className="space-y-4">
                  {!isManualLocation ? (
                    <div className="relative" ref={wrapperRef}>
                      <Label className="text-xs text-muted-foreground">
                        Selecione o Local
                      </Label>
                      <div className="relative mt-1.5">
                        <Input
                          placeholder="Busque sede, congregação, célula ou informe um local..."
                          value={searchLocationQuery}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSearchLocationQuery(value);
                            updateEventField("churchLocationId", "");
                            validateEventForm(eventForm, value);
                            setLocationSearchOpen(true);
                          }}
                          onFocus={() => setLocationSearchOpen(true)} className="h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20 pl-10"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>

                      {locationSearchOpen && (
                        <div className="absolute z-10 w-full mt-2 rounded-xl border border-border bg-card shadow-lg overflow-hidden flex flex-col">
                          <ScrollArea className="max-h-60">
                            <div className="p-1.5">
                              <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Sugestões
                              </p>
                              
                              {locationSuggestions.churchMatches.map((location) => (
                                <div
                                  key={location.id}
                                  onClick={() => {
                                    setSearchLocationQuery(location.name);
                                    updateEventField("churchLocationId", location.id);
                                    validateEventForm(eventForm, location.name);
                                    setLocationSearchOpen(false);
                                  }} className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg hover:bg-surface-high transition-colors"
                                >
                                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                    {location.type === "SEDE" ? "SE" : "CG"}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{location.name}</span>
                                    <span className="w-48 truncate text-xs text-muted-foreground">
                                      {location.address}
                                    </span>
                                  </div>
                                </div>
                              ))}

                              {locationSuggestions.cellMatches.map((c) => (
                                <div
                                  key={c.id}
                                  onClick={() => {
                                    setSearchLocationQuery(c.name);
                                    updateEventField("churchLocationId", "");
                                    validateEventForm(eventForm, c.name);
                                    setLocationSearchOpen(false);
                                  }} className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg hover:bg-surface-high transition-colors"
                                >
                                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                    CL
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{c.name}</span>
                                    <span className="w-48 truncate text-xs text-muted-foreground">
                                      {c.address || "Sem endereço"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {locationSuggestions.churchMatches.length === 0 &&
                                locationSuggestions.cellMatches.length === 0 && (
                                  <p className="px-3 py-2 text-sm text-muted-foreground">
                                    Nenhum local cadastrado encontrado.
                                  </p>
                                )}
                            </div>
                          </ScrollArea>
                          <div
                            onClick={() => {
                              setIsManualLocation(true);
                              updateEventField("churchLocationId", "");
                              setLocationSearchOpen(false);
                            }} className="bg-surface-lowest p-3 border-t border-border flex items-center justify-between cursor-pointer hover:bg-surface-high transition-colors"
                          >
                            <span className="text-sm font-medium text-foreground flex items-center gap-2">
                              <Plus className="h-4 w-4 text-primary" /> Cadastrar endereço manualmente
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Endereço Manual</Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsManualLocation(false)} className="h-7 text-xs text-primary"
                        >
                          Voltar para busca
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="col-span-full sm:col-span-1">
                          <Label className="text-xs text-muted-foreground">CEP</Label>
                          <div className="relative mt-1.5">
                            <Input
                              name="cep"
                              value={manualLocation.cep}
                              onChange={handleManualCepChange} className="h-10 rounded-xl bg-surface-high border-0 pr-9"
                              placeholder="00000-000"
                            />
                            {fetchingCep && (
                              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
                            )}
                          </div>
                        </div>
                        <div className="col-span-full sm:col-span-2">
                          <Label className="text-xs text-muted-foreground">Rua/Avenida *</Label>
                          <Input
                            name="street"
                            required={isManualLocation}
                            value={manualLocation.street}
                            onChange={(e) => updateManualLocation("street", e.target.value)} className="mt-1.5 h-10 rounded-xl bg-surface-high border-0"
                            placeholder="Ex: Av. Principal"
                          />
                        </div>
                        <div className="col-span-1">
                          <Label className="text-xs text-muted-foreground">Número *</Label>
                          <Input
                            name="number"
                            required={isManualLocation}
                            value={manualLocation.number}
                            onChange={(e) => updateManualLocation("number", e.target.value)} className="mt-1.5 h-10 rounded-xl bg-surface-high border-0"
                            placeholder="Ex: 1000"
                          />
                        </div>
                        <div className="col-span-1">
                          <Label className="text-xs text-muted-foreground">Complemento</Label>
                          <Input
                            name="complement"
                            value={manualLocation.complement}
                            onChange={(e) => updateManualLocation("complement", e.target.value)} className="mt-1.5 h-10 rounded-xl bg-surface-high border-0"
                            placeholder="Ex: Sala 2"
                          />
                        </div>
                        <div className="col-span-full sm:col-span-2">
                          <Label className="text-xs text-muted-foreground">Bairro *</Label>
                          <Input
                            name="neighborhood"
                            required={isManualLocation}
                            value={manualLocation.neighborhood}
                            onChange={(e) => updateManualLocation("neighborhood", e.target.value)} className="mt-1.5 h-10 rounded-xl bg-surface-high border-0"
                            placeholder="Ex: Centro"
                          />
                        </div>
                        <div className="col-span-1">
                          <Label className="text-xs text-muted-foreground">Cidade *</Label>
                          <Input
                            name="city"
                            required={isManualLocation}
                            value={manualLocation.city}
                            onChange={(e) => updateManualLocation("city", e.target.value)} className="mt-1.5 h-10 rounded-xl bg-surface-high border-0"
                            placeholder="Ex: São Paulo"
                          />
                        </div>
                        <div className="col-span-1">
                          <Label className="text-xs text-muted-foreground">Estado *</Label>
                          <Input
                            name="state"
                            required={isManualLocation}
                            value={manualLocation.state}
                            onChange={(e) => updateManualLocation("state", e.target.value.toUpperCase().slice(0, 2))} className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 uppercase"
                            placeholder="Ex: SP"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </form>
          </div>

          {/* Persistent Footer Actions */}
          <div className="border-t border-border bg-card p-6 shrink-0 z-10 flex gap-3">
            <Button
              type="button"
              variant="outline" className="flex-1 h-11 rounded-xl border-border hover:bg-surface-high"
              onClick={() => setSheetOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="evento-form"
              variant="brand"
              disabled={saving} className="h-11 flex-1"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {selectedEvent ? "Salvar Alterações" : "Criar Evento"}
            </Button>
          </div>
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
