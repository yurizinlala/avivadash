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
const FONT_LAVANDERIA_PLAIN = "CertificateLavanderiaPlain";
const FONT_SANSATION = "CertificateSansation";
const FONT_SANSATION_BOLD = "CertificateSansationBold";

type TextStyle = {
  family: string;
  size: number;
  color: string;
  weight?: string;
};

type StyledTextSegment = TextStyle & {
  text: string;
};

type StyledWord = TextStyle & {
  text: string;
};

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
        FONT_LAVANDERIA_PLAIN,
        "url('/certificates/fonts/Lavanderia%20Sturdy.otf')",
        {
          featureSettings: '"liga" 0, "clig" 0, "calt" 0, "swsh" 0, "salt" 0',
        } as FontFaceDescriptors & { featureSettings: string }
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

function buildDateHighlightedSegments(
  bodyTemplate: string,
  date: string,
  titleColor: string
): StyledTextSegment[] {
  const regularStyle = {
    family: FONT_SANSATION,
    size: 36,
    color: "#1f2933",
    weight: "400",
  };
  const dateStyle = {
    family: FONT_SANSATION_BOLD,
    size: 36,
    color: titleColor,
    weight: "700",
  };
  const normalizedTemplate = bodyTemplate.replaceAll("[Nome]", "");
  const dateMatch = normalizedTemplate.match(/\b(no dia|na data(?: de)?)\s+\[Data\]/i);

  if (!dateMatch || dateMatch.index === undefined) {
    return [
      {
        ...regularStyle,
        text: normalizedTemplate.replaceAll("[Data]", date),
      },
    ];
  }

  const before = normalizedTemplate.slice(0, dateMatch.index);
  const highlighted = dateMatch[0].replace("[Data]", date);
  const after = normalizedTemplate
    .slice(dateMatch.index + dateMatch[0].length)
    .replaceAll("[Data]", date);

  return [
    { ...regularStyle, text: before },
    { ...dateStyle, text: highlighted },
    { ...regularStyle, text: after },
  ].filter((segment) => segment.text.length > 0);
}

function splitStyledParagraphs(segments: StyledTextSegment[]) {
  const paragraphs: StyledTextSegment[][] = [[]];

  segments.forEach((segment) => {
    segment.text
      .replace(/\r/g, "")
      .split(/\n{2,}/)
      .forEach((part, index) => {
        if (index > 0) paragraphs.push([]);
        if (part.trim()) {
          paragraphs[paragraphs.length - 1].push({ ...segment, text: part });
        }
      });
  });

  return paragraphs.filter((paragraph) => paragraph.length > 0);
}

function measureWord(ctx: CanvasRenderingContext2D, word: StyledWord) {
  setFont(ctx, word.size, word.family, word.weight);
  return ctx.measureText(word.text).width;
}

function measureSpace(ctx: CanvasRenderingContext2D, word: StyledWord) {
  setFont(ctx, word.size, word.family, word.weight);
  return ctx.measureText(" ").width;
}

function measureStyledLine(ctx: CanvasRenderingContext2D, line: StyledWord[]) {
  return line.reduce((width, word, index) => {
    const spaceWidth = index > 0 ? measureSpace(ctx, word) : 0;
    return width + spaceWidth + measureWord(ctx, word);
  }, 0);
}

function wrapStyledParagraph(
  ctx: CanvasRenderingContext2D,
  segments: StyledTextSegment[],
  maxWidth: number
) {
  const words: StyledWord[] = segments.flatMap((segment) =>
    segment.text
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((text) => ({ ...segment, text }))
  );
  const lines: StyledWord[][] = [];
  let currentLine: StyledWord[] = [];

  words.forEach((word) => {
    const testLine = [...currentLine, word];
    if (currentLine.length === 0 || measureStyledLine(ctx, testLine) <= maxWidth) {
      currentLine = testLine;
      return;
    }

    lines.push(currentLine);
    currentLine = [word];
  });

  if (currentLine.length > 0) lines.push(currentLine);
  return lines;
}

function drawStyledCenteredLine(
  ctx: CanvasRenderingContext2D,
  line: StyledWord[],
  centerX: number,
  y: number
) {
  ctx.textAlign = "left";
  const lineWidth = measureStyledLine(ctx, line);
  let x = centerX - lineWidth / 2;

  line.forEach((word, index) => {
    if (index > 0) x += measureSpace(ctx, word);
    setFont(ctx, word.size, word.family, word.weight);
    ctx.fillStyle = word.color;
    ctx.fillText(word.text, x, y);
    x += measureWord(ctx, word);
  });

  ctx.textAlign = "center";
}

function drawStyledParagraphs(
  ctx: CanvasRenderingContext2D,
  paragraphs: StyledTextSegment[][],
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  paragraphGap: number
) {
  let y = startY;
  let lineCount = 0;

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const lines = wrapStyledParagraph(ctx, paragraph, maxWidth);
    lines.forEach((line) => {
      drawStyledCenteredLine(ctx, line, centerX, y);
      y += lineHeight;
      lineCount += 1;
    });
    if (paragraphIndex < paragraphs.length - 1) y += paragraphGap;
  });

  return { bottomY: y, lineCount };
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
  const titleColor = template?.titleColor ?? "#110e49";
  const date = formatLongDate(certificate.issueDate);
  const preName = template?.preName ?? "";
  const bodyTemplate = template?.bodyText || certificate.description || "";
  const bodySegments = buildDateHighlightedSegments(bodyTemplate, date, titleColor);
  const verse = (template?.verse ?? "")
    .replaceAll("[Nome]", certificate.recipientName)
    .replaceAll("[Data]", date);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  fitCenteredText(
    ctx,
    title,
    CANVAS_WIDTH / 2,
    265,
    1580,
    136,
    74,
    FONT_LAVANDERIA,
    titleColor
  );

  if (preName) {
    setFont(ctx, 38, FONT_SANSATION, "400");
    ctx.fillStyle = "#1f2933";
    ctx.fillText(preName, CANVAS_WIDTH / 2, 390);
  }

  fitCenteredText(
    ctx,
    certificate.recipientName,
    CANVAS_WIDTH / 2,
    preName ? 505 : 445,
    1450,
    76,
    48,
    FONT_SANSATION,
    "#111111"
  );

  const bodyStartY = preName ? 610 : 550;
  const bodyLayout = drawStyledParagraphs(
    ctx,
    splitStyledParagraphs(bodySegments),
    CANVAS_WIDTH / 2,
    bodyStartY,
    1620,
    46,
    18
  );

  if (verse) {
    setFont(ctx, 38, FONT_LAVANDERIA_PLAIN, "400");
    ctx.fillStyle = "#1a1a1a";
    const verseLines = wrapText(ctx, verse, 1520);
    const verseY = Math.max(835, bodyLayout.bottomY + 70);
    drawCenteredLines(ctx, verseLines, CANVAS_WIDTH / 2, verseY, 48);
  }
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
