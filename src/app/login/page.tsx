import { LoginForm } from "./login-form";
import { getSession } from "@/lib/auth";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  // If already logged in, redirect to dashboard
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Login Card */}
      <div className="relative w-full max-w-[420px]">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-card shadow-ambient">
            <Image
              src="/logo.png"
              alt="IEAB"
              width={52}
              height={52} className="h-[52px] w-[52px] object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">
            IEAB Gestão
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sistema de Gestão Eclesiástica
          </p>
        </div>

        {/* Form Card */}
        <div className="app-card p-8">
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
