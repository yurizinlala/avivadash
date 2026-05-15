"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Award,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldError, MetricCard, SectionHeader } from "@/components/design-system";
import {
  createCertificate,
  deleteCertificate,
  updateCertificate,
} from "@/lib/actions/certificate-actions";
import {
  CERTIFICATE_TEMPLATES,
  getCertificateTemplate,
  getCertificateTitle,
  type CertificateTemplateId,
} from "@/lib/certificates";
import { generateCertificatePDF, type CertificatePDFData } from "@/lib/pdf/certificate-pdf";
import { cn } from "@/lib/utils";
import {
  certificateSchema,
  certificateUpdateSchema,
  type CertificateFormData,
  type CertificateUpdateData,
} from "@/lib/validations/certificate";

interface CertificateRow extends CertificatePDFData {
  personId: string | null;
  createdAt: string;
  updatedAt: string;
  person: {
    id: string;
    fullName: string;
    photoUrl: string | null;
    personType: string;
  } | null;
}

interface CertificatePerson {
  id: string;
  fullName: string;
  phone: string | null;
  cpf: string | null;
  birthDate: Date | null;
  personType: string;
  photoUrl: string | null;
}

interface CertificadosClientProps {
  initialCertificates: CertificateRow[];
  people: CertificatePerson[];
}

type CertificateFormState = {
  type: CertificateTemplateId;
  recipientName: string;
  personId: string;
  issueDate: string;
};

type CertificateEditState = {
  id: string;
  recipientName: string;
  personId: string;
  issueDate: string;
};

const todayKey = () => new Date().toISOString().split("T")[0];

function formatDateForInput(value: string | Date) {
  return new Date(value).toISOString().split("T")[0];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function matchPerson(person: CertificatePerson, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [person.fullName, person.cpf, person.phone]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(normalizedQuery));
}

