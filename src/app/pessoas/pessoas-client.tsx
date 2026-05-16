"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Users,
  Search,
  Plus,
  MessageSquare,
  User,
  UserPlus,
  Church,
  Baby,
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

import { toast } from "sonner";
import { createPerson, updatePerson, deletePerson } from "@/lib/actions/person-actions";
import {
  ECCLESIASTICAL_ROLES,
  personSchema,
  type PersonFormData,
} from "@/lib/validations/person";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { EmptyState } from "@/components/empty-state";
import { maskPhone, maskCep, maskCpf } from "@/lib/masks";
import { removePersonPhoto, uploadPersonPhoto } from "@/lib/actions/upload-actions";
import { MetricCard, PageHeader } from "@/components/design-system";

type PersonType = "MEMBRO" | "VISITANTE" | "CONGREGADO";
type PersonStatus = "ATIVO" | "INATIVO" | "TRANSFERIDO" | "FALECIDO";
type MaritalStatus = "SOLTEIRO" | "CASADO" | "DIVORCIADO" | "VIUVO";
type EcclesiasticalRole = (typeof ECCLESIASTICAL_ROLES)[number];
type ChildMode = "existing" | "manual";

interface PersonChildFormState {
  key: string;
  childPersonId: string;
  manualName: string;
  manualBirthDate: string;
  search: string;
  mode: ChildMode;
}

interface PersonFormState {
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  maritalStatus: MaritalStatus;
  weddingDate: string;
  personType: PersonType;
  memberStatus: PersonStatus;
  isBaptized: boolean;
  baptismDate: string;
  conversionDate: string;
  ecclesiasticalRole: EcclesiasticalRole;
  churchLocationId: string;
  hasChildren: boolean;
  children: PersonChildFormState[];
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  cellId: string;
  notes: string;
}

