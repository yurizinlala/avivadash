"use client";

import React from "react";
import {
  User,
  Lock,
  Church,
  Shield,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { changePassword, updateProfile } from "@/lib/actions/settings-actions";

interface ConfiguracoesClientProps {
  user: {
    userId: string;
    email: string;
    name: string;
    role: string;
  } | null;
}

export function ConfiguracoesClient({ user }: ConfiguracoesClientProps) {
  // Profile
  const [profileName, setProfileName] = React.useState(user?.name ?? "");
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [savingPassword, setSavingPassword] = React.useState(false);

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const result = await updateProfile(profileName);
      if (result.success) {
        toast.success("Perfil atualizado com sucesso!");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao salvar perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
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
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao alterar senha.");
    } finally {
      setSavingPassword(false);
    }
  }

  const roleLabel: Record<string, string> = {
    ADMIN: "Administrador",
    PASTOR: "Pastor(a)",
    LIDER: "Líder de Célula",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie seu perfil, segurança e preferências do sistema.
        </p>
      </div>

      {/* ── Profile Card ── */}
      <div className="rounded-2xl bg-card shadow-ambient overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <User className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-heading font-semibold text-foreground">
              Perfil
            </h2>
            <p className="text-xs text-muted-foreground">
              Informações pessoais da sua conta
            </p>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nome completo</Label>
              <Input
                id="profile-name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Seu nome"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">E-mail</Label>
              <Input
                id="profile-email"
                value={user?.email ?? ""}
                disabled
                className="rounded-xl bg-surface-high cursor-not-allowed"
              />
              <p className="text-[0.65rem] text-muted-foreground">
                O email não pode ser alterado.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <Shield className="h-4 w-4 text-primary shrink-0" />
            <div className="text-sm">
              <span className="text-muted-foreground">Nível de acesso: </span>
              <span className="font-medium text-foreground">
                {roleLabel[user?.role ?? "ADMIN"] ?? user?.role}
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile || profileName === user?.name}
              className="gradient-primary text-white rounded-xl gap-2"
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
      </div>

      {/* ── Change Password Card ── */}
      <div className="rounded-2xl bg-card shadow-ambient overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
            <Lock className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-heading font-semibold text-foreground">
              Segurança
            </h2>
            <p className="text-xs text-muted-foreground">
              Altere sua senha de acesso
            </p>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha atual</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="rounded-xl"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[0.65rem] text-red-500">
                  As senhas não coincidem.
                </p>
              )}
              {confirmPassword && newPassword === confirmPassword && confirmPassword.length >= 6 && (
                <p className="text-[0.65rem] text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Senhas conferem.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleChangePassword}
              disabled={
                savingPassword ||
                !currentPassword ||
                !newPassword ||
                newPassword !== confirmPassword
              }
              variant="outline"
              className="rounded-xl gap-2 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              {savingPassword ? (
                <div className="h-4 w-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Alterar Senha
            </Button>
          </div>
        </div>
      </div>

      {/* ── Church Info Card (static/display) ── */}
      <div className="rounded-2xl bg-card shadow-ambient overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
            <Church className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-heading font-semibold text-foreground">
              Informações da Igreja
            </h2>
            <p className="text-xs text-muted-foreground">
              Dados da organização
            </p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>Nome da Igreja</Label>
              <Input
                value="Igreja Evangélica Avivamento Bíblico"
                disabled
                className="rounded-xl bg-surface-high cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>Sigla</Label>
              <Input
                value="IEAB"
                disabled
                className="rounded-xl bg-surface-high cursor-not-allowed"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-2 p-3 rounded-xl bg-surface-high/50">
            💡 Para alterar as informações da igreja, entre em contato com o
            administrador do sistema.
          </p>
        </div>
      </div>

      {/* ── System Info ── */}
      <div className="rounded-2xl bg-surface-high/50 p-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>AvivaDash v1.0 — Sistema de Gestão Eclesiástica</span>
          <span>Next.js 16 • Prisma 7 • SQLite</span>
        </div>
      </div>
    </div>
  );
}
