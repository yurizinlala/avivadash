"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  Cake,
  CalendarDays,
  CheckCircle2,
  Database,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  MapPin,
  Plus,
  Save,
  Shield,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  createChurchLocation,
  deleteChurchLocation,
  updateChurchLocation,
} from "@/lib/actions/church-location-actions";
import { changePassword, updateProfile } from "@/lib/actions/settings-actions";
import { updateNotificationSettings } from "@/lib/actions/notification-settings-actions";
import { FieldError, PageHeader } from "@/components/design-system";
import { maskCep } from "@/lib/masks";
import {
  churchLocationSchema,
  type ChurchLocationFormData,
} from "@/lib/validations/church-location";
import type { NotificationSettingsDto } from "@/lib/notification-settings-service";
import type { NotificationSettingsFormData } from "@/lib/validations/notification-settings";

interface ConfiguracoesClientProps {
  user: {
    userId: string;
    email: string;
    name: string;
    role: string;
  } | null;
  churchLocations: ChurchLocationRow[];
  notificationSettings: NotificationSettingsDto;
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

const EMPTY_LOCATION_FORM: ChurchLocationFormData = {
  name: "",
  type: "CONGREGACAO",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "RN",
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ConfiguracoesClient({
  user,
  churchLocations,
  notificationSettings,
}: ConfiguracoesClientProps) {
  const router = useRouter();
  const initialProfile = React.useMemo(
    () => ({
      name: user?.name ?? "",
      email: user?.email ?? "",
    }),
    [user?.email, user?.name]
  );

  const [profileName, setProfileName] = React.useState(initialProfile.name);
  const [profileEmail, setProfileEmail] = React.useState(initialProfile.email);
  const [savedProfile, setSavedProfile] = React.useState(initialProfile);
  const [savingProfile, setSavingProfile] = React.useState(false);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [savingPassword, setSavingPassword] = React.useState(false);
  const [locationForm, setLocationForm] =
    React.useState<ChurchLocationFormData>(EMPTY_LOCATION_FORM);
  const [locationErrors, setLocationErrors] = React.useState<Record<string, string[]>>({});
  const [editingLocationId, setEditingLocationId] = React.useState<string | null>(null);
  const [savingLocation, setSavingLocation] = React.useState(false);
  const [deletingLocationId, setDeletingLocationId] = React.useState<string | null>(null);
  const [fetchingCep, setFetchingCep] = React.useState(false);
  const initialNotificationSettings = React.useMemo<NotificationSettingsFormData>(
    () => ({
      birthdaysEnabled: notificationSettings.birthdaysEnabled,
      birthdayLeadDays: notificationSettings.birthdayLeadDays,
      eventsEnabled: notificationSettings.eventsEnabled,
      eventLeadDays: notificationSettings.eventLeadDays,
      visitorsEnabled: notificationSettings.visitorsEnabled,
      visitorRecentDays: notificationSettings.visitorRecentDays,
    }),
    [
      notificationSettings.birthdayLeadDays,
      notificationSettings.birthdaysEnabled,
      notificationSettings.eventLeadDays,
      notificationSettings.eventsEnabled,
      notificationSettings.visitorRecentDays,
      notificationSettings.visitorsEnabled,
    ]
  );
  const [notificationForm, setNotificationForm] =
    React.useState<NotificationSettingsFormData>(initialNotificationSettings);
  const [savedNotificationForm, setSavedNotificationForm] =
    React.useState<NotificationSettingsFormData>(initialNotificationSettings);
  const [savingNotifications, setSavingNotifications] = React.useState(false);

  React.useEffect(() => {
    setProfileName(initialProfile.name);
    setProfileEmail(initialProfile.email);
    setSavedProfile(initialProfile);
  }, [initialProfile]);

  React.useEffect(() => {
    setNotificationForm(initialNotificationSettings);
    setSavedNotificationForm(initialNotificationSettings);
  }, [initialNotificationSettings]);

  const normalizedProfileEmail = profileEmail.trim().toLowerCase();
  const profileChanged =
    profileName.trim() !== savedProfile.name ||
    normalizedProfileEmail !== savedProfile.email.toLowerCase();
  const passwordMatches = Boolean(confirmPassword && newPassword === confirmPassword);
  const notificationsChanged =
    JSON.stringify(notificationForm) !== JSON.stringify(savedNotificationForm);

  const roleLabel: Record<string, string> = {
    ADMIN: "Administrador",
    PASTOR: "Pastor(a)",
    LIDER: "Líder de Célula",
  };

  const permissionSummary: Record<string, string> = {
    ADMIN: "Acesso completo às áreas administrativas do sistema.",
    PASTOR: "Pode gerenciar cadastros, agenda, relatórios e células.",
    LIDER: "Pode acompanhar informações operacionais vinculadas à liderança.",
  };

  function updateLocationField<K extends keyof ChurchLocationFormData>(
    field: K,
    value: ChurchLocationFormData[K]
  ) {
    setLocationForm((current) => {
      const next = { ...current, [field]: value };
      const parsed = churchLocationSchema.safeParse(next);
      setLocationErrors(parsed.success ? {} : parsed.error.flatten().fieldErrors);
      return next;
    });
  }

  function updateNotificationField<K extends keyof NotificationSettingsFormData>(
    field: K,
    value: NotificationSettingsFormData[K]
  ) {
    setNotificationForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSaveNotifications() {
    setSavingNotifications(true);
    try {
      const result = await updateNotificationSettings(notificationForm);
      if (result.success && "settings" in result && result.settings) {
        const next = {
          birthdaysEnabled: result.settings.birthdaysEnabled,
          birthdayLeadDays: result.settings.birthdayLeadDays,
          eventsEnabled: result.settings.eventsEnabled,
          eventLeadDays: result.settings.eventLeadDays,
          visitorsEnabled: result.settings.visitorsEnabled,
          visitorRecentDays: result.settings.visitorRecentDays,
        };
        setNotificationForm(next);
        setSavedNotificationForm(next);
        toast.success("Preferências de notificação salvas.");
        router.refresh();
      } else if (typeof result.error === "object") {
        toast.error("Revise os campos de notificação.");
      } else {
        toast.error(result.error || "Erro ao salvar notificações.");
      }
    } catch {
      toast.error("Erro inesperado ao salvar notificações.");
    } finally {
      setSavingNotifications(false);
    }
  }

  function resetLocationForm() {
    setLocationForm(EMPTY_LOCATION_FORM);
    setLocationErrors({});
    setEditingLocationId(null);
  }

  function startEditLocation(location: ChurchLocationRow) {
    setEditingLocationId(location.id);
    setLocationForm({
      name: location.name,
      type: location.type === "SEDE" ? "SEDE" : "CONGREGACAO",
      cep: location.cep ?? "",
      street: location.street,
      number: location.number,
      complement: location.complement ?? "",
      neighborhood: location.neighborhood,
      city: location.city,
      state: location.state,
    });
    setLocationErrors({});
  }

  async function handleLocationCepChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskCep(e.target.value);
    updateLocationField("cep", masked);

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

      setLocationForm((current) => ({
        ...current,
        street: data.logradouro || current.street,
        neighborhood: data.bairro || current.neighborhood,
        city: data.localidade || current.city,
        state: data.uf || current.state,
      }));
    } catch {
      toast.error("Erro ao buscar o CEP.");
    } finally {
      setFetchingCep(false);
    }
  }

  async function handleSaveLocation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const parsed = churchLocationSchema.safeParse(locationForm);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setLocationErrors(fieldErrors);
      toast.error(Object.values(fieldErrors).flat()[0] || "Revise os campos do local.");
      return;
    }

