"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Network, Plus, MapPin, Clock, ChevronRight, Search, Filter,
  Loader2, Trash2, Users, Map,
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
import { toast } from "sonner";
import { createCell, updateCell, deleteCell } from "@/lib/actions/cell-actions";
import type { CellFormData } from "@/lib/validations/cell";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { EmptyState } from "@/components/empty-state";
import { maskPhone } from "@/lib/masks";

interface CellRow {
  id: string;
  name: string;
  leaderName: string;
  leaderPhone: string | null;
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
  "from-primary/80 to-primary/40",
  "from-gold/60 to-gold/30",
  "from-slate-500/60 to-slate-400/30",
  "from-primary/70 to-primary/30",
  "from-emerald-500/60 to-emerald-400/30",
  "from-violet-500/60 to-violet-400/30",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface CelulasClientProps {
  initialCells: CellRow[];
  stats: {
    totalCells: number;
    activeCells: number;
    totalParticipants: number;
    avgPerCell: number;
  };
}

export function CelulasClient({ initialCells, stats }: CelulasClientProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [selectedCell, setSelectedCell] = React.useState<CellRow | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

  const filtered = initialCells.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.leaderName.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData(e.currentTarget);
    const data: CellFormData = {
      name: fd.get("name") as string,
      leaderName: fd.get("leaderName") as string,
      leaderPhone: fd.get("leaderPhone") as string,
      address: fd.get("address") as string,
      dayOfWeek: fd.get("dayOfWeek") as string,
      time: fd.get("time") as string,
      isActive: fd.get("isActive") === "on",
    };

    try {
      const result = selectedCell
        ? await updateCell(selectedCell.id, data)
        : await createCell(data);

      if (result.success) {
        toast.success(
          selectedCell ? "Célula atualizada com sucesso!" : "Célula cadastrada com sucesso!"
        );
        setSheetOpen(false);
        setSelectedCell(null);
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
      const result = await deleteCell(pendingDeleteId);
      if (result.success) {
        toast.success("Célula excluída com sucesso!");
        setSheetOpen(false);
        setSelectedCell(null);
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Gestão de Células
          </p>
          <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">
            Pequenos Grupos
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/celulas/mapa"
            className="inline-flex items-center gap-2 rounded-xl bg-surface-high px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-lowest transition-colors border border-border"
          >
            <Map className="h-4 w-4" />
            Ver Mapa
          </Link>
          <Button
            onClick={() => {
              setSelectedCell(null);
              setSheetOpen(true);
            }}
            className="gradient-primary text-white rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Célula
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Células Ativas", value: String(stats.activeCells), accent: true },
          {
            label: "Participantes",
            value: String(stats.totalParticipants),
            sub: `Média de ${stats.avgPerCell}/célula`,
          },
          { label: "Total de Células", value: String(stats.totalCells), sub: null },
          {
            label: "Média por Célula",
            value: String(stats.avgPerCell),
            sub: "Participantes ativos",
          },
        ].map((s, i) => (
          <div key={i} className="rounded-xl bg-card p-5 shadow-ambient">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {s.label}
            </p>
            <p
              className={cn(
                "text-3xl font-heading font-bold mt-1",
                s.accent ? "text-primary" : "text-foreground"
              )}
            >
              {s.value}
            </p>
            {s.sub && (
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar célula ou líder..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      {/* Cell Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((cell, index) => (
          <div
            key={cell.id}
            className={cn(
              "group rounded-xl bg-card shadow-ambient overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer",
              !cell.isActive && "opacity-60"
            )}
            onClick={() => {
              setSelectedCell(cell);
              setSheetOpen(true);
            }}
          >
            {/* Cover Image Area */}
            <div
              className={cn(
                "relative h-32 bg-gradient-to-br",
                GRADIENT_COLORS[index % GRADIENT_COLORS.length]
              )}
            >
              <div className="absolute inset-0 bg-black/20" />
              {!cell.isActive && (
                <Badge className="absolute top-3 left-3 rounded-md text-[0.6rem] font-semibold uppercase border-0 bg-red-500/90 text-white">
                  INATIVA
                </Badge>
              )}
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-base font-heading font-bold text-foreground">
                  {cell.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Líder: {cell.leaderName}
                </p>
              </div>

              <div className="space-y-1.5">
                {cell.dayOfWeek && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                    <span>
                      {cell.dayOfWeek}
                      {cell.time ? `, ${cell.time}` : ""}
                    </span>
                  </div>
                )}
                {cell.address && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/60" />
                    <span>{cell.address}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    {cell.members.slice(0, 3).map((m) => (
                      <div
                        key={m.id}
                        className="h-7 w-7 rounded-full bg-primary/10 text-primary text-[0.55rem] font-semibold flex items-center justify-center ring-2 ring-card"
                      >
                        {getInitials(m.fullName)}
                      </div>
                    ))}
                  </div>
                  {cell._count.members > 3 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      +{cell._count.members - 3}
                    </span>
                  )}
                  {cell._count.members === 0 && (
                    <span className="text-xs text-muted-foreground">
                      Sem membros
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                  <Users className="h-3 w-3" /> {cell._count.members}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State Card */}
        <div
          onClick={() => {
            setSelectedCell(null);
            setSheetOpen(true);
          }}
          className="rounded-xl border-2 border-dashed border-border bg-card/50 p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[280px] cursor-pointer hover:border-primary/40 transition-colors"
        >
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Network className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-heading font-semibold text-foreground">
              Novos Começos
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Inicie uma nova célula para expandir o alcance da comunidade.
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Cadastrar Célula
          </Button>
        </div>
      </div>

      {/* Sheet for Create/Edit */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md p-0 border-0 bg-card">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg font-heading font-bold">
                  {selectedCell ? selectedCell.name : "Nova Célula"}
                </SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedCell
                    ? "Editar informações da célula"
                    : "Preencha os dados da nova célula"}
                </p>
              </div>
              {selectedCell && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => requestDelete(selectedCell.id)}
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
                <Label className="text-xs text-muted-foreground">
                  Nome da Célula *
                </Label>
                <Input
                  name="name"
                  required
                  placeholder="Ex: Célula Ágape"
                  defaultValue={selectedCell?.name}
                  className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  Nome do Líder *
                </Label>
                <Input
                  name="leaderName"
                  required
                  placeholder="Ex: Ricardo & Ana Silva"
                  defaultValue={selectedCell?.leaderName}
                  className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  Telefone do Líder
                </Label>
                <Input
                  name="leaderPhone"
                  placeholder="(11) 00000-0000"
                  defaultValue={selectedCell?.leaderPhone ?? ""}
                  onChange={(e) => { e.target.value = maskPhone(e.target.value); }}
                  className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Endereço</Label>
                <Input
                  name="address"
                  placeholder="Rua, número — Bairro"
                  defaultValue={selectedCell?.address ?? ""}
                  className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Dia da Semana
                  </Label>
                  <Input
                    name="dayOfWeek"
                    placeholder="Ex: Quartas-feiras"
                    defaultValue={selectedCell?.dayOfWeek ?? ""}
                    className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Horário</Label>
                  <Input
                    name="time"
                    placeholder="Ex: 20:00"
                    defaultValue={selectedCell?.time ?? ""}
                    className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-surface-high p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Célula Ativa?</p>
                  <p className="text-xs text-muted-foreground">
                    Células inativas ficam ocultas na listagem padrão
                  </p>
                </div>
                <Switch
                  name="isActive"
                  defaultChecked={selectedCell?.isActive ?? true}
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
                  {selectedCell ? "Salvar Alterações" : "Cadastrar"}
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
        title="Excluir Célula"
        description="Esta ação é irreversível. Os membros vinculados serão desassociados desta célula."
      />
    </div>
  );
}