interface PersonRow {
  id: string;
  fullName: string;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  birthDate: Date | null;
  maritalStatus: string | null;
  weddingDate: Date | null;
  personType: string;
  memberStatus: string;
  isBaptized: boolean;
  baptismDate: Date | null;
  conversionDate: Date | null;
  ecclesiasticalRole: string;
  churchLocationId: string | null;
  churchLocation: { id: string; name: string; type: string } | null;
  children: PersonChildRow[];
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

interface PersonChildRow {
  id: string;
  childPersonId: string | null;
  manualName: string | null;
  manualBirthDate: Date | null;
  childPerson: {
    id: string;
    fullName: string;
    birthDate: Date | null;
    photoUrl: string | null;
  } | null;
}

interface PersonOption {
  id: string;
  fullName: string;
  birthDate: Date | null;
  photoUrl: string | null;
}

interface ChurchLocationOption {
  id: string;
  name: string;
  type: string;
}

const TYPE_STYLES: Record<PersonType, string> = {
  MEMBRO: "bg-primary/10 text-primary",
  VISITANTE: "bg-gold/15 text-gold-muted dark:text-gold",
  CONGREGADO: "bg-success/10 text-success",
};

const STATUS_STYLES: Record<string, string> = {
  ATIVO: "bg-success/10 text-success",
  INATIVO: "bg-destructive/10 text-destructive",
  TRANSFERIDO: "bg-gold/15 text-gold-muted dark:text-gold",
  FALECIDO: "bg-muted text-muted-foreground",
};

const ECCLESIASTICAL_ROLE_LABELS: Record<EcclesiasticalRole, string> = {
  NENHUM: "Nenhum",
  DIACONO: "DiÃ¡cono",
  DIACONISA: "Diaconisa",
  PRESBITERO: "PresbÃ­tero",
  MISSIONARIO: "MissionÃ¡rio",
  MISSIONARIA: "MissionÃ¡ria",
  PASTOR: "Pastor",
  PASTORA: "Pastora",
  EVANGELISTA: "Evangelista",
  OBREIRO: "Obreiro",
  OBREIRA: "Obreira",
  LIDER_CELULA: "LÃ­der de CÃ©lula",
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
  churchLocations: ChurchLocationOption[];
  people: PersonOption[];
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
  churchLocations,
  people,
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
  const [removingPhoto, setRemovingPhoto] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(
    !!(currentStatus || currentBaptized || currentCell)
  );
  const [openChildKey, setOpenChildKey] = React.useState<string | null>(null);
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

  const createEmptyChild = React.useCallback((): PersonChildFormState => ({
    key: crypto.randomUUID(),
    childPersonId: "",
    manualName: "",
    manualBirthDate: "",
    search: "",
    mode: "manual",
  }), []);

  const mapChildrenToForm = React.useCallback((person: PersonRow | null): PersonChildFormState[] =>
    person?.children?.map((child) => {
      const linkedName = child.childPerson?.fullName ?? "";
      const manualName = child.manualName ?? "";
      const displayName = linkedName || manualName;

      return {
        key: child.id,
        childPersonId: child.childPersonId ?? "",
        manualName,
        manualBirthDate: formatDateForInput(
          child.childPerson?.birthDate ?? child.manualBirthDate ?? null
        ),
        search: displayName,
        mode: child.childPersonId ? "existing" : "manual",
      };
    }) ?? [], []);

  const getInitialFormState = React.useCallback((person: PersonRow | null): PersonFormState => ({
    fullName: person?.fullName || "",
    cpf: person?.cpf || "",
    email: person?.email || "",
    phone: person?.phone || "",
    birthDate: formatDateForInput(person?.birthDate ?? null) || "",
    maritalStatus: (person?.maritalStatus as MaritalStatus | null) || "SOLTEIRO",
    weddingDate: formatDateForInput(person?.weddingDate ?? null) || "",
    personType: (person?.personType as PersonType | null) || "VISITANTE",
    memberStatus: (person?.memberStatus as PersonStatus | null) || "ATIVO",
    isBaptized: person?.isBaptized ?? false,
    baptismDate: formatDateForInput(person?.baptismDate ?? null) || "",
    conversionDate: formatDateForInput(person?.conversionDate ?? null) || "",
    ecclesiasticalRole: (person?.ecclesiasticalRole as EcclesiasticalRole | null) || "NENHUM",
    churchLocationId: person?.churchLocationId || "",
    hasChildren: Boolean(person?.children?.length),
    children: mapChildrenToForm(person),
    cep: person?.cep || "",
    street: person?.street || "",
    number: person?.number || "",
    complement: person?.complement || "",
    neighborhood: person?.neighborhood || "",
    city: person?.city || "",
    state: person?.state || "",
    cellId: person?.cellId || "",
    notes: person?.notes || "",
  }), [mapChildrenToForm]);

  const [formData, setFormData] = React.useState<PersonFormState>(
    getInitialFormState(selectedPerson)
  );
  const [formErrors, setFormErrors] = React.useState<Record<string, string[]>>({});

  React.useEffect(() => {
    setFormData(getInitialFormState(selectedPerson));
    setFormErrors({});
    setOpenChildKey(null);
  }, [getInitialFormState, selectedPerson]);

  const updateField = <K extends keyof PersonFormState>(
    field: K,
    value: PersonFormState[K]
  ) => {
    let newData: PersonFormState = { ...formData, [field]: value };

    if (field === "personType" && value === "VISITANTE") {
      newData = { ...newData, ecclesiasticalRole: "NENHUM", churchLocationId: "" };
    }

    if (field === "isBaptized" && value === false) {
      newData = { ...newData, ecclesiasticalRole: "NENHUM", baptismDate: "" };
    }

    if (field === "hasChildren") {
      newData = value
        ? {
            ...newData,
            children: newData.children.length ? newData.children : [createEmptyChild()],
          }
        : { ...newData, children: [] };
    }

    setFormData(newData);
    
    // Only parse if form is actively being edited
    const parsed = personSchema.safeParse(newData);
    if (!parsed.success) {
      setFormErrors(parsed.error.flatten().fieldErrors);
    } else {
      setFormErrors({});
    }
  };

  const getChildSuggestions = (child: PersonChildFormState) => {
    const query = child.search.trim().toLowerCase();
    if (query.length < 2) return [];

    const selectedIds = new Set(
      formData.children
        .filter((item) => item.key !== child.key)
        .map((item) => item.childPersonId)
        .filter(Boolean)
    );

    return people
      .filter((person) => {
        if (selectedPerson?.id === person.id) return false;
        if (selectedIds.has(person.id)) return false;
        return person.fullName.toLowerCase().includes(query);
      })
      .slice(0, 5);
  };

  const updateChild = (
    key: string,
    patch: Partial<PersonChildFormState>
  ) => {
    const children = formData.children.map((child) =>
      child.key === key ? { ...child, ...patch } : child
    );
    updateField("children", children);
  };

  const selectChildPerson = (key: string, person: PersonOption) => {
    updateChild(key, {
      childPersonId: person.id,
      manualName: "",
      manualBirthDate: formatDateForInput(person.birthDate),
      search: person.fullName,
      mode: "existing",
    });
    setOpenChildKey(null);
  };

  const addChild = () => {
    const children = [...formData.children, createEmptyChild()];
    setFormData((current) => ({ ...current, hasChildren: true, children }));
  };

  const removeChild = (key: string) => {
    const children = formData.children.filter((child) => child.key !== key);
    setFormData((current) => ({
      ...current,
      hasChildren: children.length > 0,
      children,
    }));
    setOpenChildKey(null);
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const masked = maskCep(raw);
    let newData = { ...formData, cep: masked };
    
    const unmasked = masked.replace(/\D/g, '');
    if (unmasked.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${unmasked}/json/`);
        const data = await res.json();
        if (!data.erro) {
          newData = {
            ...newData,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || ''
          };
        }
      } catch (err) {
        console.error('Error fetching CEP:', err);
      }
    }
    
    setFormData(newData);
    const parsed = personSchema.safeParse(newData);
    setFormErrors(parsed.success ? {} : parsed.error.flatten().fieldErrors);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const data: PersonFormData = {
      fullName: formData.fullName,
      cpf: formData.cpf,
      email: formData.email,
      phone: formData.phone,
      birthDate: formData.birthDate,
      maritalStatus: formData.maritalStatus || undefined,
      weddingDate: formData.weddingDate,
      personType: formData.personType || "VISITANTE",
      memberStatus: formData.memberStatus || "ATIVO",
      isBaptized: formData.isBaptized,
      baptismDate: formData.baptismDate,
      conversionDate: formData.conversionDate,
      ecclesiasticalRole: formData.ecclesiasticalRole,
      churchLocationId: formData.churchLocationId,
      cep: formData.cep,
      street: formData.street,
      number: formData.number,
      complement: formData.complement,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
      cellId: formData.cellId === "none" ? "" : formData.cellId,
      notes: formData.notes,
      children: formData.hasChildren
        ? formData.children
            .filter((child) =>
              Boolean(child.childPersonId || child.manualName || child.manualBirthDate)
            )
            .map((child) => ({
              childPersonId: child.childPersonId,
              manualName: child.childPersonId ? "" : child.manualName,
              manualBirthDate: child.childPersonId ? "" : child.manualBirthDate,
            }))
        : [],
    };

    const parsed = personSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0];
      setFormErrors(fieldErrors);
      toast.error(firstError || "Erro de validação, verifique os campos.");
      setSaving(false);
      return;
    }

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
        if (typeof result.error === "object") {
          setFormErrors(result.error as Record<string, string[]>);
          toast.error("Erro de validação. Verifique os campos.");
        } else {
          toast.error(result.error ?? "Erro de validação. Verifique os campos.");
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

  async function handleRemovePhoto() {
    if (!selectedPerson?.photoUrl || removingPhoto) return;

    setRemovingPhoto(true);
    try {
      const result = await removePersonPhoto(selectedPerson.id);
      if (result.success) {
        toast.success("Foto excluída permanentemente.");
        setSelectedPerson((current) =>
          current ? { ...current, photoUrl: null } : current
        );
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao remover a foto.");
      }
    } catch {
      toast.error("Erro inesperado ao remover a foto.");
    } finally {
      setRemovingPhoto(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Membros e Visitantes"
        title="Gestão de Pessoas"
        description="Diretório e CRM da comunidade com cadastro, acompanhamento e filtros pastorais."
        actions={(
          <Button
            variant="brand"
            onClick={() => {
              setSelectedPerson(null);
              setSheetOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo Cadastro
          </Button>
        )}
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Comunidade total"
          value={stats.total.toLocaleString("pt-BR")}
          icon={Users}
          tone="primary"
          helper="Todos os cadastros ativos no diretório"
        />
        <MetricCard
          label="Membros"
          value={stats.membros}
          icon={Church}
          tone="gold"
          helper="Pessoas integradas à membresia"
        />
        <MetricCard
          label="Visitantes"
          value={stats.visitantes}
          icon={UserPlus}
          tone="success"
          helper="Pessoas em acompanhamento"
        />
        <MetricCard
          label="Congregados"
          value={stats.congregados}
          icon={User}
          tone="info"
          helper="Participantes recorrentes"
        />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange} className="w-full sm:w-auto"
        >
          <TabsList className="bg-surface-high rounded-xl h-10">
            <TabsTrigger
              value="todos" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs"
            >
              Todos
            </TabsTrigger>
            <TabsTrigger
              value="membros" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs"
            >
              Membros
            </TabsTrigger>
            <TabsTrigger
              value="visitantes" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs"
            >
              Visitantes
            </TabsTrigger>
            <TabsTrigger
              value="congregados" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs"
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
              onChange={(e) => handleSearch(e.target.value)} className="pl-9 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
          <Button
            variant={hasActiveFilters ? "brand" : "outline"}
            size="sm" className="h-10 shrink-0 gap-2 px-4"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                {[currentStatus, currentBaptized, currentCell].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {filtersOpen && (
        <div className="app-card p-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Filtros Avançados
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center gap-1"
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
                  <SelectValue>
                    {currentStatus === "ATIVO" ? "Ativo" :
                     currentStatus === "INATIVO" ? "Inativo" :
                     currentStatus === "TRANSFERIDO" ? "Transferido" :
                     currentStatus === "FALECIDO" ? "Falecido" :
                     "Todos os status"}
                  </SelectValue>
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
                  <SelectValue>
                    {currentBaptized === "yes" ? "Batizados" :
                     currentBaptized === "no" ? "Não batizados" :
                     "Todos"}
                  </SelectValue>
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
                  <SelectValue>
                    {currentCell && currentCell !== "all" && currentCell !== "none"
                      ? cells.find(c => c.id === currentCell)?.name || "Célula"
                      : currentCell === "none"
                      ? "Sem célula"
                      : "Todas as células"}
                  </SelectValue>
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
      <div className="app-card overflow-hidden">
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
                key={person.id} className="group grid grid-cols-1 md:grid-cols-[1fr_120px_150px_140px_100px_80px] gap-2 md:gap-4 items-center px-5 py-3.5 hover:bg-surface-low/50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedPerson(person);
                  setSheetOpen(true);
                }}
              >
                {/* Name */}
                <div className="flex items-center gap-3">
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold overflow-hidden">
                    {person.photoUrl ? (
                      <Image
                        src={person.photoUrl}
                        alt={person.fullName}
                        fill
                        sizes="36px"
                        unoptimized className="object-cover"
                      />
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
                    variant="secondary" className={cn(
                      "rounded-md text-xs font-semibold capitalize border-0",
                      TYPE_STYLES[person.personType as PersonType] ?? ""
                    )}
                  >
                    {person.personType.toLowerCase()}
                  </Badge>
                </div>

                {/* WhatsApp */}
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
                    variant="secondary" className={cn(
                      "rounded-md text-xs font-semibold capitalize border-0",
                      STATUS_STYLES[person.memberStatus] ?? ""
                    )}
                  >
                    {person.memberStatus.toLowerCase()}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="hidden md:flex items-center justify-end gap-1">
                  {person.phone && (
                    <button className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-success/10 hover:text-success transition-colors"
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
              size="sm" className="h-7 px-2 text-xs rounded-lg"
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
                  size="sm" className={cn(
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
              size="sm" className="h-7 px-2 text-xs rounded-lg"
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
        <SheetContent className="w-full sm:max-w-lg p-0 border-0 bg-card flex flex-col h-full">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
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
                  variant="destructive"
                  size="icon" className="h-8 w-8"
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

          <div className="flex-1 overflow-y-auto">
            <form id="pessoa-form" onSubmit={handleSubmit} className="px-6 py-6 space-y-8">
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
                      <div className="relative h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold overflow-hidden">
                        {selectedPerson.photoUrl ? (
                          <Image
                            src={selectedPerson.photoUrl}
                            alt=""
                            fill
                            sizes="64px"
                            unoptimized className="object-cover"
                          />
                        ) : (
                          getInitials(selectedPerson.fullName)
                        )}
                      </div>
                      <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                        <Camera className="h-5 w-5 text-white" />
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp" className="sr-only"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const fd = new FormData();
                            fd.append("photo", file);
                            const result = await uploadPersonPhoto(selectedPerson.id, fd);
                            if (result.success) {
                              toast.success("Foto atualizada!");
                              setSelectedPerson((current) =>
                                current
                                  ? { ...current, photoUrl: result.photoUrl ?? current.photoUrl }
                                  : current
                              );
                              router.refresh();
                            } else {
                              toast.error(result.error || "Erro ao enviar foto.");
                            }
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">Foto do Membro</p>
                      <p className="text-xs text-muted-foreground">Clique para alterar • JPG, PNG ou WebP • Máx. 2MB</p>
                      {selectedPerson.photoUrl && (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="mt-3 gap-2"
                          disabled={removingPhoto}
                          onClick={handleRemovePhoto}
                        >
                          {removingPhoto ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Excluir foto
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label className={cn("text-xs text-muted-foreground", formErrors.fullName && "text-destructive")}>
                      Nome Completo *
                    </Label>
                    <Input
                      name="fullName"
                      required
                      placeholder="Ex: João da Silva"
                      value={formData.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.fullName && "border border-destructive focus-visible:ring-destructive/20")}
                    />
                    {formErrors.fullName && <p className="text-destructive text-xs mt-1">{formErrors.fullName[0]}</p>}
                  </div>

                  <div>
                    <Label className={cn("text-xs text-muted-foreground", formErrors.cpf && "text-destructive")}>
                      CPF
                    </Label>
                    <Input
                      name="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => updateField('cpf', maskCpf(e.target.value))} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.cpf && "border border-destructive focus-visible:ring-destructive/20")}
                    />
                    {formErrors.cpf && <p className="text-destructive text-xs mt-1">{formErrors.cpf[0]}</p>}
                  </div>

                  <div>
                    <Label className={cn("text-xs text-muted-foreground", formErrors.email && "text-destructive")}>E-mail</Label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.email && "border border-destructive focus-visible:ring-destructive/20")}
                    />
                    {formErrors.email && <p className="text-destructive text-xs mt-1">{formErrors.email[0]}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className={cn("text-xs text-muted-foreground", formErrors.phone && "text-destructive")}>
                        WhatsApp
                      </Label>
                      <Input
                        name="phone"
                        placeholder="(11) 00000-0000"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', maskPhone(e.target.value))} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.phone && "border border-destructive focus-visible:ring-destructive/20")}
                      />
                    </div>
                    <div>
                      <Label className={cn("text-xs text-muted-foreground", formErrors.birthDate && "text-destructive")}>
                        Nascimento
                      </Label>
                      <Input
                        name="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => updateField('birthDate', e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.birthDate && "border border-destructive focus-visible:ring-destructive/20")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className={cn("text-xs text-muted-foreground", formErrors.maritalStatus && "text-destructive")}>
                        Estado Civil
                      </Label>
                      <Select
                        name="maritalStatus"
                        value={formData.maritalStatus}
                        onValueChange={(v) => {
                          const maritalStatus = (v ?? "SOLTEIRO") as MaritalStatus;
                          const newData = { ...formData, maritalStatus };
                          if (maritalStatus === 'SOLTEIRO') newData.weddingDate = "";
                          setFormData(newData);
                          // trigger validation
                          const parsed = personSchema.safeParse(newData);
                          setFormErrors(parsed.success ? {} : parsed.error.flatten().fieldErrors);
                        }}
                      >
                        <SelectTrigger className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-0", formErrors.maritalStatus && "border border-destructive")}>
                          <SelectValue placeholder="Selecione">
                            {formData.maritalStatus === "SOLTEIRO" && "Solteiro(a)"}
                            {formData.maritalStatus === "CASADO" && "Casado(a)"}
                            {formData.maritalStatus === "DIVORCIADO" && "Divorciado(a)"}
                            {formData.maritalStatus === "VIUVO" && "Viúvo(a)"}
                          </SelectValue>
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
                      <Label className={cn("text-xs text-muted-foreground", formErrors.weddingDate && "text-destructive")}>
                        Data Casamento
                      </Label>
                      <Input
                        name="weddingDate"
                        type="date"
                        disabled={formData.maritalStatus === 'SOLTEIRO'}
                        value={formData.weddingDate}
                        onChange={(e) => updateField('weddingDate', e.target.value)} className={cn(
                          "mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", 
                          formData.maritalStatus === 'SOLTEIRO' && "opacity-50 cursor-not-allowed",
                          formErrors.weddingDate && "border border-destructive focus-visible:ring-destructive/20"
                        )}
                      />
                      {formErrors.weddingDate && <p className="text-destructive text-xs mt-1">{formErrors.weddingDate[0]}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Baby className="h-4 w-4" />
                  <h3 className="text-xs font-semibold uppercase tracking-widest">
                    Filhos
                  </h3>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-surface-high p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Possui filhos?</p>
                    <p className="text-xs text-muted-foreground">
                      Vincule filhos cadastrados ou informe nome e nascimento manualmente.
                    </p>
                  </div>
                  <Switch
                    checked={formData.hasChildren}
                    onCheckedChange={(value) => updateField("hasChildren", value)}
                  />
                </div>

                {formData.hasChildren && (
                  <div className="space-y-3">
                    {formData.children.map((child, index) => {
                      const suggestions = getChildSuggestions(child);
                      return (
                        <div key={child.key} className="rounded-xl bg-surface-high p-3">
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_170px_auto] md:items-end">
                            <div className="relative">
                              <Label className="text-xs text-muted-foreground">
                                Filho {index + 1}
                              </Label>
                              <div className="relative mt-1.5">
                                <Input
                                  value={child.search}
                                  placeholder="Busque ou digite o nome..."
                                  onFocus={() => setOpenChildKey(child.key)}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    updateChild(child.key, {
                                      search: value,
                                      manualName: value,
                                      childPersonId: "",
                                      mode: "manual",
                                    });
                                    setOpenChildKey(child.key);
                                  }}
                                  className="h-10 rounded-xl bg-background border-0 pl-10 focus-visible:ring-2 focus-visible:ring-primary/20"
                                />
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              </div>

                              {openChildKey === child.key && suggestions.length > 0 && (
                                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                                  {suggestions.map((person) => (
                                    <button
                                      key={person.id}
                                      type="button"
                                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-high"
                                      onMouseDown={(event) => event.preventDefault()}
                                      onClick={() => selectChildPerson(child.key, person)}
                                    >
                                      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                        {person.photoUrl ? (
                                          <Image
                                            src={person.photoUrl}
                                            alt=""
                                            fill
                                            sizes="32px"
                                            unoptimized
                                            className="object-cover"
                                          />
                                        ) : (
                                          getInitials(person.fullName)
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground">
                                          {person.fullName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Pessoa cadastrada
                                        </p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Nascimento
                              </Label>
                              <Input
                                type="date"
                                value={child.manualBirthDate}
                                disabled={Boolean(child.childPersonId)}
                                onChange={(e) =>
                                  updateChild(child.key, { manualBirthDate: e.target.value })
                                }
                                className={cn(
                                  "mt-1.5 h-10 rounded-xl bg-background border-0 focus-visible:ring-2 focus-visible:ring-primary/20",
                                  child.childPersonId && "opacity-60"
                                )}
                              />
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Remover filho"
                              onClick={() => removeChild(child.key)}
                              className="h-10 w-10 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {formErrors.children && (
                      <p className="text-xs text-destructive">{formErrors.children[0]}</p>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addChild}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar filho
                    </Button>
                  </div>
                )}
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
                      <Label className={cn("text-xs text-muted-foreground", formErrors.personType && "text-destructive")}>Tipo</Label>
                      <Select
                        name="personType"
                        value={formData.personType}
                        onValueChange={(v) => updateField('personType', (v ?? "VISITANTE") as PersonType)}
                      >
                        <SelectTrigger className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-0", formErrors.personType && "border border-destructive")}>
                          <SelectValue>
                            {formData.personType === "MEMBRO" && "Membro"}
                            {formData.personType === "VISITANTE" && "Visitante"}
                            {formData.personType === "CONGREGADO" && "Congregado"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBRO">Membro</SelectItem>
                          <SelectItem value="VISITANTE">Visitante</SelectItem>
                          <SelectItem value="CONGREGADO">Congregado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className={cn("text-xs text-muted-foreground", formErrors.memberStatus && "text-destructive")}>Status</Label>
                      <Select
                        name="memberStatus"
                        value={formData.memberStatus}
                        onValueChange={(v) => updateField('memberStatus', (v ?? "ATIVO") as PersonStatus)}
                      >
                        <SelectTrigger className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-0", formErrors.memberStatus && "border border-destructive")}>
                          <SelectValue>
                            {formData.memberStatus === "ATIVO" && "Ativo"}
                            {formData.memberStatus === "INATIVO" && "Inativo"}
                            {formData.memberStatus === "TRANSFERIDO" && "Transferido"}
                            {formData.memberStatus === "FALECIDO" && "Falecido"}
                          </SelectValue>
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
                      checked={formData.isBaptized}
                      onCheckedChange={(v) => updateField('isBaptized', v)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className={cn("text-xs text-muted-foreground", formErrors.baptismDate && "text-destructive")}>
                        Data do Batismo
                      </Label>
                      <Input
                        name="baptismDate"
                        type="date"
                        value={formData.baptismDate}
                        onChange={(e) => updateField('baptismDate', e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.baptismDate && "border border-destructive focus-visible:ring-destructive/20")}
                      />
                      {formErrors.baptismDate && <p className="text-destructive text-xs mt-1">{formErrors.baptismDate[0]}</p>}
                    </div>
                    <div>
                      <Label className={cn("text-xs text-muted-foreground", formErrors.conversionDate && "text-destructive")}>
                        Data da Conversão
                      </Label>
                      <Input
                        name="conversionDate"
                        type="date"
                        value={formData.conversionDate}
                        onChange={(e) => updateField('conversionDate', e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.conversionDate && "border border-destructive focus-visible:ring-destructive/20")}
                      />
                      {formErrors.conversionDate && <p className="text-destructive text-xs mt-1">{formErrors.conversionDate[0]}</p>}
                    </div>
                  </div>


                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label className={cn("text-xs text-muted-foreground", formErrors.ecclesiasticalRole && "text-destructive")}>Cargo Eclesiástico</Label>
                      <Select
                        name="ecclesiasticalRole"
                        value={formData.ecclesiasticalRole}
                        onValueChange={(v) => updateField('ecclesiasticalRole', (v ?? "NENHUM") as EcclesiasticalRole)}
                        disabled={!formData.isBaptized || formData.personType === "VISITANTE"}
                      >
                        <SelectTrigger className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-0", formErrors.ecclesiasticalRole && "border border-destructive")}>
                          <SelectValue>
                            {ECCLESIASTICAL_ROLE_LABELS[formData.ecclesiasticalRole]}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {ECCLESIASTICAL_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {ECCLESIASTICAL_ROLE_LABELS[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.ecclesiasticalRole && <p className="text-destructive text-xs mt-1">{formErrors.ecclesiasticalRole[0]}</p>}
                    </div>

                    <div>
                      <Label className={cn("text-xs text-muted-foreground", formErrors.churchLocationId && "text-destructive")}>Igreja</Label>
                      <Select
                        name="churchLocationId"
                        value={formData.churchLocationId || "none"}
                        onValueChange={(v) => updateField('churchLocationId', v === "none" ? "" : v ?? "")}
                      >
                        <SelectTrigger className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-0", formErrors.churchLocationId && "border border-destructive")}>
                          <SelectValue placeholder="Selecione uma igreja">
                            {formData.churchLocationId
                              ? churchLocations.find((location) => location.id === formData.churchLocationId)?.name
                              : "Nenhuma"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {churchLocations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.type === "SEDE" ? "Sede" : "Congregação"} - {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.churchLocationId && <p className="text-destructive text-xs mt-1">{formErrors.churchLocationId[0]}</p>}
                    </div>
                  </div>
                  <div>
                    <Label className={cn("text-xs text-muted-foreground", formErrors.cellId && "text-destructive")}>Célula</Label>
                    <Select
                      name="cellId"
                      value={formData.cellId}
                      onValueChange={(v) => updateField('cellId', v === "none" ? "" : v ?? "")}
                    >
                      <SelectTrigger className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-0", formErrors.cellId && "border border-destructive")}>
                        <SelectValue placeholder="Selecione uma Célula">
                          {formData.cellId ? cells.find(c => c.id === formData.cellId)?.name : "Nenhuma"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
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
                      <Label className={cn("text-xs text-muted-foreground", formErrors.cep && "text-destructive")}>CEP</Label>
                      <Input
                        name="cep"
                        placeholder="00000-000"
                        value={formData.cep}
                        onChange={handleCepChange} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.cep && "border border-destructive focus-visible:ring-destructive/20")}
                      />
                      {formErrors.cep && <p className="text-destructive text-xs mt-1">{formErrors.cep[0]}</p>}
                    </div>
                    <div className="col-span-2">
                      <Label className={cn("text-xs text-muted-foreground", formErrors.street && "text-destructive")}>Rua</Label>
                      <Input
                        name="street"
                        placeholder="Nome da Rua"
                        value={formData.street}
                        onChange={(e) => updateField('street', e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.street && "border border-destructive focus-visible:ring-destructive/20")}
                      />
                      {formErrors.street && <p className="text-destructive text-xs mt-1">{formErrors.street[0]}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className={cn("text-xs text-muted-foreground", formErrors.number && "text-destructive")}>
                        Número
                      </Label>
                      <Input
                        name="number"
                        placeholder="Nº"
                        value={formData.number}
                        onChange={(e) => updateField('number', e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.number && "border border-destructive focus-visible:ring-destructive/20")}
                      />
                      {formErrors.number && <p className="text-destructive text-xs mt-1">{formErrors.number[0]}</p>}
                    </div>
                    <div className="col-span-2">
                      <Label className={cn("text-xs text-muted-foreground", formErrors.neighborhood && "text-destructive")}>
                        Bairro
                      </Label>
                      <Input
                        name="neighborhood"
                        placeholder="Bairro"
                        value={formData.neighborhood}
                        onChange={(e) => updateField('neighborhood', e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.neighborhood && "border border-destructive focus-visible:ring-destructive/20")}
                      />
                      {formErrors.neighborhood && <p className="text-destructive text-xs mt-1">{formErrors.neighborhood[0]}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label className={cn("text-xs text-muted-foreground", formErrors.city && "text-destructive")}>
                        Cidade
                      </Label>
                      <Input
                        name="city"
                        placeholder="Cidade"
                        value={formData.city}
                        onChange={(e) => updateField('city', e.target.value)} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20", formErrors.city && "border border-destructive focus-visible:ring-destructive/20")}
                      />
                      {formErrors.city && <p className="text-destructive text-xs mt-1">{formErrors.city[0]}</p>}
                    </div>
                    <div>
                      <Label className={cn("text-xs text-muted-foreground", formErrors.state && "text-destructive")}>
                        UF
                      </Label>
                      <Input
                        name="state"
                        placeholder="UF"
                        maxLength={2}
                        value={formData.state}
                        onChange={(e) => updateField('state', e.target.value.toUpperCase())} className={cn("mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20 uppercase", formErrors.state && "border border-destructive focus-visible:ring-destructive/20")}
                      />
                      {formErrors.state && <p className="text-destructive text-xs mt-1">{formErrors.state[0]}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <Label className={cn("text-xs text-muted-foreground", formErrors.notes && "text-destructive")}>Observações</Label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Anotações gerais..."
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)} className={cn("mt-1.5 w-full rounded-xl bg-surface-high border-0 p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 resize-none", formErrors.notes && "border border-destructive")}
                />
                {formErrors.notes && <p className="text-destructive text-xs mt-1">{formErrors.notes[0]}</p>}
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
              form="pessoa-form"
              variant="brand"
              disabled={saving} className="h-11 flex-1"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {selectedPerson ? "Salvar Alterações" : "Cadastrar"}
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
        title="Excluir Pessoa"
        description="Esta ação é irreversível. Todos os dados desta pessoa serão permanentemente removidos."
      />
    </div>
  );
}

