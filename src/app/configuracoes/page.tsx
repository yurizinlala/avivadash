export const dynamic = "force-dynamic";
import { ConfiguracoesClient } from "./configuracoes-client";
import { getChurchLocations } from "@/lib/actions/church-location-actions";
import { requireAuth } from "@/lib/permissions";

export default async function ConfiguracoesPage() {
  const [user, churchLocations] = await Promise.all([
    requireAuth(),
    getChurchLocations(),
  ]);

  return <ConfiguracoesClient user={user} churchLocations={churchLocations} />;
}
