import jsPDF from "jspdf";
import { getCertificateTemplate, getCertificateTitle } from "@/lib/certificates";

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

const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 1414;
const FONT_LAVANDERIA = "CertificateLavanderia";
const FONT_SANSATION = "CertificateSansation";
const FONT_SANSATION_BOLD = "CertificateSansationBold";

let fontsReady: Promise<void> | null = null;

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

async function ensureCertificateFonts() {
  if (fontsReady) return fontsReady;

  fontsReady = (async () => {
    if (typeof FontFace === "undefined" || !document?.fonts) return;

    const fontFaces = [
      new FontFace(
        FONT_LAVANDERIA,
        "url('/certificates/fonts/Lavanderia%20Sturdy.otf')"
      ),
      new FontFace(
        FONT_SANSATION,
        "url('/certificates/fonts/Sansation-Regular.ttf')"
      ),
      new FontFace(
        FONT_SANSATION_BOLD,
        "url('/certificates/fonts/Sansation-Bold.ttf')"
      ),
    ];

    const loadedFonts = await Promise.all(fontFaces.map((font) => font.load()));
    loadedFonts.forEach((font) => document.fonts.add(font));
    await document.fonts.ready;
  })();

  return fontsReady;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Erro ao carregar imagem: ${src}`));
    image.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const paragraphs = text.split("\n");
  const lines: string[] = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      if (paragraphIndex > 0) lines.push("");
      return;
    }

    let currentLine = "";
    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width <= maxWidth || !currentLine) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) lines.push(currentLine);
  });

  return lines;
}

function drawCenteredLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number
) {
  lines.forEach((line, index) => {
    if (!line) return;
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function setFont(
  ctx: CanvasRenderingContext2D,
  size: number,
  family: string,
  weight = "400"
) {
  ctx.font = `${weight} ${size}px "${family}", sans-serif`;
}

function fitCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  initialSize: number,
  minSize: number,
  family: string,
  color: string,
  weight = "400"
) {
  let fontSize = initialSize;
  setFont(ctx, fontSize, family, weight);
  while (fontSize > minSize && ctx.measureText(text).width > maxWidth) {
    fontSize -= 2;
    setFont(ctx, fontSize, family, weight);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawTextLayout(
  ctx: CanvasRenderingContext2D,
  certificate: CertificatePDFData
) {
  const template = getCertificateTemplate(certificate.type);
  const title = getCertificateTitle(certificate.type, certificate.title);
  const date = formatLongDate(certificate.issueDate);
  const preName = template?.preName ?? "";
  const bodyText = (template?.bodyText || certificate.description || "")
    .replaceAll("[Nome]", certificate.recipientName)
    .replaceAll("[Data]", date);
  const verse = (template?.verse ?? "")
    .replaceAll("[Nome]", certificate.recipientName)
    .replaceAll("[Data]", date);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  fitCenteredText(
    ctx,
    title,
    CANVAS_WIDTH / 2,
    295,
    1350,
    96,
    62,
    FONT_LAVANDERIA,
    "#202020"
  );

  if (preName) {
    setFont(ctx, 38, FONT_SANSATION, "400");
    ctx.fillStyle = "#1f2933";
    ctx.fillText(preName, CANVAS_WIDTH / 2, 430);
  }

  fitCenteredText(
    ctx,
    certificate.recipientName,
    CANVAS_WIDTH / 2,
    preName ? 545 : 485,
    1320,
    104,
    58,
    FONT_LAVANDERIA,
    "#111111"
  );

  setFont(ctx, 36, FONT_SANSATION, "400");
  ctx.fillStyle = "#1f2933";
  const bodyLines = wrapText(ctx, bodyText, 1280);
  const bodyStartY = preName ? 645 : 585;
  drawCenteredLines(ctx, bodyLines, CANVAS_WIDTH / 2, bodyStartY, 48);

  if (verse) {
    setFont(ctx, 44, FONT_LAVANDERIA, "400");
    ctx.fillStyle = "#1a1a1a";
    const verseLines = wrapText(ctx, verse, 1380);
    const verseY = Math.max(900, bodyStartY + bodyLines.length * 48 + 70);
    drawCenteredLines(ctx, verseLines, CANVAS_WIDTH / 2, verseY, 54);
  }

  setFont(ctx, 18, FONT_SANSATION, "400");
  ctx.fillStyle = "rgba(80,80,80,0.75)";
  ctx.textAlign = "left";
  ctx.fillText(`Registro: ${certificate.id}`, 80, CANVAS_HEIGHT - 58);
}

export async function renderCertificateDataUrl(certificate: CertificatePDFData) {
  const template = getCertificateTemplate(certificate.type);
  if (!template) {
    throw new Error("Modelo de certificado inválido.");
  }

  await ensureCertificateFonts();

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível para gerar certificado.");

  const background = await loadImage(template.backgroundPath);
  ctx.drawImage(background, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawTextLayout(ctx, certificate);

  return canvas.toDataURL("image/png");
}

export async function generateCertificatePDF(certificate: CertificatePDFData) {
  const dataUrl = await renderCertificateDataUrl(certificate);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  doc.addImage(dataUrl, "PNG", 0, 0, width, height);
  doc.save(`Certificado_${sanitizeFileName(certificate.recipientName)}.pdf`);
}