function PersonAvatar({ person, name }: { person?: CertificatePerson | CertificateRow["person"] | null; name: string }) {
  return (
    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary">
      {person?.photoUrl ? (
        <Image
          src={person.photoUrl}
          alt={name}
          fill
          sizes="36px"
          unoptimized
          className="object-cover"
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

export function CertificadosClient({ initialCertificates, people }: CertificadosClientProps) {
  const router = useRouter();
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [selectedTemplateId, setSelectedTemplateId] =
    React.useState<CertificateTemplateId | null>(null);
  const [historySearch, setHistorySearch] = React.useState("");
  const [historyTypeFilter, setHistoryTypeFilter] = React.useState("todos");
  const [memberSearch, setMemberSearch] = React.useState("");
  const [memberSearchOpen, setMemberSearchOpen] = React.useState(false);
  const [editMemberSearch, setEditMemberSearch] = React.useState("");
  const [editMemberSearchOpen, setEditMemberSearchOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);
  const [formErrors, setFormErrors] = React.useState<Record<string, string[]>>({});
  const [editErrors, setEditErrors] = React.useState<Record<string, string[]>>({});
  const [formData, setFormData] = React.useState<CertificateFormState>({
    type: CERTIFICATE_TEMPLATES[0].id,
    recipientName: "",
    personId: "manual",
    issueDate: todayKey(),
  });
  const [editingCertificate, setEditingCertificate] =
    React.useState<CertificateRow | null>(null);
  const [editFormData, setEditFormData] = React.useState<CertificateEditState>({
    id: "",
    recipientName: "",
    personId: "manual",
    issueDate: todayKey(),
  });

  const selectedTemplate = selectedTemplateId
    ? getCertificateTemplate(selectedTemplateId)
    : null;
  const selectedPerson = people.find((person) => person.id === formData.personId);
  const selectedEditPerson = people.find((person) => person.id === editFormData.personId);

  const filteredPeople = React.useMemo(
    () => people.filter((person) => matchPerson(person, memberSearch)).slice(0, 8),
    [memberSearch, people]
  );

  const filteredEditPeople = React.useMemo(
    () => people.filter((person) => matchPerson(person, editMemberSearch)).slice(0, 8),
    [editMemberSearch, people]
  );

  const filteredCertificates = React.useMemo(() => {
    const normalizedSearch = historySearch.trim().toLowerCase();
    return initialCertificates.filter((certificate) => {
      const title = getCertificateTitle(certificate.type, certificate.title);
      const matchesType =
        historyTypeFilter === "todos" || certificate.type === historyTypeFilter;
      const matchesSearch =
        !normalizedSearch ||
        [certificate.recipientName, title, certificate.person?.fullName]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedSearch));

      return matchesType && matchesSearch;
    });
  }, [historySearch, historyTypeFilter, initialCertificates]);

  const currentMonthCertificateCount = initialCertificates.filter((certificate) => {
    const issueDate = new Date(certificate.issueDate);
    const now = new Date();
    return (
      issueDate.getMonth() === now.getMonth() &&
      issueDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const selectTemplate = (type: CertificateTemplateId) => {
    setSelectedTemplateId(type);
    setFormData((current) => ({ ...current, type }));
    setFormErrors({});
  };

  const selectPerson = (person: CertificatePerson) => {
    setFormData((current) => ({
      ...current,
      personId: person.id,
      recipientName: person.fullName,
    }));
    setMemberSearch(person.fullName);
    setMemberSearchOpen(false);
  };

  const selectEditPerson = (person: CertificatePerson) => {
    setEditFormData((current) => ({
      ...current,
      personId: person.id,
      recipientName: person.fullName,
    }));
    setEditMemberSearch(person.fullName);
    setEditMemberSearchOpen(false);
  };

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedTemplate) {
      toast.error("Selecione um modelo de certificado.");
      return;
    }

    const payload: CertificateFormData = {
      type: selectedTemplate.id,
      recipientName: formData.recipientName,
      personId: formData.personId,
      issueDate: formData.issueDate,
    };

    const parsed = certificateSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setFormErrors(fieldErrors);
      toast.error(Object.values(fieldErrors).flat()[0] || "Revise os campos.");
      return;
    }

    setSaving(true);
    try {
      const result = await createCertificate(payload);
      if (result.success && result.certificate) {
        toast.success("Certificado emitido com sucesso!");
        await generateCertificatePDF(result.certificate);
        setFormData({
          type: selectedTemplate.id,
          recipientName: "",
          personId: "manual",
          issueDate: todayKey(),
        });
        setMemberSearch("");
        setFormErrors({});
        router.refresh();
      } else if (typeof result.error === "object") {
        setFormErrors(result.error as Record<string, string[]>);
        toast.error("Revise os campos do certificado.");
      } else {
        toast.error(result.error || "Erro ao emitir certificado.");
      }
    } catch {
      toast.error("Erro inesperado ao emitir certificado.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(certificate: CertificateRow) {
    setEditingCertificate(certificate);
    setEditFormData({
      id: certificate.id,
      recipientName: certificate.recipientName,
      personId: certificate.personId ?? "manual",
      issueDate: formatDateForInput(certificate.issueDate),
    });
    setEditMemberSearch(certificate.person?.fullName ?? certificate.recipientName);
    setEditErrors({});
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload: CertificateUpdateData = {
      id: editFormData.id,
      recipientName: editFormData.recipientName,
      personId: editFormData.personId,
      issueDate: editFormData.issueDate,
    };

    const parsed = certificateUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setEditErrors(fieldErrors);
      toast.error(Object.values(fieldErrors).flat()[0] || "Revise os campos.");
      return;
    }

    setUpdating(true);
    try {
      const result = await updateCertificate(payload);
      if (result.success) {
        toast.success("Certificado atualizado.");
        setEditingCertificate(null);
        router.refresh();
      } else if (typeof result.error === "object") {
        setEditErrors(result.error as Record<string, string[]>);
        toast.error("Revise os campos do certificado.");
      } else {
        toast.error(result.error || "Erro ao atualizar certificado.");
      }
    } catch {
      toast.error("Erro inesperado ao atualizar certificado.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Excluir este certificado do histórico?");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const result = await deleteCertificate(id);
      if (result.success) {
        toast.success("Certificado excluído.");
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao excluir certificado.");
      }
    } catch {
      toast.error("Erro inesperado ao excluir certificado.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDownload(certificate: CertificateRow) {
    setDownloadingId(certificate.id);
    try {
      await generateCertificatePDF(certificate);
      toast.success("PDF gerado com sucesso.");
    } catch {
      toast.error("Erro ao gerar certificado.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_260px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Buscar por pessoa, tipo ou título..."
            className="h-11 rounded-xl bg-surface-high border-0 pl-10 focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>
        <Select
          value={historyTypeFilter}
          onValueChange={(value) => setHistoryTypeFilter(value ?? "todos")}
        >
          <SelectTrigger className="h-11 w-full rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {CERTIFICATE_TEMPLATES.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="app-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <SectionHeader icon={Award} title="Templates rápidos" />
          <div className="hidden items-center gap-2 sm:flex">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Template anterior"
              onClick={() => carouselRef.current?.scrollBy({ left: -320, behavior: "smooth" })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Próximo template"
              onClick={() => carouselRef.current?.scrollBy({ left: 320, behavior: "smooth" })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={carouselRef}
          className="flex snap-x gap-4 overflow-x-auto pb-2"
        >
          {CERTIFICATE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => selectTemplate(template.id)}
              className={cn(
                "min-w-[260px] snap-start rounded-xl bg-surface-high p-3 text-left transition-colors hover:bg-primary/10",
                selectedTemplateId === template.id && "bg-primary/10 ring-2 ring-primary/15"
              )}
            >
              <div className="relative mb-3 h-28 overflow-hidden rounded-lg bg-background">
                <Image
                  src={template.backgroundPath}
                  alt={template.title}
                  fill
                  sizes="260px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-background/15" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {template.title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {template.shortDescription}
              </p>
              <Badge className="mt-3 rounded-md border-0 bg-background text-[10px] font-medium text-muted-foreground">
                Orientação paisagem
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {selectedTemplate ? (
        <form onSubmit={handleCreate} className="app-card p-6">
          <SectionHeader
            icon={Award}
            title={selectedTemplate.title}
            description={selectedTemplate.shortDescription}
            className="mb-5"
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_220px]">
            <div className="relative">
              <Label className="text-xs text-muted-foreground">Buscar membro</Label>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={memberSearch}
                  onFocus={() => setMemberSearchOpen(true)}
                  onChange={(e) => {
                    setMemberSearch(e.target.value);
                    setMemberSearchOpen(true);
                  }}
                  placeholder="Digite o nome do membro..."
                  className="h-10 rounded-xl bg-surface-high border-0 pl-10 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
              {memberSearchOpen && (
                <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-border bg-popover p-2 shadow-ambient">
                  {filteredPeople.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      Nenhum membro encontrado.
                    </p>
                  ) : (
                    filteredPeople.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectPerson(person)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-high"
                      >
                        <PersonAvatar person={person} name={person.fullName} />
                        <span className="min-w-0 flex-1 truncate">{person.fullName}</span>
                      </button>
                    ))
                  )}
                  <button
                    type="button"
                    className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-primary hover:bg-primary/10"
                    onClick={() => {
                      setFormData((current) => ({ ...current, personId: "manual" }));
                      setMemberSearchOpen(false);
                    }}
                  >
                    Preencher nome manualmente
                  </button>
                </div>
              )}
            </div>

            <div>
              <Label className={cn("text-xs text-muted-foreground", formErrors.recipientName && "text-destructive")}>
                Nome no certificado *
              </Label>
              <Input
                value={formData.recipientName}
                onChange={(e) => {
                  setFormData((current) => ({
                    ...current,
                    recipientName: e.target.value,
                    personId: selectedPerson?.fullName === e.target.value ? current.personId : "manual",
                  }));
                }}
                placeholder="Ex: Maria Souza"
                className={cn(
                  "mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20",
                  formErrors.recipientName && "border border-destructive"
                )}
              />
              <FieldError error={formErrors.recipientName} />
            </div>

            <div>
              <Label className={cn("text-xs text-muted-foreground", formErrors.issueDate && "text-destructive")}>
                Data de emissão *
              </Label>
              <Input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData((current) => ({ ...current, issueDate: e.target.value }))}
                className={cn(
                  "mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20",
                  formErrors.issueDate && "border border-destructive"
                )}
              />
              <FieldError error={formErrors.issueDate} />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-xl border-border"
              onClick={() => {
                setFormData({
                  type: selectedTemplate.id,
                  recipientName: "",
                  personId: "manual",
                  issueDate: todayKey(),
                });
                setMemberSearch("");
                setFormErrors({});
              }}
            >
              Limpar Campos
            </Button>
            <Button type="submit" variant="brand" disabled={saving} className="h-10 flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Emitir Certificado
            </Button>
          </div>
        </form>
      ) : (
        <div className="app-card p-6 text-center">
          <Award className="mx-auto mb-3 h-8 w-8 text-primary/40" />
          <p className="text-sm font-medium text-foreground">Selecione um template.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricCard
          label="Emitidos"
          value={initialCertificates.length}
          icon={ShieldCheck}
          tone="primary"
          helper="Certificados no histórico"
        />
        <MetricCard
          label="Este mês"
          value={currentMonthCertificateCount}
          icon={CalendarCheck}
          tone="success"
          helper="Emissões do mês atual"
        />
      </div>

      <div className="app-card p-5">
        <SectionHeader
          icon={UserCheck}
          title="Emissões recentes"
          description={`${filteredCertificates.length} certificado(s) encontrado(s).`}
          className="mb-4"
        />

        {filteredCertificates.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum certificado encontrado.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredCertificates.map((certificate) => (
              <div
                key={certificate.id}
                className="item-row flex flex-col gap-3 md:flex-row md:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <PersonAvatar person={certificate.person} name={certificate.recipientName} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {certificate.recipientName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {getCertificateTitle(certificate.type, certificate.title)}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground md:w-32">
                  {new Date(certificate.issueDate).toLocaleDateString("pt-BR")}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Baixar certificado"
                    disabled={downloadingId === certificate.id}
                    onClick={() => handleDownload(certificate)}
                  >
                    {downloadingId === certificate.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Editar certificado"
                    onClick={() => startEdit(certificate)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="destructive"
                    aria-label="Excluir certificado"
                    disabled={deletingId === certificate.id}
                    onClick={() => handleDelete(certificate.id)}
                  >
                    {deletingId === certificate.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(editingCertificate)}
        onOpenChange={(open) => {
          if (!open) setEditingCertificate(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar certificado</DialogTitle>
            <DialogDescription>
              {editingCertificate ? getCertificateTitle(editingCertificate.type, editingCertificate.title) : ""}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEdit} className="space-y-4">
            <div className="relative">
              <Label className="text-xs text-muted-foreground">Buscar membro</Label>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={editMemberSearch}
                  onFocus={() => setEditMemberSearchOpen(true)}
                  onChange={(e) => {
                    setEditMemberSearch(e.target.value);
                    setEditMemberSearchOpen(true);
                  }}
                  placeholder="Digite o nome do membro..."
                  className="h-10 rounded-xl bg-surface-high border-0 pl-10 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
              {editMemberSearchOpen && (
                <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-border bg-popover p-2 shadow-ambient">
                  {filteredEditPeople.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      Nenhum membro encontrado.
                    </p>
                  ) : (
                    filteredEditPeople.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectEditPerson(person)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-high"
                      >
                        <PersonAvatar person={person} name={person.fullName} />
                        <span className="min-w-0 flex-1 truncate">{person.fullName}</span>
                      </button>
                    ))
                  )}
                  <button
                    type="button"
                    className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-primary hover:bg-primary/10"
                    onClick={() => {
                      setEditFormData((current) => ({ ...current, personId: "manual" }));
                      setEditMemberSearchOpen(false);
                    }}
                  >
                    Preencher nome manualmente
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px]">
              <div>
                <Label className={cn("text-xs text-muted-foreground", editErrors.recipientName && "text-destructive")}>
                  Nome no certificado *
                </Label>
                <Input
                  value={editFormData.recipientName}
                  onChange={(e) => {
                    setEditFormData((current) => ({
                      ...current,
                      recipientName: e.target.value,
                      personId: selectedEditPerson?.fullName === e.target.value ? current.personId : "manual",
                    }));
                  }}
                  className={cn(
                    "mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20",
                    editErrors.recipientName && "border border-destructive"
                  )}
                />
                <FieldError error={editErrors.recipientName} />
              </div>
              <div>
                <Label className={cn("text-xs text-muted-foreground", editErrors.issueDate && "text-destructive")}>
                  Data de emissão *
                </Label>
                <Input
                  type="date"
                  value={editFormData.issueDate}
                  onChange={(e) => setEditFormData((current) => ({ ...current, issueDate: e.target.value }))}
                  className={cn(
                    "mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20",
                    editErrors.issueDate && "border border-destructive"
                  )}
                />
                <FieldError error={editErrors.issueDate} />
              </div>
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCertificate(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="brand" disabled={updating}>
                {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
