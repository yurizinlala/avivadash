import jsPDF from "jspdf";

export interface CertificatePDFData {
  id: string;
  type: string;
  title: string;
  recipientName: string;
  description: string | null;
  issueDate: string | Date;
  eventDate: string | Date | null;
  issuerName: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  BATISMO: "Certificado de Batismo",
  MEMBRESIA: "Certificado de Membresia",
  APRESENTACAO: "Certificado de Apresentação",
  CURSO: "Certificado de Conclusão",
  HONRA: "Certificado de Honra",
  PARTICIPACAO: "Certificado de Participação",
};

function formatLongDate(value: string | Date) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

export function generateCertificatePDF(certificate: CertificatePDFData) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const certificateLabel = TYPE_LABELS[certificate.type] ?? certificate.title;

  doc.setFillColor(250, 250, 250);
  doc.rect(0, 0, width, height, "F");

  doc.setDrawColor(0, 50, 117);
  doc.setLineWidth(2);
  doc.roundedRect(12, 12, width - 24, height - 24, 4, 4);

  doc.setDrawColor(245, 183, 0);
  doc.setLineWidth(0.8);
  doc.roundedRect(18, 18, width - 36, height - 36, 3, 3);

  doc.setFillColor(0, 50, 117);
  doc.roundedRect(width / 2 - 26, 22, 52, 12, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("IEAB", width / 2, 30, { align: "center" });

  doc.setTextColor(0, 50, 117);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("IGREJA EVANGÉLICA AVIVAMENTO BÍBLICO", width / 2, 47, { align: "center" });

  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(certificateLabel.toUpperCase(), width / 2, 66, { align: "center" });

  doc.setDrawColor(245, 183, 0);
  doc.setLineWidth(0.8);
  doc.line(width / 2 - 44, 73, width / 2 + 44, 73);

  doc.setTextColor(70, 70, 70);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Concedemos o presente certificado a", width / 2, 91, { align: "center" });

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(31);
  doc.setFont("times", "bolditalic");
  doc.text(certificate.recipientName, width / 2, 112, { align: "center" });

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  doc.line(width / 2 - 64, 118, width / 2 + 64, 118);

  const defaultDescription =
    certificate.eventDate
      ? `Em reconhecimento ao registro de ${certificateLabel.toLowerCase()} realizado em ${formatLongDate(certificate.eventDate)}.`
      : `Em reconhecimento ao registro de ${certificateLabel.toLowerCase()} emitido por esta comunidade.`;

  doc.setTextColor(75, 75, 75);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  const lines = doc.splitTextToSize(certificate.description || defaultDescription, 200);
  doc.text(lines, width / 2, 135, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(70, 70, 70);
  doc.text(`Emitido em ${formatLongDate(certificate.issueDate)}`, width / 2, 154, {
    align: "center",
  });

  doc.setDrawColor(0, 50, 117);
  doc.setLineWidth(0.4);
  doc.line(58, 178, 122, 178);
  doc.line(width - 122, 178, width - 58, 178);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text(certificate.issuerName || "Pastor Regional", 90, 185, { align: "center" });
  doc.text("Secretaria", width - 90, 185, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text(`Registro: ${certificate.id}`, width / 2, height - 18, { align: "center" });

  doc.save(`Certificado_${sanitizeFileName(certificate.recipientName)}.pdf`);
}
