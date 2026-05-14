"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Plus, MapPin, Clock, Search,
  Loader2, Trash2, Users, Map, Edit3, User,
  Info, Check, Camera, Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createCell, updateCell, deleteCell } from "@/lib/actions/cell-actions";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { maskPhone, maskCep, maskCpf } from "@/lib/masks";
import { cellSchema } from "@/lib/validations/cell";
import { uploadCellCover } from "@/lib/actions/upload-actions";
import { FieldError, MetricCard, PageHeader } from "@/components/design-system";

// Match extended fields from backend
interface PersonRow {
  id: string;
  fullName: string;
  phone: string | null;
  cpf: string | null;
  birthDate: Date | null;
  personType: string;
}

interface CellRow {
  id: string;
  name: string;
  coverUrl?: string | null;
  foundedAt?: Date | null;
  neighborhood?: string | null;
  leaderId?: string | null;
  leaderName: string;
  leaderPhone: string | null;
  leaderCpf?: string | null;
  leaderBirthDate?: Date | null;
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  city?: string | null;
  state?: string | null;
  address: string | null;
  dayOfWeek: string | null;
  time: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  members: { id: string; fullName: string; personType: string }[];
  _count: { members: number };
}

const GRADIENT_COLORS = [
  "from-brand-dark to-primary",
  "from-primary to-primary/70",
  "from-chart-2 to-primary",
  "from-success to-primary",
  "from-gold-muted to-gold",
  "from-primary to-gold-muted",
];

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

interface CelulasClientProps {
  initialCells: CellRow[];
  people: PersonRow[];
  stats: {
    totalCells: number;
    activeCells: number;
    totalParticipants: number;
    avgPerCell: number;
  };
}

