export const dynamic = "force-dynamic";
import { getCertificates } from "@/lib/actions/certificate-actions";
import { getPeopleSimple } from "@/lib/actions/person-actions";
import { getReports } from "@/lib/actions/report-actions";
import { RelatoriosClient } from "./relatorios-client";

export default async function RelatoriosPage() {
  const [reports, certificates, people] = await Promise.all([
    getReports(),
    getCertificates(),
    getPeopleSimple(),
  ]);

  return (
    <RelatoriosClient
      initialReports={reports}
      initialCertificates={certificates}
      people={people}
    />
  );
}
