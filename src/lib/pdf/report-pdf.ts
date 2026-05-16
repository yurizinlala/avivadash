import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ReportData {
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

const PRIMARY = [30, 64, 175] as const;
const PRIMARY_DARK = [15, 23, 42] as const;
const MUTED = [100, 116, 139] as const;
const SURFACE = [248, 250, 252] as const;
const SUCCESS_BG = [220, 252, 231] as const;
const SUCCESS_TEXT = [22, 101, 52] as const;
const DANGER_BG = [254, 226, 226] as const;
const DANGER_TEXT = [153, 27, 27] as const;

let fontDataReady: Promise<{ regular: string; bold: string } | null> | null = null;
let logoDataUrl: Promise<string | null> | null = null;

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatMonth(date: Date): string {
  const label = new Date(date).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function monthFileKey(date: Date): string {
  const refDate = new Date(date);
  return `${refDate.getFullYear()}_${String(refDate.getMonth() + 1).padStart(2, "0")}`;
}

function totals(report: ReportData) {
  const income = report.totalTithes + report.totalOfferings + report.totalOtherIncome;
  const balance = income - report.totalExpenses;
  return { income, balance };
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function loadFonts(doc: jsPDF) {
  if (!fontDataReady) {
    fontDataReady = (async () => {
      const [regular, bold] = await Promise.all([
        fetch("/certificates/fonts/Sansation-Regular.ttf").then((res) => res.arrayBuffer()),
        fetch("/certificates/fonts/Sansation-Bold.ttf").then((res) => res.arrayBuffer()),
      ]);

      return {
        regular: arrayBufferToBase64(regular),
        bold: arrayBufferToBase64(bold),
      };
    })().catch(() => null);
  }

  const fontData = await fontDataReady;
  if (!fontData) return;

  doc.addFileToVFS("Sansation-Regular.ttf", fontData.regular);
  doc.addFont("Sansation-Regular.ttf", "Sansation", "normal");
  doc.addFileToVFS("Sansation-Bold.ttf", fontData.bold);
  doc.addFont("Sansation-Bold.ttf", "Sansation", "bold");
}

async function getLogoDataUrl() {
  if (!logoDataUrl) {
    logoDataUrl = fetch("/logo.png")
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      )
      .catch(() => null);
  }

  return logoDataUrl;
}

function setFont(doc: jsPDF, size: number, style: "normal" | "bold" = "normal") {
  try {
    doc.setFont("Sansation", style);
  } catch {
    doc.setFont("helvetica", style);
  }
  doc.setFontSize(size);
}

async function drawHeader(doc: jsPDF, title: string, subtitle: string) {
  const logo = await getLogoDataUrl();

  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, 210, 42, "F");

  if (logo) {
    doc.addImage(logo, "PNG", 17, 9, 18, 18);
  }

  doc.setTextColor(255, 255, 255);
  setFont(doc, 20, "bold");
  doc.text("IEAB Gestao", logo ? 42 : 18, 18);

  setFont(doc, 9, "normal");
  doc.text(title, logo ? 42 : 18, 27);
  doc.text(subtitle, logo ? 42 : 18, 34);
}

function drawFooter(doc: jsPDF) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setTextColor(...MUTED);
  setFont(doc, 8);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString("pt-BR")} as ${new Date().toLocaleTimeString("pt-BR")} - AvivaDash`,
    18,
    pageHeight - 10
  );
}

function drawCard(doc: jsPDF, x: number, y: number, w: number, label: string, value: string) {
  doc.setFillColor(...SURFACE);
  doc.roundedRect(x, y, w, 25, 4, 4, "F");
  doc.setTextColor(...MUTED);
  setFont(doc, 8, "bold");
  doc.text(label.toUpperCase(), x + 5, y + 8);
  doc.setTextColor(...PRIMARY_DARK);
  setFont(doc, 15, "bold");
  doc.text(value, x + 5, y + 19);
}

function sectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setTextColor(...PRIMARY_DARK);
  setFont(doc, 12, "bold");
  doc.text(title, 18, y);
}

function tableTheme() {
  return {
    theme: "plain" as const,
    headStyles: {
      fillColor: PRIMARY as unknown as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: "bold" as const,
      fontSize: 9,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: PRIMARY_DARK as unknown as [number, number, number],
    },
    alternateRowStyles: {
      fillColor: SURFACE as unknown as [number, number, number],
    },
    margin: { left: 18, right: 18 },
    styles: {
      font: "Sansation",
      lineColor: [226, 232, 240] as [number, number, number],
      lineWidth: 0.1,
    },
  };
}

export async function generateReportPDF(report: ReportData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await loadFonts(doc);

  const refDate = new Date(report.referenceMonth);
  const monthName = formatMonth(refDate);
  const { income, balance } = totals(report);

  await drawHeader(
    doc,
    "Relatorio Mensal - Igreja Evangelica Avivamento Biblico",
    `Referencia: ${monthName}`
  );

  drawCard(doc, 18, 52, 54, "Presentes", report.totalMembers.toLocaleString("pt-BR"));
  drawCard(doc, 78, 52, 54, "Receitas", formatCurrency(income));
  drawCard(doc, 138, 52, 54, "Saldo", formatCurrency(balance));

  sectionTitle(doc, "Dados do Ministerio", 92);
  autoTable(doc, {
    ...tableTheme(),
    startY: 98,
    head: [["Indicador", "Quantidade"]],
    body: [
      ["Total de Presentes nos Cultos", String(report.totalMembers)],
      ["Visitantes", String(report.totalVisitors)],
      ["Batismos", String(report.totalBaptisms)],
      ["Conversoes", String(report.totalConversions)],
      ["Transferencias", String(report.totalTransfers)],
    ],
    columnStyles: {
      0: { cellWidth: 124 },
      1: { halign: "center", cellWidth: 50 },
    },
  });

  const ministryY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 135;
  sectionTitle(doc, "Demonstrativo Financeiro", ministryY + 14);
  autoTable(doc, {
    ...tableTheme(),
    startY: ministryY + 20,
    head: [["Descricao", "Valor"]],
    body: [
      ["Dizimos", formatCurrency(report.totalTithes)],
      ["Ofertas", formatCurrency(report.totalOfferings)],
      ["Outras Receitas", formatCurrency(report.totalOtherIncome)],
      ["Total de Receitas", formatCurrency(income)],
      ["Despesas", formatCurrency(report.totalExpenses)],
      ["Saldo do Mes", formatCurrency(balance)],
    ],
    columnStyles: {
      0: { cellWidth: 124 },
      1: { halign: "right", cellWidth: 50 },
    },
    didParseCell: (data) => {
      if (data.row.index === 3 && data.section === "body") {
        data.cell.styles.fontStyle = "bold";
      }
      if (data.row.index === 5 && data.section === "body") {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = (balance >= 0 ? SUCCESS_BG : DANGER_BG) as unknown as [
          number,
          number,
          number,
        ];
        data.cell.styles.textColor = (balance >= 0 ? SUCCESS_TEXT : DANGER_TEXT) as unknown as [
          number,
          number,
          number,
        ];
      }
    },
  });

  if (report.notes) {
    const financialY =
      (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 210;
    sectionTitle(doc, "Observacoes", financialY + 14);
    doc.setTextColor(...PRIMARY_DARK);
    setFont(doc, 9);
    doc.text(doc.splitTextToSize(report.notes, 174), 18, financialY + 22);
  }

  drawFooter(doc);
  doc.save(`Relatorio_IEAB_${monthFileKey(refDate)}.pdf`);
}

export async function generateConsolidatedReportPDF(reports: ReportData[]) {
  const orderedReports = [...reports].sort(
    (a, b) => new Date(a.referenceMonth).getTime() - new Date(b.referenceMonth).getTime()
  );
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await loadFonts(doc);

  const accumulated = orderedReports.reduce(
    (acc, report) => {
      const { income, balance } = totals(report);
      acc.members += report.totalMembers;
      acc.visitors += report.totalVisitors;
      acc.baptisms += report.totalBaptisms;
      acc.conversions += report.totalConversions;
      acc.transfers += report.totalTransfers;
      acc.income += income;
      acc.expenses += report.totalExpenses;
      acc.balance += balance;
      return acc;
    },
    {
      members: 0,
      visitors: 0,
      baptisms: 0,
      conversions: 0,
      transfers: 0,
      income: 0,
      expenses: 0,
      balance: 0,
    }
  );

  await drawHeader(
    doc,
    "Relatorio Consolidado - Igreja Evangelica Avivamento Biblico",
    `${orderedReports.length} relatorio(s) compilado(s)`
  );

  drawCard(doc, 18, 52, 54, "Relatorios", String(orderedReports.length));
  drawCard(doc, 78, 52, 54, "Receitas", formatCurrency(accumulated.income));
  drawCard(doc, 138, 52, 54, "Saldo", formatCurrency(accumulated.balance));

  sectionTitle(doc, "Resumo Acumulado", 92);
  autoTable(doc, {
    ...tableTheme(),
    startY: 98,
    head: [["Indicador", "Total"]],
    body: [
      ["Presentes nos Cultos", String(accumulated.members)],
      ["Visitantes", String(accumulated.visitors)],
      ["Batismos", String(accumulated.baptisms)],
      ["Conversoes", String(accumulated.conversions)],
      ["Transferencias", String(accumulated.transfers)],
      ["Receitas", formatCurrency(accumulated.income)],
      ["Despesas", formatCurrency(accumulated.expenses)],
      ["Saldo Acumulado", formatCurrency(accumulated.balance)],
    ],
    columnStyles: {
      0: { cellWidth: 124 },
      1: { halign: "right", cellWidth: 50 },
    },
  });

  const summaryY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 150;
  sectionTitle(doc, "Evolucao Mensal", summaryY + 14);
  autoTable(doc, {
    ...tableTheme(),
    startY: summaryY + 20,
    head: [["Mes", "Presentes", "Visitantes", "Conversoes", "Receitas", "Despesas", "Saldo"]],
    body: orderedReports.map((report) => {
      const { income, balance } = totals(report);
      return [
        formatMonth(new Date(report.referenceMonth)),
        String(report.totalMembers),
        String(report.totalVisitors),
        String(report.totalConversions),
        formatCurrency(income),
        formatCurrency(report.totalExpenses),
        formatCurrency(balance),
      ];
    }),
    columnStyles: {
      0: { cellWidth: 38 },
      1: { halign: "center", cellWidth: 21 },
      2: { halign: "center", cellWidth: 21 },
      3: { halign: "center", cellWidth: 23 },
      4: { halign: "right", cellWidth: 28 },
      5: { halign: "right", cellWidth: 28 },
      6: { halign: "right", cellWidth: 28 },
    },
    didDrawPage: () => drawFooter(doc),
  });

  drawFooter(doc);
  doc.save(`Relatorio_IEAB_Consolidado_${new Date().toISOString().slice(0, 10)}.pdf`);
}
