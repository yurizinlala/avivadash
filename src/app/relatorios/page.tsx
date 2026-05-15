export const dynamic = "force-dynamic";
import { getReports } from "@/lib/actions/report-actions";
import { RelatoriosClient } from "./relatorios-client";

export default async function RelatoriosPage() {
  const reports = await getReports();

  return <RelatoriosClient initialReports={reports} />;
}