export function CelulasClient({ initialCells, stats, people }: CelulasClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<CellRow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // AutoComplete Status States
  const [searchLeaderQuery, setSearchLeaderQuery] = useState("");
  const [leaderSearchOpen, setLeaderSearchOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setLeaderSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Controlled form state matching people client exactly
  const [formData, setFormData] = useState({
    name: "",
    coverUrl: "",
    foundedAt: "",

    leaderId: "",
    leaderName: "",
    leaderPhone: "",
    leaderCpf: "",
    leaderBirthDate: "",

    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",

    dayOfWeek: "",
    time: "",
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (!highlightId) return;

    const highlightedCell = initialCells.find((cell) => cell.id === highlightId);
    if (highlightedCell) {
      setSelectedCell(highlightedCell);
      setIsEditing(false);
      setSheetOpen(true);
    }
  }, [initialCells, searchParams]);

  useEffect(() => {
    if (selectedCell) {
      setFormData({
        name: selectedCell.name,
        coverUrl: selectedCell.coverUrl || "",
        foundedAt: formatDateForInput(selectedCell.foundedAt),

        leaderId: selectedCell.leaderId || "",
        leaderName: selectedCell.leaderName,
        leaderPhone: selectedCell.leaderPhone || "",
        leaderCpf: selectedCell.leaderCpf ? maskCpf(selectedCell.leaderCpf) : "",
        leaderBirthDate: formatDateForInput(selectedCell.leaderBirthDate),

        cep: selectedCell.cep || "",
        street: selectedCell.street || selectedCell.address || "",
        number: selectedCell.number || "",
        complement: selectedCell.complement || "",
        neighborhood: selectedCell.neighborhood || "",
        city: selectedCell.city || "",
        state: selectedCell.state || "",

        dayOfWeek: selectedCell.dayOfWeek || "",
        time: selectedCell.time || "",
        isActive: selectedCell.isActive,
      });
      setSearchLeaderQuery(selectedCell.leaderName);
    } else {
      setFormData({
        name: "",
        coverUrl: "",
        foundedAt: "",
        leaderId: "",
        leaderName: "",
        leaderPhone: "",
        leaderCpf: "",
        leaderBirthDate: "",
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        dayOfWeek: "",
        time: "",
        isActive: true,
      });
      setSearchLeaderQuery("");
    }
    setFormErrors({});
  }, [selectedCell, sheetOpen]);

  const validateFormData = (data: typeof formData) => {
    const parsed = cellSchema.safeParse(data);
    setFormErrors(parsed.success ? {} : parsed.error.flatten().fieldErrors);
    return parsed.success;
  };

  const updateField = (field: string, value: string | boolean | null) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      validateFormData(next);
      return next;
    });
  };

  // ----- SEARCH & LEADERSHIP HANDLING -----
  const getFilteredPeople = () => {
    if (!searchLeaderQuery) return people.slice(0, 5);
    return people
      .filter((p) => p.fullName.toLowerCase().includes(searchLeaderQuery.toLowerCase()))
      .slice(0, 5);
  };

  const selectLeader = (person: PersonRow | null) => {
    if (person) {
      const nextData = {
        ...formData,
        leaderId: person.id,
        leaderName: person.fullName,
        leaderPhone: person.phone || "",
        leaderCpf: person.cpf ? maskCpf(person.cpf) : "",
        leaderBirthDate: person.birthDate ? new Date(person.birthDate).toISOString().split("T")[0] : "",
      };
      setFormData(nextData);
      validateFormData(nextData);
      setSearchLeaderQuery(person.fullName);
    } else {
      // Manual mode insertion
      const nextData = {
        ...formData,
        leaderId: "",
        leaderName: searchLeaderQuery,
        leaderPhone: "",
        leaderCpf: "",
        leaderBirthDate: "",
      };
      setFormData(nextData);
      validateFormData(nextData);
    }
    setLeaderSearchOpen(false);
  };

  // ----- CEP HANDLING (Borrowed from people-client) -----
  const fetchAddress = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData((prev) => {
          const next = {
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          };
          validateFormData(next);
          return next;
        });
      } else {
        toast.error("CEP não encontrado.");
      }
    } catch {
      toast.error("Erro ao buscar o CEP.");
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCep(e.target.value);
    updateField("cep", masked);
    if (masked.replace(/\D/g, "").length === 8) {
      fetchAddress(masked);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});

    if (!validateFormData(formData)) {
      setSaving(false);
      toast.error("Corrija os erros do formulário antes de salvar.");
      return;
    }

    try {
      const result = selectedCell
        ? await updateCell(selectedCell.id, formData)
        : await createCell(formData);

      if (result.success) {
        toast.success(
          selectedCell ? "Célula atualizada com sucesso!" : "Célula cadastrada com sucesso!"
        );
        setSheetOpen(false);
        setSelectedCell(null);
        setIsEditing(false);
        router.refresh();
      } else {
        if (typeof result.error === "object") {
          setFormErrors(result.error as Record<string, string[]>);
          toast.error("Existem erros no formulário.");
        } else {
          toast.error(typeof result.error === "string" ? result.error : "Erro ao salvar.");
        }
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
      const result = await deleteCell(pendingDeleteId);
      if (result.success) {
        toast.success("Célula excluída com sucesso!");
        setSheetOpen(false);
        setSelectedCell(null);
        setIsEditing(false);
        setDeleteDialogOpen(false);
        setPendingDeleteId(null);
        router.refresh();
      } else {
        toast.error(typeof result.error === "string" ? result.error : "Erro ao excluir.");
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
        eyebrow="Gestão de Células"
        title="Pequenos Grupos"
        description="Gerencie células, líderes, endereços e horários com o mesmo padrão de cadastro."
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/celulas/mapa" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-high"
            >
              <Map className="h-4 w-4" />
              Ver Mapa
            </Link>
            <Button
              variant="brand"
              onClick={() => {
                setSelectedCell(null);
                setIsEditing(true);
                setSheetOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nova Célula
            </Button>
          </div>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Células ativas"
          value={stats.activeCells}
          icon={MapPin}
          tone="primary"
          helper="Grupos em funcionamento"
        />
        <MetricCard
          label="Participantes"
          value={stats.totalParticipants}
          icon={Users}
          tone="success"
          helper={`Média de ${stats.avgPerCell}/célula`}
        />
        <MetricCard
          label="Total de células"
          value={stats.totalCells}
          icon={Map}
          tone="gold"
          helper="Inclui ativas e inativas"
        />
        <MetricCard
          label="Média por célula"
          value={stats.avgPerCell}
          icon={Clock}
          tone="info"
          helper="Participantes ativos"
        />
      </div>

      {/* Cell Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {initialCells.map((cell, idx) => (
          <div
            key={cell.id}
            onClick={() => {
              setSelectedCell(cell);
              setIsEditing(false);
              setSheetOpen(true);
            }} className={cn(
              "app-card group cursor-pointer overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg",
              !cell.isActive && "opacity-70 grayscale-[0.3]"
            )}
          >
            {/* Cover Image / Gradient */}
            <div className={cn(
              "relative h-36 bg-gradient-to-br overflow-hidden",
              GRADIENT_COLORS[idx % GRADIENT_COLORS.length]
            )}>
              {cell.coverUrl && (
                <Image
                  src={cell.coverUrl}
                  alt={cell.name}
                  fill
                  sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                  unoptimized className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

              {/* Zone/Neighborhood Badge */}
              {cell.neighborhood && (
                <span className="absolute top-3 left-3 rounded-md bg-white/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  {cell.neighborhood}
                </span>
              )}

              {/* Active indicator */}
              <div className={cn(
                "absolute top-3 right-3 h-2.5 w-2.5 rounded-full shadow-lg",
                cell.isActive ? "bg-success" : "bg-destructive"
              )} />
            </div>

            {/* Content */}
            <div className="p-4 space-y-2.5">
              <div>
                <h3 className="text-lg font-heading font-bold text-foreground group-hover:text-primary transition-colors">
                  {cell.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Líder: <span className="font-medium text-foreground">{cell.leaderName}</span>
                </p>
              </div>

              {/* Schedule & Address */}
              <div className="space-y-1.5">
                {(cell.dayOfWeek || cell.time) && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{cell.dayOfWeek}{cell.dayOfWeek && cell.time ? ", " : ""}{cell.time}</span>
                  </div>
                )}
                {cell.address && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate" title={cell.address}>{cell.address}</span>
                  </div>
                )}
              </div>

              {/* Footer: Members + Details */}
              <div className="pt-2.5 border-t border-border flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex -space-x-1.5">
                    {Array.from({ length: Math.min(3, cell._count.members) }).map((_, i) => (
                      <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-primary/15 text-xs font-bold text-primary">
                        {cell.members[i] ? getInitials(cell.members[i].fullName) : `M${i + 1}`}
                      </div>
                    ))}
                  </div>
                  {cell._count.members > 0 && (
                    <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold text-white">
                      +{cell._count.members}
                    </span>
                  )}
                  {cell._count.members === 0 && (
                    <span className="text-xs text-muted-foreground">Sem membros</span>
                  )}
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                  Ver Detalhes →
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Cell Card */}
        <div
          onClick={() => {
            setSelectedCell(null);
            setIsEditing(true);
            setSheetOpen(true);
          }} className="app-card flex min-h-[320px] cursor-pointer flex-col items-center justify-center space-y-3 border-2 border-dashed border-border bg-card/50 p-6 text-center transition-colors hover:border-primary/40"
        >
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-heading font-bold text-foreground">Nova Célula</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Crie uma nova célula com dados completos.</p>
          </div>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md md:max-w-xl p-0 border-l border-border bg-card shadow-2xl flex flex-col h-full">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg font-heading font-bold">
                  {selectedCell
                    ? isEditing
                      ? selectedCell.name
                      : selectedCell.name
                    : "Novo Cadastro"}
                </SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedCell
                    ? isEditing
                      ? "Editar informações"
                      : `Líder: ${selectedCell.leaderName}`
                    : "Preencha os dados do novo cadastro"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedCell && !isEditing && (
                  <Button
                    variant="outline"
                    size="sm" className="h-8 gap-1.5 rounded-lg border-border"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                )}
                {/* Replaced buggy dynamic X button with static SheetClose default */}
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 overflow-y-auto">
            {!isEditing && selectedCell ? (
              <div className="p-6 space-y-8 pb-4">
                {/* Read-Only Visuals Left the Same or Slightly Improved */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Info className="h-4 w-4" />
                    <h3 className="text-xs font-semibold uppercase tracking-widest">
                      Identificação
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-surface-high rounded-xl p-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Célula</p>
                      <p className="text-sm font-medium">{selectedCell.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <Badge className={cn("border-0 text-xs", selectedCell.isActive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                        {selectedCell.isActive ? "ATIVA" : "INATIVA"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <User className="h-4 w-4" />
                    <h3 className="text-xs font-semibold uppercase tracking-widest">
                      Líder Responsável
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-surface-high rounded-xl p-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Líder Relacional</p>
                      <p className="text-sm font-medium">{selectedCell.leaderName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Telefone</p>
                      <p className="text-sm font-medium">{selectedCell.leaderPhone || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Clock className="h-4 w-4" />
                    <h3 className="text-xs font-semibold uppercase tracking-widest">
                      Funcionamento
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-surface-high rounded-xl p-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Dia da Semana</p>
                      <p className="text-sm font-medium">{selectedCell.dayOfWeek || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Horário</p>
                      <p className="text-sm font-medium">{selectedCell.time || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <MapPin className="h-4 w-4" />
                    <h3 className="text-xs font-semibold uppercase tracking-widest">
                      Endereço
                    </h3>
                  </div>
                  <div className="bg-surface-high rounded-xl p-4">
                    <p className="text-sm font-medium leading-relaxed">{selectedCell.address || "Não informado."}</p>
                  </div>
                </div>

                {/* Members Read-Only Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Users className="h-4 w-4" />
                    <h3 className="text-xs font-semibold uppercase tracking-widest">
                      Participantes da Célula ({selectedCell._count.members})
                    </h3>
                  </div>
                  {selectedCell.members.length > 0 ? (
                    <div className="space-y-3">
                      {selectedCell.members.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-high/50 border border-border/50">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                            {getInitials(member.fullName)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{member.fullName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{member.personType.toLowerCase()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-muted-foreground text-sm bg-surface-high/30 rounded-xl border border-dashed border-border">
                      Nenhum participante vinculado a esta célula ainda.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // FULL EDIT AND CREATION MODE
              <form id="cell-form" onSubmit={handleSubmit} className="p-6 space-y-8 pb-4">

                {/* IDENTIFICAÇÃO */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Info className="h-4 w-4" />
                    <h3 className="text-xs font-semibold uppercase tracking-widest">
                      Identificação
                    </h3>
                  </div>

                  <div>
                    <Label className={cn("text-xs text-muted-foreground", formErrors.name && "text-destructive")}>
                      Nome da Célula *
                    </Label>
                    <Input
                      name="name"
                      required
                      placeholder="Ex: Célula Ágape"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.name && "border border-destructive")}
                    />
                    <FieldError error={formErrors.name} />
                  </div>

                  {selectedCell ? (
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-high">
                      <div className="relative group shrink-0">
                        <div className="relative h-16 w-24 rounded-xl bg-primary/10 flex items-center justify-center text-primary overflow-hidden border border-primary/20">
                          {selectedCell.coverUrl ? (
                            <Image
                              src={selectedCell.coverUrl}
                              alt=""
                              fill
                              sizes="96px"
                              unoptimized className="object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-primary/50" />
                          )}
                        </div>
                        <label className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                          <Camera className="h-5 w-5 text-white" />
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp" className="sr-only"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const fd = new FormData();
                              fd.append("cover", file);
                              const result = await uploadCellCover(selectedCell.id, fd);
                              if (result.success) {
                                toast.success("Foto atualizada!");
                                router.refresh();
                              } else {
                                toast.error(result.error || "Erro ao enviar foto.");
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Foto de Capa</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Clique na imagem para alterar<br/>JPG, PNG ou WebP • Máx. 2MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-high border border-dashed border-border">
                      <div className="h-16 w-24 rounded-xl bg-surface-lowest flex items-center justify-center text-muted-foreground shrink-0">
                        <ImageIcon className="h-6 w-6 opacity-30" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Foto de Capa</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Você poderá adicionar uma foto de capa após salvar o cadastro inicial da célula.</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className={cn("text-xs text-muted-foreground", formErrors.foundedAt && "text-destructive")}>
                      Data de Fundação
                    </Label>
                    <Input
                      name="foundedAt"
                      type="date"
                      value={formData.foundedAt}
                      onChange={(e) => updateField("foundedAt", e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.foundedAt && "border border-destructive")}
                    />
                    <FieldError error={formErrors.foundedAt} />
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-surface-high p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Célula Ativa?
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Identifica se a célula está em pleno funcionamento.
                      </p>
                    </div>
                    <Switch
                      name="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(val) => updateField("isActive", val)}
                    />
                  </div>
                </div>

                {/* LIDERANÇA COM AUTOCOMPLETE */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <User className="h-4 w-4" />
                    <h3 className="text-xs font-semibold uppercase tracking-widest">
                      Liderança
                    </h3>
                  </div>

                  <div className="relative" ref={wrapperRef}>
                    <Label className={cn("text-xs text-muted-foreground", formErrors.leaderName && "text-destructive")}>
                      Líder Responsável *
                    </Label>
                    <div className="relative mt-1.5">
                      <Input
                        placeholder="Busque ou digite o nome do líder..."
                        value={searchLeaderQuery}
                        onChange={(e) => {
                          setSearchLeaderQuery(e.target.value);
                          updateField("leaderName", e.target.value);
                          if (formData.leaderId) updateField("leaderId", ""); // clear ID if user typed
                          setLeaderSearchOpen(true);
                        }}
                        onFocus={() => setLeaderSearchOpen(true)} className={cn("h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20 pl-10", formErrors.leaderName && "border border-destructive")}
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <FieldError error={formErrors.leaderName} />

                    {leaderSearchOpen && searchLeaderQuery && !formData.leaderId && (
                      <div className="absolute z-10 w-full mt-2 rounded-xl border border-border bg-card shadow-lg overflow-hidden flex flex-col">
                        <ScrollArea className="max-h-60">
                          {getFilteredPeople().length > 0 ? (
                            <div className="p-1.5">
                              <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Sugestões do Sistema
                              </p>
                              {getFilteredPeople().map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => selectLeader(p)} className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg hover:bg-surface-high transition-colors"
                                >
                                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                    {getInitials(p.fullName)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{p.fullName}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {p.cpf ? `CPF: ${maskCpf(p.cpf)}` : "Sem CPF"} • {p.phone || "Sem contato"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-center">
                              <p className="text-sm text-muted-foreground">Nenhuma pessoa encontrada.</p>
                            </div>
                          )}
                        </ScrollArea>
                        <div
                          onClick={() => selectLeader(null)} className="bg-surface-lowest p-3 border-t border-border flex items-center justify-between cursor-pointer hover:bg-surface-high transition-colors"
                        >
                          <span className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Plus className="h-4 w-4 text-primary" /> Cadastrar como novo líder manual
                          </span>
                          <span className="text-xs text-muted-foreground">
                            &quot;{searchLeaderQuery}&quot;
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {formData.leaderId ? (
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                        {getInitials(formData.leaderName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{formData.leaderName}</p>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Check className="h-3 w-3 text-success" /> Vínculo automático no sistema
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="ml-auto" onClick={() => selectLeader(null)}>Limpar</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 pb-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Telefone do Líder</Label>
                        <Input
                          name="leaderPhone"
                          value={formData.leaderPhone}
                          onChange={(e) => updateField("leaderPhone", maskPhone(e.target.value))}
                          placeholder="(11) 00000-0000" className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                      </div>
                      <div>
                        <Label className={cn("text-xs text-muted-foreground", formErrors.leaderCpf && "text-destructive")}>CPF do Líder</Label>
                        <Input
                          name="leaderCpf"
                          value={formData.leaderCpf}
                          onChange={(e) => updateField("leaderCpf", maskCpf(e.target.value))}
                          placeholder="000.000.000-00" className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.leaderCpf && "border border-destructive")}
                        />
                        <FieldError error={formErrors.leaderCpf} />
                      </div>
                      <div className="col-span-2">
                        <Label className={cn("text-xs text-muted-foreground", formErrors.leaderBirthDate && "text-destructive")}>Data de Nascimento (Líder)</Label>
                        <Input
                          type="date"
                          name="leaderBirthDate"
                          value={formData.leaderBirthDate}
                          onChange={(e) => updateField("leaderBirthDate", e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.leaderBirthDate && "border border-destructive")}
                        />
                        <FieldError error={formErrors.leaderBirthDate} />
                      </div>
                    </div>
                  )}
                </div>

                {/* ENDEREÇO DA CÉLULA */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <MapPin className="h-4 w-4" />
                    <h3 className="text-xs font-semibold uppercase tracking-widest">
                      Endereço da Célula
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className={cn("text-xs text-muted-foreground", formErrors.cep && "text-destructive")}>CEP</Label>
                        <Input
                          name="cep"
                          placeholder="00000-000"
                          value={formData.cep}
                          onChange={handleCepChange} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.cep && "border border-destructive")}
                        />
                        <FieldError error={formErrors.cep} />
                      </div>
                      <div className="col-span-2">
                        <Label className={cn("text-xs text-muted-foreground", formErrors.street && "text-destructive")}>Rua</Label>
                        <Input
                          name="street"
                          placeholder="Nome da Rua"
                          value={formData.street}
                          onChange={(e) => updateField('street', e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.street && "border border-destructive")}
                        />
                        <FieldError error={formErrors.street} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className={cn("text-xs text-muted-foreground", formErrors.number && "text-destructive")}>Número</Label>
                        <Input
                          name="number"
                          placeholder="Nº"
                          value={formData.number}
                          onChange={(e) => updateField('number', e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.number && "border border-destructive")}
                        />
                        <FieldError error={formErrors.number} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Complemento</Label>
                        <Input
                          name="complement"
                          placeholder="Apto, Bloco..."
                          value={formData.complement}
                          onChange={(e) => updateField('complement', e.target.value)} className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className={cn("text-xs text-muted-foreground", formErrors.neighborhood && "text-destructive")}>Bairro</Label>
                        <Input
                          name="neighborhood"
                          placeholder="Bairro"
                          value={formData.neighborhood}
                          onChange={(e) => updateField('neighborhood', e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.neighborhood && "border border-destructive")}
                        />
                        <FieldError error={formErrors.neighborhood} />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <Label className={cn("text-xs text-muted-foreground", formErrors.city && "text-destructive")}>Cidade</Label>
                          <Input
                            name="city"
                            placeholder="Cidade"
                            value={formData.city}
                            onChange={(e) => updateField('city', e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.city && "border border-destructive")}
                          />
                          <FieldError error={formErrors.city} />
                        </div>
                        <div>
                          <Label className={cn("text-xs text-muted-foreground", formErrors.state && "text-destructive")}>UF</Label>
                          <Input
                            name="state"
                            placeholder="UF"
                            maxLength={2}
                            value={formData.state}
                            onChange={(e) => updateField('state', e.target.value.toUpperCase())} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20 uppercase", formErrors.state && "border border-destructive")}
                          />
                          <FieldError error={formErrors.state} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FUNCIONAMENTO */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Clock className="h-4 w-4" />
                    <h3 className="text-xs font-semibold uppercase tracking-widest">
                      Funcionamento
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-4">
                    <div>
                      <Label className={cn("text-xs text-muted-foreground", formErrors.dayOfWeek && "text-destructive")}>Dia da Semana</Label>
                      <Select
                        value={formData.dayOfWeek}
                        onValueChange={(val) => updateField("dayOfWeek", val)}
                      >
                        <SelectTrigger className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-0", formErrors.dayOfWeek && "border border-destructive")}>
                          <SelectValue placeholder="Escolha um dia..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Domingos">Domingos</SelectItem>
                          <SelectItem value="Segundas-feiras">Segundas-feiras</SelectItem>
                          <SelectItem value="Terças-feiras">Terças-feiras</SelectItem>
                          <SelectItem value="Quartas-feiras">Quartas-feiras</SelectItem>
                          <SelectItem value="Quintas-feiras">Quintas-feiras</SelectItem>
                          <SelectItem value="Sextas-feiras">Sextas-feiras</SelectItem>
                          <SelectItem value="Sábados">Sábados</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError error={formErrors.dayOfWeek} />
                    </div>
                    <div>
                      <Label className={cn("text-xs text-muted-foreground", formErrors.time && "text-destructive")}>Horário</Label>
                      <Input
                        name="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => updateField("time", e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.time && "border border-destructive")}
                      />
                      <FieldError error={formErrors.time} />
                    </div>
                  </div>
                </div>
              </form>
            )}
          </ScrollArea>

          {/* Persistent Footer Actions */}
          {isEditing && (
            <div className="border-t border-border bg-card p-6 shrink-0 z-10 flex gap-3">
              <Button
                type="button"
                variant="outline" className="flex-1 h-11 rounded-xl border-border hover:bg-surface-high"
                onClick={() => {
                  if (selectedCell) {
                    setIsEditing(false);
                  } else {
                    setSheetOpen(false);
                  }
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="cell-form"
                variant="brand"
                disabled={saving} className="h-11 flex-1 gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                {selectedCell ? "Salvar Alterações" : "Cadastrar Célula"}
              </Button>
            </div>
          )}
          {!isEditing && selectedCell && (
            <div className="border-t border-border bg-card p-6 shrink-0 flex gap-3 h-[88px] items-center justify-between">
              <Button
                variant="destructive" className="h-11 w-11 shrink-0 p-0"
                onClick={() => requestDelete(selectedCell.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="brand" className="h-11 flex-1"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="mr-2 h-4 w-4" /> Editar Célula
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        loading={deleting}
        title="Excluir Célula"
        description="Esta ação é irreversível. Os membros vinculados a esta célula serão desvinculados."
      />
    </div>
  );
}
