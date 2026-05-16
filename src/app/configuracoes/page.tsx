export const dynamic = "force-dynamic";
import { ConfiguracoesClient } from "./configuracoes-client";
import { getChurchLocations } from "@/lib/actions/church-location-actions";
import { getNotificationSettings } from "@/lib/actions/notification-settings-actions";
import { requireAuth } from "@/lib/permissions";

export default async function ConfiguracoesPage() {
  const [user, churchLocations, notificationSettings] = await Promise.all([
    requireAuth(),
    getChurchLocations(),
    getNotificationSettings(),
  ]);

  return (
    <ConfiguracoesClient
      user={user}
      churchLocations={churchLocations}
      notificationSettings={notificationSettings}
    />
  );
}