    setSavingLocation(true);
    try {
      const result = editingLocationId
        ? await updateChurchLocation(editingLocationId, parsed.data)
        : await createChurchLocation(parsed.data);

      if (result.success) {
        toast.success(editingLocationId ? "Local atualizado." : "Local cadastrado.");
        resetLocationForm();
        router.refresh();
      } else if (typeof result.error === "object") {
        setLocationErrors(result.error as Record<string, string[]>);
        toast.error("Revise os campos do local.");
      } else {
        toast.error(result.error || "Erro ao salvar local.");
      }
    } catch {
      toast.error("Erro inesperado ao salvar local.");
    } finally {
      setSavingLocation(false);
    }
  }

  async function handleDeleteLocation(id: string) {
    const confirmed = window.confirm("Excluir este local da igreja?");
    if (!confirmed) return;

    setDeletingLocationId(id);
    try {
      const result = await deleteChurchLocation(id);
      if (result.success) {
        toast.success("Local excluído.");
        if (editingLocationId === id) resetLocationForm();
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao excluir local.");
      }
    } catch {
      toast.error("Erro inesperado ao excluir local.");
    } finally {
      setDeletingLocationId(null);
    }
  }

  async function handleSaveProfile() {
    const trimmedName = profileName.trim();

    if (!trimmedName) {
      toast.error("Informe seu nome.");
      return;
    }

    if (!normalizedProfileEmail || !isValidEmail(normalizedProfileEmail)) {
      toast.error("Informe um e-mail válido.");
      return;
    }

    setSavingProfile(true);
    try {
      const result = await updateProfile({
        name: trimmedName,
        email: normalizedProfileEmail,
      });

      if (result.success) {
        const updatedProfile =
          "user" in result && result.user
            ? result.user
            : { name: trimmedName, email: normalizedProfileEmail };

        setProfileName(updatedProfile.name);
        setProfileEmail(updatedProfile.email);
        setSavedProfile(updatedProfile);
        toast.success("Perfil atualizado com sucesso!");
        router.refresh();
      } else {
        toast.error(result.error ?? "Erro ao salvar perfil.");
      }
    } catch {
      toast.error("Erro ao salvar perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Informe a senha atual.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("A nova senha precisa ser diferente da senha atual.");
      return;
    }

    setSavingPassword(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        toast.success("Senha alterada com sucesso!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
      } else {
        toast.error(result.error ?? "Erro ao alterar senha.");
      }
    } catch {
      toast.error("Erro ao alterar senha.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Configurações"
        title="Preferências da Conta"
        description="Atualize seus dados de acesso, segurança e sessão do AvivaDash."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <section className="app-card overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-border">
              <div className="icon-tile icon-tile-primary">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-heading font-semibold text-foreground">
                  Perfil
                </h2>
                <p className="text-xs text-muted-foreground">
                  Nome e e-mail usados na sua conta
                </p>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="profile-name" className="text-xs text-muted-foreground">
                    Nome completo
                  </Label>
                  <Input
                    id="profile-name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Seu nome"
                    autoComplete="name" className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                </div>

                <div>
                  <Label htmlFor="profile-email" className="text-xs text-muted-foreground">
                    E-mail
                  </Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    autoComplete="email" className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-xl bg-primary/5 border border-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Nível de acesso
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {permissionSummary[user?.role ?? "ADMIN"] ?? "Conta autenticada no sistema."}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="self-start sm:self-center">
                  {roleLabel[user?.role ?? "ADMIN"] ?? user?.role}
                </Badge>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="brand"
                  onClick={handleSaveProfile}
                  disabled={
                    savingProfile ||
                    !profileChanged ||
                    !profileName.trim() ||
                    !isValidEmail(normalizedProfileEmail)
                  } className="gap-2"
                >
                  {savingProfile ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar Perfil
                </Button>
              </div>
            </div>
          </section>

          <section className="app-card overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-border">
              <div className="icon-tile icon-tile-warning">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-heading font-semibold text-foreground">
                  Segurança
                </h2>
                <p className="text-xs text-muted-foreground">
                  Altere a senha usada para entrar no sistema
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="p-5 space-y-5">
              <div>
                <Label htmlFor="current-password" className="text-xs text-muted-foreground">
                  Senha atual
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="current-password"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password" className="h-10 rounded-xl bg-surface-high border-0 pr-10 focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showCurrent ? "Ocultar senha atual" : "Mostrar senha atual"}
                  >
                    {showCurrent ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="new-password" className="text-xs text-muted-foreground">
                    Nova senha
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="new-password"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password" className="h-10 rounded-xl bg-surface-high border-0 pr-10 focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showNew ? "Ocultar nova senha" : "Mostrar nova senha"}
                    >
                      {showNew ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirm-password" className="text-xs text-muted-foreground">
                    Confirmar nova senha
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      autoComplete="new-password" className="h-10 rounded-xl bg-surface-high border-0 pr-10 focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showConfirm ? "Ocultar confirmação" : "Mostrar confirmação"}
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && !passwordMatches && (
                    <p className="mt-1.5 text-xs text-destructive">
                      As senhas não coincidem.
                    </p>
                  )}
                  {passwordMatches && confirmPassword.length >= 6 && (
                    <p className="mt-1.5 text-xs text-success flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Senhas conferem.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    savingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    newPassword !== confirmPassword
                  }
                  variant="outline" className="gap-2 border-gold/40 text-gold-muted hover:bg-gold/10 dark:text-gold"
                >
                  {savingPassword ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  Alterar Senha
                </Button>
              </div>
            </form>
          </section>

          <section className="app-card overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-border">
              <div className="icon-tile icon-tile-primary">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-heading font-semibold text-foreground">
                  Notificações
                </h2>
                <p className="text-xs text-muted-foreground">
                  Escolha quais alertas aparecem no sino e com qual antecedência
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-xl bg-surface-high p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="icon-tile icon-tile-gold">
                        <Cake className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Aniversários
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Avise antes e no dia do aniversário
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationForm.birthdaysEnabled}
                      onCheckedChange={(value) =>
                        updateNotificationField("birthdaysEnabled", value)
                      }
                    />
                  </div>
                  <div className="mt-4">
                    <Label className="text-xs text-muted-foreground">
                      Dias de antecedência
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={notificationForm.birthdayLeadDays}
                      onChange={(e) =>
                        updateNotificationField(
                          "birthdayLeadDays",
                          Math.max(0, Math.min(30, Number(e.target.value || 0)))
                        )
                      }
                      disabled={!notificationForm.birthdaysEnabled}
                      className="mt-1.5 h-10 rounded-xl bg-background border-0"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-surface-high p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="icon-tile icon-tile-info">
                        <CalendarDays className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Eventos próximos
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Destaque compromissos da agenda
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationForm.eventsEnabled}
                      onCheckedChange={(value) =>
                        updateNotificationField("eventsEnabled", value)
                      }
                    />
                  </div>
                  <div className="mt-4">
                    <Label className="text-xs text-muted-foreground">
                      Dias de antecedência
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={notificationForm.eventLeadDays}
                      onChange={(e) =>
                        updateNotificationField(
                          "eventLeadDays",
                          Math.max(0, Math.min(30, Number(e.target.value || 0)))
                        )
                      }
                      disabled={!notificationForm.eventsEnabled}
                      className="mt-1.5 h-10 rounded-xl bg-background border-0"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-surface-high p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="icon-tile icon-tile-success">
                        <UserPlus className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Visitantes recentes
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Acompanhe novos visitantes cadastrados
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notificationForm.visitorsEnabled}
                      onCheckedChange={(value) =>
                        updateNotificationField("visitorsEnabled", value)
                      }
                    />
                  </div>
                  <div className="mt-4">
                    <Label className="text-xs text-muted-foreground">
                      Janela em dias
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={notificationForm.visitorRecentDays}
                      onChange={(e) =>
                        updateNotificationField(
                          "visitorRecentDays",
                          Math.max(1, Math.min(30, Number(e.target.value || 1)))
                        )
                      }
                      disabled={!notificationForm.visitorsEnabled}
                      className="mt-1.5 h-10 rounded-xl bg-background border-0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="brand"
                  onClick={handleSaveNotifications}
                  disabled={savingNotifications || !notificationsChanged}
                  className="gap-2"
                >
                  {savingNotifications ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar Notificações
                </Button>
              </div>
            </div>
          </section>

          <section className="app-card overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-border">
              <div className="icon-tile icon-tile-success">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-heading font-semibold text-foreground">
                  Locais da Igreja
                </h2>
                <p className="text-xs text-muted-foreground">
                  Cadastre sede e congregações usadas na agenda
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1fr_1.1fr]">
              <form onSubmit={handleSaveLocation} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px]">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nome *</Label>
                    <Input
                      value={locationForm.name}
                      onChange={(e) => updateLocationField("name", e.target.value)}
                      placeholder="Ex: Sede"
                      className="mt-1.5 h-10 rounded-xl bg-surface-high border-0"
                    />
                    <FieldError error={locationErrors.name} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <select
                      value={locationForm.type}
                      onChange={(e) =>
                        updateLocationField("type", e.target.value as ChurchLocationFormData["type"])
                      }
                      className="mt-1.5 h-10 w-full rounded-xl border-0 bg-surface-high px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="SEDE">Sede</option>
                      <option value="CONGREGACAO">Congregação</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">CEP</Label>
                    <div className="relative mt-1.5">
                      <Input
                        value={locationForm.cep ?? ""}
                        onChange={handleLocationCepChange}
                        placeholder="00000-000"
                        className="h-10 rounded-xl bg-surface-high border-0 pr-9"
                      />
                      {fetchingCep && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
                      )}
                    </div>
                    <FieldError error={locationErrors.cep} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Número *</Label>
                    <Input
                      value={locationForm.number}
                      onChange={(e) => updateLocationField("number", e.target.value)}
                      placeholder="Ex: 1161"
                      className="mt-1.5 h-10 rounded-xl bg-surface-high border-0"
                    />
                    <FieldError error={locationErrors.number} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Rua/Avenida *</Label>
                    <Input
                      value={locationForm.street}
                      onChange={(e) => updateLocationField("street", e.target.value)}
                      placeholder="Ex: Rua Monte Rei"
                      className="mt-1.5 h-10 rounded-xl bg-surface-high border-0"
                    />
                    <FieldError error={locationErrors.street} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Complemento</Label>
                    <Input
                      value={locationForm.complement ?? ""}
                      onChange={(e) => updateLocationField("complement", e.target.value)}
                      placeholder="Ex: Sala 2"
                      className="mt-1.5 h-10 rounded-xl bg-surface-high border-0"
                    />
                    <FieldError error={locationErrors.complement} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Bairro *</Label>
                    <Input
                      value={locationForm.neighborhood}
                      onChange={(e) => updateLocationField("neighborhood", e.target.value)}
                      placeholder="Ex: Planalto"
                      className="mt-1.5 h-10 rounded-xl bg-surface-high border-0"
                    />
                    <FieldError error={locationErrors.neighborhood} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Cidade *</Label>
                    <Input
                      value={locationForm.city}
                      onChange={(e) => updateLocationField("city", e.target.value)}
                      placeholder="Ex: Natal"
                      className="mt-1.5 h-10 rounded-xl bg-surface-high border-0"
                    />
                    <FieldError error={locationErrors.city} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">UF *</Label>
                    <Input
                      value={locationForm.state}
                      onChange={(e) =>
                        updateLocationField("state", e.target.value.toUpperCase().slice(0, 2))
                      }
                      placeholder="RN"
                      className="mt-1.5 h-10 rounded-xl bg-surface-high border-0 uppercase"
                    />
                    <FieldError error={locationErrors.state} />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  {editingLocationId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetLocationForm}
                      className="h-10 w-full sm:w-auto"
                    >
                      Cancelar edição
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="brand"
                    disabled={savingLocation}
                    className="h-10 w-full gap-2 rounded-xl sm:w-auto"
                  >
                    {savingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {editingLocationId ? "Salvar Local" : "Adicionar Local"}
                  </Button>
                </div>
              </form>

              <div className="space-y-3">
                {churchLocations.length === 0 ? (
                  <p className="rounded-xl bg-surface-high p-4 text-sm text-muted-foreground">
                    Nenhum local cadastrado.
                  </p>
                ) : (
                  churchLocations.map((location) => (
                    <div key={location.id} className="rounded-xl bg-surface-high p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">
                              {location.name}
                            </h3>
                            <Badge variant="secondary">
                              {location.type === "SEDE" ? "Sede" : "Congregação"}
                            </Badge>
                          </div>
                          <p className="mt-2 flex gap-2 text-xs leading-relaxed text-muted-foreground">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {location.address}
                          </p>
                        </div>
                        <div className="flex shrink-0 justify-end gap-2 sm:gap-1">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Editar local"
                            onClick={() => startEditLocation(location)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="destructive"
                            aria-label="Excluir local"
                            disabled={deletingLocationId === location.id}
                            onClick={() => handleDeleteLocation(location.id)}
                          >
                            {deletingLocationId === location.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">

          <section className="app-card overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-border">
              <div className="icon-tile icon-tile-success">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-heading font-semibold text-foreground">
                  Sistema
                </h2>
                <p className="text-xs text-muted-foreground">
                  Ambiente e versão
                </p>
              </div>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Aplicação</span>
                <span className="font-medium text-foreground">AvivaDash</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Versão</span>
                <span className="font-medium text-foreground">1.0</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-surface-high p-3">
                <Lock className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">
                  Sessão protegida por cookie HTTP-only.
                </span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
