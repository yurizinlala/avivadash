import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportData {
  referenceMonth: Date;
  totalMembers: number;
  totalVisitors: number;
  totalBaptisms: number;
  totalConversions: number;
  totalTransfers: number;
  totalTithes: number;
  totalOfferings: number;
  totalOtherIncome: number;
  totalExpenses: number;
  notes: string | null;
  createdAt: Date;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function generateReportPDF(report: ReportData) {
  const doc = new jsPDF();
  const refDate = new Date(report.referenceMonth);
  const monthName = refDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  // ─── Header ───
  doc.setFillColor(30, 64, 175); // primary blue
  doc.rect(0, 0, 210, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("IEAB Gestão", 20, 22);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Relatório Mensal — Igreja Evangélica Avivamento Bíblico", 20, 32);

  doc.setFontSize(10);
  doc.text(
    `Referência: ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`,
    20,
    40
  );

  // ─── Ministry Stats ───
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Dados do Ministério", 20, 60);

  autoTable(doc, {
    startY: 65,
    head: [["Indicador", "Quantidade"]],
    body: [
      ["Total de Presentes nos Cultos", String(report.totalMembers)],
      ["Visitantes", String(report.totalVisitors)],
      ["Batismos", String(report.totalBaptisms)],
      ["Conversões", String(report.totalConversions)],
      ["Transferências", String(report.totalTransfers)],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: "center" },
    },
    margin: { left: 20, right: 20 },
  });

  // ─── Financial Table ───
  const afterFirstTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 130;
  const financialY = afterFirstTable + 15;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Demonstrativo Financeiro", 20, financialY);

  const totalIncome =
    report.totalTithes + report.totalOfferings + report.totalOtherIncome;
  const balance = totalIncome - report.totalExpenses;

  autoTable(doc, {
    startY: financialY + 5,
    head: [["Descrição", "Valor"]],
    body: [
      ["Dízimos", formatCurrency(report.totalTithes)],
      ["Ofertas", formatCurrency(report.totalOfferings)],
      ["Outras Receitas", formatCurrency(report.totalOtherIncome)],
      ["Total de Receitas", formatCurrency(totalIncome)],
      ["Despesas", formatCurrency(report.totalExpenses)],
      ["Saldo do Mês", formatCurrency(balance)],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: "right" },
    },
    didParseCell: function (data) {
      // Highlight balance row
      if (data.row.index === 5 && data.section === "body") {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = balance >= 0 ? [220, 252, 231] : [254, 226, 226];
        data.cell.styles.textColor = balance >= 0 ? [22, 101, 52] : [153, 27, 27];
      }
      // Bold totals row
      if (data.row.index === 3 && data.section === "body") {
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: 20, right: 20 },
  });

  // ─── Notes ───
  if (report.notes) {
    const afterFinancial = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 220;
    const notesY = afterFinancial + 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Observações", 20, notesY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);

    const lines = doc.splitTextToSize(report.notes, 170);
    doc.text(lines, 20, notesY + 8);
  }

  // ─── Footer ───
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")} — IEAB Gestão`,
    20,
    pageHeight - 10
  );

  // ─── Download ───
  const fileName = `Relatorio_IEAB_${refDate.getFullYear()}_${String(refDate.getMonth() + 1).padStart(2, "0")}.pdf`;
  doc.save(fileName);
}
