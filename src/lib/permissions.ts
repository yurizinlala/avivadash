import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const WRITE_ROLES = ["ADMIN", "PASTOR"] as const;

export type PermissionErrorCode = "UNAUTHORIZED" | "FORBIDDEN";

export class PermissionError extends Error {
  constructor(public readonly code: PermissionErrorCode) {
    super(code);
    this.name = "PermissionError";
  }
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.userId) {
    throw new PermissionError("UNAUTHORIZED");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    throw new PermissionError("UNAUTHORIZED");
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function requireRole(allowedRoles: readonly string[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new PermissionError("FORBIDDEN");
  }

  return session;
}

export function getPermissionErrorMessage(error: unknown) {
  if (!(error instanceof PermissionError)) return null;

  return error.code === "UNAUTHORIZED"
    ? "Sessão expirada. Faça login novamente."
    : "Você não tem permissão para executar esta ação.";
}
