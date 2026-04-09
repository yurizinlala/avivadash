import { LoginForm } from "./login-form";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  // If already logged in, redirect to dashboard
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-zinc-950 dark:via-slate-950 dark:to-zinc-900 px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 h-64 w-64 rounded-full bg-primary/3 blur-3xl" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-[420px]">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-primary shadow-lg mb-4">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">
            IEAB Gestão
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sistema de Gestão Eclesiástica
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-lg font-heading font-semibold text-foreground">
              Bem-vindo(a) de volta
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Entre com suas credenciais para acessar o sistema.
            </p>
          </div>

          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Igreja Evangélica Avivamento Bíblico © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
