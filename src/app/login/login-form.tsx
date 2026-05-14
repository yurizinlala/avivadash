"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;

    try {
      const result = await login(email, password);
      if (result.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error || "Erro ao fazer login.");
      }
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="email" className="text-xs text-muted-foreground">
          E-mail
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="admin@ieab.com" className="mt-1.5 h-11 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
        />
      </div>

      <div>
        <Label htmlFor="password" className="text-xs text-muted-foreground">
          Senha
        </Label>
        <div className="relative mt-1.5">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••" className="h-11 rounded-xl bg-surface-high border-0 focus-visible:ring-2 focus-visible:ring-primary/20 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        variant="brand"
        disabled={loading} className="mt-2 h-11 w-full gap-2 text-sm font-medium"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
