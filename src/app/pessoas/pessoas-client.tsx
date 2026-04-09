"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  Plus,
  Filter,
  Phone,
  MessageSquare,
  ChevronRight,
  User,
  Church,
  MapPin,
  Trash2,
  Loader2,
  Camera,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { createPerson, updatePerson, deletePerson } from "@/lib/actions/person-actions";
import type { PersonFormData } from "@/lib/validations/person";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { EmptyState } from "@/components/empty-state";
import { maskPhone, maskCep } from "@/lib/masks";
import { uploadPersonPhoto } from "@/lib/actions/upload-actions";

type PersonType = "MEMBRO" | "VISITANTE" | "CONGREGADO";
type PersonStatus = "ATIVO" | "INATIVO" | "TRANSFERIDO" | "FALECIDO";

interface PersonRow {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  birthDate: Date | null;
  maritalStatus: string | null;
  weddingDate: Date | null;
  profession: string | null;
  personType: string;
  memberStatus: string;
  isBaptized: boolean;
  baptismDate: Date | null;
  conversionDate: Date | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  cellId: string | null;
  notes: string | null;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  cell: { id: string; name: string } | null;
}

const TYPE_STYLES: Record<PersonType, string> = {
  MEMBRO: "bg-primary/10 text-primary",
  VISITANTE: "bg-gold/15 text-gold-muted dark:text-gold",
  CONGREGADO: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

const STATUS_STYLES: Record<string, string> = {
  ATIVO: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  INATIVO: "bg-red-500/10 text-red-600 dark:text-red-400",
  TRANSFERIDO: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  FALECIDO: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDateForInput(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

interface PessoasClientProps {
  initialData: PersonRow[];
  total: number;
  page: number;
  totalPages: number;
  stats: { total: number; membros: number; visitantes: number; congregados: number };
  cells: { id: string; name: string }[];
  currentSearch: string;
  currentTab: string;
  currentStatus: string;
  currentBaptized: string;
  currentCell: string;
}

export function PessoasClient({
  initialData,
  total,
  page,
  totalPages,
  stats,
  cells,
  currentSearch,
  currentTab,
  currentStatus,
  currentBaptized,
  currentCell,
}: PessoasClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = React.useState(currentSearch);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [selectedPerson, setSelectedPerson] = React.useState<PersonRow | null>(null);

  React.useEffect(() => {
    if (searchParams.get("new") === "1") {
      setSheetOpen(true);
      // Remove 'new=1' from URL without refreshing
      const params = new URLSearchParams(searchParams.toString());
      params.delete("new");
      router.replace(`/pessoas?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router]);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(
    !!(currentStatus || currentBaptized || currentCell)
  );
  const searchTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  const buildParams = (overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    const vals = {
      search: overrides.search ?? search,
      tab: overrides.tab ?? currentTab,
      status: overrides.status ?? currentStatus,
      baptized: overrides.baptized ?? currentBaptized,
      cell: overrides.cell ?? currentCell,
      page: overrides.page ?? "",
    };
    if (vals.search) params.set("search", vals.search);
    if (vals.tab && vals.tab !== "todos") params.set("tab", vals.tab);
    if (vals.status) params.set("status", vals.status);
    if (vals.baptized) params.set("baptized", vals.baptized);
    if (vals.cell) params.set("cell", vals.cell);
    if (vals.page && vals.page !== "1") params.set("page", vals.page);
    return params;
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      router.push(`/pessoas?${buildParams({ search: value }).toString()}`);
    }, 400);
  };

  const handleTabChange = (tab: string) => {
    router.push(`/pessoas?${buildParams({ tab }).toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    router.push(`/pessoas?${buildParams({ page: String(newPage) }).toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    router.push(`/pessoas?${buildParams({ [key]: value }).toString()}`);
  };

  const clearFilters = () => {
    router.push(`/pessoas?${buildParams({ status: "", baptized: "", cell: "" }).toString()}`);
  };

  const hasActiveFilters = !!(currentStatus || currentBaptized || currentCell);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const data: PersonFormData = {
      fullName: fd.get("fullName") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      birthDate: fd.get("birthDate") as string,
      maritalStatus: (fd.get("maritalStatus") as PersonFormData["maritalStatus"]) || undefined,
      weddingDate: fd.get("weddingDate") as string,
      profession: fd.get("profession") as string,
      personType: (fd.get("personType") as PersonFormData["personType"]) || "VISITANTE",
      memberStatus: (fd.get("memberStatus") as PersonFormData["memberStatus"]) || "ATIVO",
      isBaptized: fd.get("isBaptized") === "on",
      baptismDate: fd.get("baptismDate") as string,
      conversionDate: fd.get("conversionDate") as string,
      cep: fd.get("cep") as string,
      street: fd.get("street") as string,
      number: fd.get("number") as string,
      complement: fd.get("complement") as string,
      neighborhood: fd.get("neighborhood") as string,
      city: fd.get("city") as string,
      state: fd.get("state") as string,
      cellId: (fd.get("cellId") as string) || "",
      notes: fd.get("notes") as string,
    };

    try {
      const result = selectedPerson
        ? await updatePerson(selectedPerson.id, data)
        : await createPerson(data);

      if (result.success) {
        toast.success(
          selectedPerson ? "Pessoa atualizada com sucesso!" : "Pessoa cadastrada com sucesso!"
        );
        setSheetOpen(false);
        setSelectedPerson(null);
        router.refresh();
      } else {
        toast.error(
          typeof result.error === "string"
            ? result.error
            : "Erro de validação. Verifique os campos."
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
      const result = await deletePerson(pendingDeleteId);
      if (result.success) {
        toast.success("Pessoa excluída com sucesso!");
        setSheetOpen(false);
        setSelectedPerson(null);
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">
            Pessoas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Diretório e CRM da comunidade
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedPerson(null);
            setSheetOpen(true);
          }}
          className="gradient-primary text-white rounded-xl gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Cadastro
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="rounded-xl bg-card p-5 shadow-ambient">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          Comunidade Total
        </p>
        <div className="flex items-end gap-6">
          <p className="text-4xl font-heading font-bold text-foreground">
            {stats.total.toLocaleString("pt-BR")}
          </p>
          <div className="flex gap-4 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">
                {stats.membros} Membros
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-gold" />
              <span className="text-xs text-muted-foreground">
                {stats.visitantes} Visitantes
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">
                {stats.congregados} Congregados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="w-full sm:w-auto"
        >
          <TabsList className="bg-surface-high rounded-xl h-10">
            <TabsTrigger
              value="todos"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs"
            >
              Todos
            </TabsTrigger>
            <TabsTrigger
              value="membros"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs"
            >
              Membros
            </TabsTrigger>
            <TabsTrigger
              value="visitantes"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs"
            >
              Visitantes
            </TabsTrigger>
            <TabsTrigger
              value="congregados"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs"
            >
              Congregados
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            size="sm"
            className={cn(
              "rounded-xl gap-2 h-10 px-4 shrink-0",
              hasActiveFilters && "gradient-primary text-white"
            )}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="h-5 w-5 rounded-full bg-white/20 text-[0.6rem] flex items-center justify-center font-bold">
                {[currentStatus, currentBaptized, currentCell].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {filtersOpen && (
        <div className="rounded-xl bg-card p-4 shadow-ambient border border-border animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Filtros Avançados
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Limpar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Status</Label>
              <Select
                value={currentStatus || "all"}
                onValueChange={(v) => handleFilterChange("status", v === "all" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="h-9 rounded-xl bg-surface-high border-0">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                  <SelectItem value="TRANSFERIDO">Transferido</SelectItem>
                  <SelectItem value="FALECIDO">Falecido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Batismo</Label>
              <Select
                value={currentBaptized || "all"}
                onValueChange={(v) => handleFilterChange("baptized", v === "all" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="h-9 rounded-xl bg-surface-high border-0">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Batizados</SelectItem>
                  <SelectItem value="no">Não batizados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Célula</Label>
              <Select
                value={currentCell || "all"}
                onValueChange={(v) => handleFilterChange("cell", v === "all" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="h-9 rounded-xl bg-surface-high border-0">
                  <SelectValue placeholder="Todas as células" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as células</SelectItem>
                  <SelectItem value="none">Sem célula</SelectItem>
                  {cells.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* People List */}
      <div className="rounded-xl bg-card shadow-ambient overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[1fr_120px_150px_140px_100px_80px] gap-4 px-5 py-3 bg-surface-low text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <span>Nome</span>
          <span>Tipo</span>
          <span>Telefone</span>
          <span>Célula</span>
          <span>Status</span>
          <span className="text-right">Ações</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/50">
          {initialData.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10" />}
              title="Nenhuma pessoa encontrada"
              description={search ? "Tente ajustar os termos de busca ou limpar os filtros." : "Comece adicionando membros, visitantes e congregados à sua comunidade."}
              actionLabel={!search ? "Novo Cadastro" : undefined}
              onAction={!search ? () => { setSelectedPerson(null); setSheetOpen(true); } : undefined}
            />
          ) : (
            initialData.map((person) => (
              <div
                key={person.id}
                className="group grid grid-cols-1 md:grid-cols-[1fr_120px_150px_140px_100px_80px] gap-2 md:gap-4 items-center px-5 py-3.5 hover:bg-surface-low/50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedPerson(person);
                  setSheetOpen(true);
                }}
              >
                {/* Name */}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold overflow-hidden">
                    {person.photoUrl ? (
                      <img src={person.photoUrl} alt={person.fullName} className="h-full w-full object-cover" />
                    ) : (
                      getInitials(person.fullName)
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {person.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground md:hidden">
                      {person.phone || "—"}
                    </p>
                  </div>
                </div>

                {/* Type */}
                <div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-md text-[0.65rem] font-semibold uppercase border-0",
                      TYPE_STYLES[person.personType as PersonType] ?? ""
                    )}
                  >
                    {person.personType}
                  </Badge>
                </div>

                {/* Phone */}
                <span className="hidden md:block text-sm text-muted-foreground">
                  {person.phone || "—"}
                </span>

                {/* Cell */}
                <span className="hidden md:block text-sm text-muted-foreground">
                  {person.cell?.name || "—"}
                </span>

                {/* Status */}
                <div className="hidden md:block">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-md text-[0.65rem] font-semibold uppercase border-0",
                      STATUS_STYLES[person.memberStatus] ?? ""
                    )}
                  >
                    {person.memberStatus}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="hidden md:flex items-center justify-end gap-1">
                  {person.phone && (
                    <>
                      <button
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `https://wa.me/55${person.phone!.replace(/\D/g, "")}`,
                            "_blank"
                          );
                        }}
                        aria-label={`Enviar WhatsApp para ${person.fullName}`}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`tel:${person.phone!.replace(/\D/g, "")}`, "_self");
                        }}
                        aria-label={`Ligar para ${person.fullName}`}
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Pagination */}
        <div className="flex items-center justify-between px-5 py-3 bg-surface-low text-xs text-muted-foreground">
          <span>
            Mostrando {initialData.length} de {total} registros
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs rounded-lg"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Anterior
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(
              (p) => (
                <Button
                  key={p}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2 text-xs rounded-lg",
                    p === page && "bg-primary/10 text-primary"
                  )}
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </Button>
              )
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs rounded-lg"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Próximo
            </Button>
          </div>
        </div>
      </div>

      {/* Registration Sheet (Side Panel) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0 border-0 bg-card">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg font-heading font-bold">
                  {selectedPerson ? selectedPerson.fullName : "Novo Cadastro"}
                </SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedPerson
                    ? "Editar informações"
                    : "Preencha os dados do novo cadastro"}
                </p>
              </div>
              {selectedPerson && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => requestDelete(selectedPerson.id)}
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
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-8">
              {/* Dados Pessoais */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <User className="h-4 w-4" />
                  <h3 className="text-xs font-semibold uppercase tracking-widest">
                    Dados Pessoais
                  </h3>
                </div>

                {/* Photo Upload */}
                {selectedPerson && (
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-high">
                    <div className="relative group">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold overflow-hidden">
                        {selectedPerson.photoUrl ? (
                          <img src={selectedPerson.photoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          getInitials(selectedPerson.fullName)
                        )}
                      </div>
                      <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                        <Camera className="h-5 w-5 text-white" />
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const fd = new FormData();
                            fd.append("photo", file);
                            const result = await uploadPersonPhoto(selectedPerson.id, fd);
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
                      <p className="text-sm font-medium text-foreground">Foto do Membro</p>
                      <p className="text-xs text-muted-foreground">Clique para alterar • JPG, PNG ou WebP • Máx. 2MB</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Nome Completo *
                    </Label>
                    <Input
                      name="fullName"
                      required
                      placeholder="Ex: João da Silva"
                      defaultValue={selectedPerson?.fullName}
                      className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">E-mail</Label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      defaultValue={selectedPerson?.email ?? ""}
                      className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        WhatsApp
                      </Label>
                      <Input
                        name="phone"
                        placeholder="(11) 00000-0000"
                        defaultValue={selectedPerson?.phone ?? ""}
                        onChange={(e) => { e.target.value = maskPhone(e.target.value); }}
                        className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Nascimento
                      </Label>
                      <Input
                        name="birthDate"
                        type="date"
                        defaultValue={formatDateForInput(selectedPerson?.birthDate ?? null)}
                        className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Estado Civil
                      </Label>
                      <Select
                        name="maritalStatus"
                        defaultValue={selectedPerson?.maritalStatus ?? ""}
                      >
                        <SelectTrigger className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-0">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SOLTEIRO">Solteiro(a)</SelectItem>
                          <SelectItem value="CASADO">Casado(a)</SelectItem>
                          <SelectItem value="DIVORCIADO">Divorciado(a)</SelectItem>
                          <SelectItem value="VIUVO">Viúvo(a)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Data Casamento
                      </Label>
                      <Input
                        name="weddingDate"
                        type="date"
                        defaultValue={formatDateForInput(selectedPerson?.weddingDate ?? null)}
                        className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Profissão
                    </Label>
                    <Input
                      name="profession"
                      placeholder="Ex: Engenheiro"
                      defaultValue={selectedPerson?.profession ?? ""}
                      className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Dados Eclesiásticos */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Church className="h-4 w-4" />
                  <h3 className="text-xs font-semibold uppercase tracking-widest">
                    Dados Eclesiásticos
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Tipo</Label>
                      <Select
                        name="personType"
                        defaultValue={selectedPerson?.personType ?? "VISITANTE"}
                      >
                        <SelectTrigger className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBRO">Membro</SelectItem>
                          <SelectItem value="VISITANTE">Visitante</SelectItem>
                          <SelectItem value="CONGREGADO">Congregado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Select
                        name="memberStatus"
                        defaultValue={selectedPerson?.memberStatus ?? "ATIVO"}
                      >
                        <SelectTrigger className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ATIVO">Ativo</SelectItem>
                          <SelectItem value="INATIVO">Inativo</SelectItem>
                          <SelectItem value="TRANSFERIDO">Transferido</SelectItem>
                          <SelectItem value="FALECIDO">Falecido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-surface-high p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Batizado nas Águas?
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Indique se a pessoa já passou pelo batismo
                      </p>
                    </div>
                    <Switch
                      name="isBaptized"
                      defaultChecked={selectedPerson?.isBaptized ?? false}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Data do Batismo
                      </Label>
                      <Input
                        name="baptismDate"
                        type="date"
                        defaultValue={formatDateForInput(selectedPerson?.baptismDate ?? null)}
                        className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Data da Conversão
                      </Label>
                      <Input
                        name="conversionDate"
                        type="date"
                        defaultValue={formatDateForInput(selectedPerson?.conversionDate ?? null)}
                        className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Célula</Label>
                    <Select
                      name="cellId"
                      defaultValue={selectedPerson?.cellId ?? ""}
                    >
                      <SelectTrigger className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-0">
                        <SelectValue placeholder="Selecione uma Célula" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        {cells.map((cell) => (
                          <SelectItem key={cell.id} value={cell.id}>
                            {cell.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <MapPin className="h-4 w-4" />
                  <h3 className="text-xs font-semibold uppercase tracking-widest">
                    Endereço
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">CEP</Label>
                      <Input
                        name="cep"
                        placeholder="00000-000"
                        defaultValue={selectedPerson?.cep ?? ""}
                        onChange={(e) => { e.target.value = maskCep(e.target.value); }}
                        className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Rua</Label>
                      <Input
                        name="street"
                        placeholder="Nome da Rua"
                        defaultValue={selectedPerson?.street ?? ""}
                        className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Número
                      </Label>
                      <Input
                        name="number"
                        placeholder="Nº"
                        defaultValue={selectedPerson?.number ?? ""}
                        className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">
                        Bairro
                      </Label>
                      <Input
                        name="neighborhood"
                        placeholder="Bairro"
                        defaultValue={selectedPerson?.neighborhood ?? ""}
                        className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <Label className="text-xs text-muted-foreground">Observações</Label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Anotações gerais..."
                  defaultValue={selectedPerson?.notes ?? ""}
                  className="mt-1.5 w-full rounded-xl bg-surface-high border-0 p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
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
                  {selectedPerson ? "Salvar Alterações" : "Cadastrar"}
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
        title="Excluir Pessoa"
        description="Esta ação é irreversível. Todos os dados desta pessoa serão permanentemente removidos."
      />
    </div>
  );
}
