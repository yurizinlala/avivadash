export const dynamic = "force-dynamic";

import Link from "next/link";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/design-system";
import { getCertificates } from "@/lib/actions/certificate-actions";
import { getPeopleSimple } from "@/lib/actions/person-actions";
import { CertificadosClient } from "./certificados-client";

export default async function CertificadosPage() {
  const [certificates, people] = await Promise.all([
    getCertificates(),
    getPeopleSimple(),
  ]);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Certificados"
        title="Emissão de Certificados"
        description="Emita, baixe e gerencie certificados oficiais da igreja."
        actions={(
          <Link
            href="/relatorios"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-high"
          >
            <FileText className="h-4 w-4" />
            Voltar para Relatórios
          </Link>
        )}
      />

      <CertificadosClient
        initialCertificates={certificates}
        people={people}
      />
    </div>
  );
}
