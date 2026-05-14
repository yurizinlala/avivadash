export const dynamic = "force-dynamic";
import { ConfiguracoesClient } from "./configuracoes-client";
import { requireAuth } from "@/lib/permissions";

export default async function ConfiguracoesPage() {
  const user = await requireAuth();

  return <ConfiguracoesClient user={user} />;
}
