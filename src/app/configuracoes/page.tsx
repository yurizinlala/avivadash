export const dynamic = "force-dynamic";
import { getCurrentUser } from "@/lib/auth";
import { ConfiguracoesClient } from "./configuracoes-client";

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();

  return <ConfiguracoesClient user={user} />;
}
