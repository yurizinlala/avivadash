"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Save,
  Shield,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { logout } from "@/lib/auth";
import { changePassword, updateProfile } from "@/lib/actions/settings-actions";
import { PageHeader } from "@/components/design-system";

interface ConfiguracoesClientProps {
  user: {
    userId: string;
    email: string;
    name: string;
    role: string;
  } | null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ConfiguracoesClient({ user }: ConfiguracoesClientProps) {
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
  const [loggingOut, setLoggingOut] = React.useState(false);

  React.useEffect(() => {
    setProfileName(initialProfile.name);
    setProfileEmail(initialProfile.email);
    setSavedProfile(initialProfile);
  }, [initialProfile]);

  const normalizedProfileEmail = profileEmail.trim().toLowerCase();
  const profileChanged =
    profileName.trim() !== savedProfile.name ||
    normalizedProfileEmail !== savedProfile.email.toLowerCase();
  const passwordMatches = Boolean(confirmPassword && newPassword === confirmPassword);

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

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Erro ao sair da conta.");
      setLoggingOut(false);
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
        </div>

        <aside className="space-y-6">
          <section className="app-card overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-border">
              <div className="icon-tile icon-tile-info">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-heading font-semibold text-foreground">
                  Acesso
                </h2>
                <p className="text-xs text-muted-foreground">
                  Permissões da conta atual
                </p>
              </div>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Perfil</span>
                <span className="font-medium text-foreground">
                  {roleLabel[user?.role ?? "ADMIN"] ?? user?.role}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Conta</span>
                <span className="font-medium text-success">Ativa</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-surface-high p-3">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate text-muted-foreground">
                  {savedProfile.email || "Sem e-mail"}
                </span>
              </div>
            </div>
          </section>

          <section className="app-card overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-border">
              <div className="icon-tile icon-tile-danger">
                <LogOut className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-heading font-semibold text-foreground">
                  Sessão
                </h2>
                <p className="text-xs text-muted-foreground">
                  Controle do acesso neste navegador
                </p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-surface-high p-3 text-sm">
                <p className="font-medium text-foreground">{savedProfile.name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {savedProfile.email || "Conta autenticada"}
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={handleLogout}
                disabled={loggingOut} className="w-full gap-2"
              >
                {loggingOut ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive/30 border-t-destructive" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Sair da Conta
              </Button>
            </div>
          </section>

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
