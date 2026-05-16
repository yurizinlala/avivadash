"use client";

import React from "react";
import Image from "next/image";
import { Cake, Download, ImagePlus, MessageSquare, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { AppCard, SectionHeader } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface BirthdayPerson {
  id: string;
  name: string;
  age: number | null;
  type: string;
  initials: string;
  photoUrl: string | null;
  phone: string | null;
  birthDate: string | null;
}

type BirthdayFormat = "portrait" | "landscape";

type BirthdayTextTemplate = {
  message: string;
  verse: string;
};

const FORMAT_CONFIG: Record<
  BirthdayFormat,
  { label: string; width: number; height: number; file: string; background: string }
> = {
  portrait: {
    label: "9:16",
    width: 1080,
    height: 1920,
    file: "9x16",
    background: "/birthday/backgrounds/fundo-9-16.png",
  },
  landscape: {
    label: "16:9",
    width: 1920,
    height: 1080,
    file: "16x9",
    background: "/birthday/backgrounds/fundo-16-9.png",
  },
};

const FONT_SCRIPT = "BirthdayLavanderia";
const FONT_SCRIPT_PLAIN = "BirthdayLavanderiaPlain";
const FONT_SANSATION = "BirthdaySansation";
const FONT_SANSATION_BOLD = "BirthdaySansationBold";
const GOLD = "#d2ad62";
const TEXT = "#111111";

let birthdayFontsReady: Promise<void> | null = null;

function getBirthdayTemplate(person: BirthdayPerson): BirthdayTextTemplate {
  const age = person.age ?? 30;
  const greeting = `A IEAB celebra sua vida com alegria, ${person.name}.`;

  if (age <= 12) {
    return {
      message: `${greeting} Que Jesus guarde seu coração, conduza seus passos e faça este novo ciclo florescer com amor, aprendizado e alegria na presença de Deus.`,
      verse: '"Deixai vir a mim os pequeninos..." - Marcos 10:14',
    };
  }

  if (age <= 17) {
    return {
      message: `${greeting} Que sua juventude seja marcada por sabedoria, bons testemunhos e crescimento firme na fé, sempre debaixo do cuidado do Senhor.`,
      verse: '"Ninguém despreze a tua mocidade..." - 1 Timóteo 4:12',
    };
  }

  if (age <= 29) {
    return {
      message: `${greeting} Que este novo ciclo fortaleça seus sonhos, sua comunhão com Deus e sua caminhada com propósito no Reino.`,
      verse: '"Lembra-te do teu Criador nos dias da tua mocidade." - Eclesiastes 12:1',
    };
  }

  if (age <= 59) {
    return {
      message: `${greeting} Que o Senhor renove suas forças, abençoe sua família e conduza cada decisão deste novo ano com graça, paz e direção.`,
      verse: '"O Senhor te abençoe e te guarde." - Números 6:24',
    };
  }

  return {
    message: `${greeting} Louvamos a Deus por sua história, por seus frutos e por cada testemunho construído ao longo da caminhada.`,
    verse: '"Na velhice ainda darão frutos..." - Salmos 92:14',
  };
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase()
    .slice(0, 80);
}

function normalizeWhatsappPhone(phone: string | null) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function normalizeCardText(text: string) {
  return text
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([,.!?;:])(?=\S)/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

function getBirthdayDisplayName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const shortName = parts.length >= 2 ? parts.slice(0, 2).join(" ") : name.trim();
  return `${shortName}!`;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Erro ao carregar imagem: ${src}`));
    image.src = src;
  });
}

async function ensureBirthdayFonts() {
  if (birthdayFontsReady) return birthdayFontsReady;

  birthdayFontsReady = (async () => {
    if (typeof FontFace === "undefined" || !document?.fonts) return;

    const fontFaces = [
      new FontFace(FONT_SCRIPT, "url('/certificates/fonts/Lavanderia%20Sturdy.otf')"),
      new FontFace(
        FONT_SCRIPT_PLAIN,
        "url('/certificates/fonts/Lavanderia%20Sturdy.otf')",
        {
          featureSettings: '"liga" 0, "clig" 0, "calt" 0, "swsh" 0, "salt" 0',
        } as FontFaceDescriptors & { featureSettings: string }
      ),
      new FontFace(FONT_SANSATION, "url('/certificates/fonts/Sansation-Regular.ttf')"),
      new FontFace(FONT_SANSATION_BOLD, "url('/certificates/fonts/Sansation-Bold.ttf')"),
    ];

    const loadedFonts = await Promise.all(fontFaces.map((font) => font.load()));
    loadedFonts.forEach((font) => document.fonts.add(font));
    await document.fonts.ready;
  })();

  return birthdayFontsReady;
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(
    image,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (!line || ctx.measureText(testLine).width <= maxWidth) {
      line = testLine;
      return;
    }
    lines.push(line);
    line = word;
  });

  if (line) lines.push(line);
  return lines;
}

function setCanvasLetterSpacing(ctx: CanvasRenderingContext2D, letterSpacing: number) {
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
    `${letterSpacing}px`;
}

function resetCanvasLetterSpacing(ctx: CanvasRenderingContext2D) {
  setCanvasLetterSpacing(ctx, 0);
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: CanvasTextAlign = "center"
) {
  ctx.textAlign = align;
  wrapText(ctx, text, maxWidth).forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function fitScriptText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  initialSize: number,
  minSize: number,
  letterSpacing: number
) {
  let size = initialSize;
  setCanvasLetterSpacing(ctx, letterSpacing);
  ctx.font = `400 ${size}px "${FONT_SCRIPT}", "DM Sans", Arial, sans-serif`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `400 ${size}px "${FONT_SCRIPT}", "DM Sans", Arial, sans-serif`;
  }
}

function measureLetterSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number
) {
  return text.split("").reduce((width, char, index) => {
    return width + ctx.measureText(char).width + (index > 0 ? letterSpacing : 0);
  }, 0);
}

function drawLetterSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number,
  align: CanvasTextAlign = "center"
) {
  const chars = text.split("");
  const width = measureLetterSpacedText(ctx, text, letterSpacing);
  let currentX = align === "center" ? x - width / 2 : align === "right" ? x - width : x;

  chars.forEach((char, index) => {
    if (index > 0) currentX += letterSpacing;
    ctx.fillText(char, currentX, y);
    currentX += ctx.measureText(char).width;
  });
}

function fitTextBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  initialSize: number,
  minSize: number,
  lineHeightRatio = 1.32
) {
  let size = initialSize;
  let lineHeight = Math.round(size * lineHeightRatio);
  let lines: string[] = [];

  while (size >= minSize) {
    ctx.font = `400 ${size}px "${FONT_SANSATION}", "DM Sans", Arial, sans-serif`;
    lines = wrapText(ctx, text, maxWidth);
    lineHeight = Math.round(size * lineHeightRatio);
    if (lines.length * lineHeight <= maxHeight) break;
    size -= 2;
  }

  return { lines, lineHeight };
}

function drawTextLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
  align: CanvasTextAlign = "center"
) {
  ctx.textAlign = align;
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function drawPhotoPlaceholder(
  ctx: CanvasRenderingContext2D,
  person: BirthdayPerson,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.fillStyle = "#e9eef5";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#174a96";
  ctx.font = `700 ${Math.min(width, height) * 0.16}px "${FONT_SANSATION_BOLD}", "DM Sans", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(person.initials, x + width / 2, y + height / 2);
  ctx.textBaseline = "alphabetic";
}

async function drawPolaroidPhoto(
  ctx: CanvasRenderingContext2D,
  person: BirthdayPerson,
  src: string | null,
  frame: { x: number; y: number; width: number; height: number; padding: number; bottom: number }
) {
  ctx.save();
  ctx.shadowColor = "rgba(31, 41, 55, 0.18)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
  ctx.restore();

  ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);

  const photo = {
    x: frame.x + frame.padding,
    y: frame.y + frame.padding,
    width: frame.width - frame.padding * 2,
    height: frame.height - frame.padding - frame.bottom,
  };

  if (!src) {
    drawPhotoPlaceholder(ctx, person, photo.x, photo.y, photo.width, photo.height);
    return;
  }

  try {
    const image = await loadImage(src);
    ctx.save();
    ctx.beginPath();
    ctx.rect(photo.x, photo.y, photo.width, photo.height);
    ctx.clip();
    drawCoverImage(ctx, image, photo.x, photo.y, photo.width, photo.height);
    ctx.restore();
  } catch {
    drawPhotoPlaceholder(ctx, person, photo.x, photo.y, photo.width, photo.height);
  }
}

async function generateBirthdayImage({
  person,
  message,
  verse,
  format,
  manualPhotoDataUrl,
}: {
  person: BirthdayPerson;
  message: string;
  verse: string;
  format: BirthdayFormat;
  manualPhotoDataUrl: string | null;
}) {
  await ensureBirthdayFonts();

  const config = FORMAT_CONFIG[format];
  const canvas = document.createElement("canvas");
  canvas.width = config.width;
  canvas.height = config.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível.");

  const background = await loadImage(config.background);
  ctx.drawImage(background, 0, 0, config.width, config.height);

  const photoSrc = manualPhotoDataUrl || person.photoUrl;
  const displayName = getBirthdayDisplayName(person.name);
  const normalizedMessage = normalizeCardText(message).toUpperCase();
  const normalizedVerse = normalizeCardText(verse);

  if (format === "portrait") {
    await drawPolaroidPhoto(ctx, person, photoSrc, {
      x: 234,
      y: 236,
      width: 590,
      height: 835,
      padding: 18,
      bottom: 44,
    });

    ctx.fillStyle = TEXT;
    ctx.font = `700 34px "${FONT_SANSATION_BOLD}", "DM Sans", Arial, sans-serif`;
    drawLetterSpacedText(ctx, "PARABÉNS", 540, 1130, 12);

    ctx.fillStyle = GOLD;
    fitScriptText(ctx, displayName, 1060, 128, 74, 2);
    ctx.textAlign = "center";
    ctx.fillText(displayName, 540, 1278);
    resetCanvasLetterSpacing(ctx);

    ctx.fillStyle = TEXT;
    const portraitMessage = fitTextBlock(
      ctx,
      normalizedMessage,
      810,
      178,
      31,
      24,
      1.36
    );
    ctx.font = `400 ${Math.round(portraitMessage.lineHeight / 1.36)}px "${FONT_SANSATION}", "DM Sans", Arial, sans-serif`;
    resetCanvasLetterSpacing(ctx);
    drawTextLines(
      ctx,
      portraitMessage.lines,
      540,
      1394,
      portraitMessage.lineHeight
    );

    ctx.fillStyle = GOLD;
    ctx.font = `400 44px "${FONT_SCRIPT_PLAIN}", "DM Sans", Arial, sans-serif`;
    resetCanvasLetterSpacing(ctx);
    drawWrappedText(ctx, normalizedVerse, 540, 1634, 810, 56);
  } else {
    await drawPolaroidPhoto(ctx, person, photoSrc, {
      x: 182,
      y: 156,
      width: 535,
      height: 760,
      padding: 16,
      bottom: 28,
    });

    ctx.fillStyle = TEXT;
    ctx.font = `700 34px "${FONT_SANSATION_BOLD}", "DM Sans", Arial, sans-serif`;
    drawLetterSpacedText(ctx, "PARABÉNS!", 925, 292, 14);

    ctx.fillStyle = GOLD;
    fitScriptText(ctx, displayName, 1060, 144, 78, 2);
    ctx.textAlign = "left";
    ctx.fillText(displayName, 750, 455);
    resetCanvasLetterSpacing(ctx);

    ctx.fillStyle = TEXT;
    const landscapeMessage = fitTextBlock(
      ctx,
      normalizedMessage,
      980,
      136,
      31,
      23,
      1.28
    );
    ctx.font = `400 ${Math.round(landscapeMessage.lineHeight / 1.28)}px "${FONT_SANSATION}", "DM Sans", Arial, sans-serif`;
    resetCanvasLetterSpacing(ctx);
    drawTextLines(
      ctx,
      landscapeMessage.lines,
      750,
      565,
      landscapeMessage.lineHeight,
      "left"
    );

    ctx.fillStyle = GOLD;
    ctx.font = `400 40px "${FONT_SCRIPT_PLAIN}", "DM Sans", Arial, sans-serif`;
    resetCanvasLetterSpacing(ctx);
    drawWrappedText(ctx, normalizedVerse, 750, 755, 980, 50, "left");
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Erro ao gerar imagem."));
    }, "image/png");
  });
}

export function BirthdayCard({ people }: { people: BirthdayPerson[] }) {
  const [selectedPerson, setSelectedPerson] = React.useState<BirthdayPerson | null>(null);
  const [format, setFormat] = React.useState<BirthdayFormat>("portrait");
  const [message, setMessage] = React.useState("");
  const [verse, setVerse] = React.useState("");
  const [manualPhotoDataUrl, setManualPhotoDataUrl] = React.useState<string | null>(null);
  const [manualPhotoName, setManualPhotoName] = React.useState("");
  const [generating, setGenerating] = React.useState(false);

  function openWhatsapp(person: BirthdayPerson) {
    const phone = normalizeWhatsappPhone(person.phone);
    if (!phone) {
      toast.error("Esta pessoa não possui WhatsApp cadastrado.");
      return;
    }

    const text = `Olá, ${person.name}! A IEAB deseja um feliz aniversário. Que Deus abençoe este novo ciclo com graça, saúde, paz e crescimento na presença do Senhor.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  }

  function openImageDialog(person: BirthdayPerson) {
    const template = getBirthdayTemplate(person);
    setSelectedPerson(person);
    setFormat("portrait");
    setMessage(template.message);
    setVerse(template.verse);
    setManualPhotoDataUrl(null);
    setManualPhotoName("");
  }

  async function handleManualPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setManualPhotoDataUrl(String(reader.result));
      setManualPhotoName(file.name);
    };
    reader.onerror = () => toast.error("Erro ao carregar a imagem.");
    reader.readAsDataURL(file);
  }

  async function handleDownloadImage() {
    if (!selectedPerson) return;

    setGenerating(true);
    try {
      const blob = await generateBirthdayImage({
        person: selectedPerson,
        message,
        verse,
        format,
        manualPhotoDataUrl,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `aniversario_${sanitizeFileName(selectedPerson.name)}_${FORMAT_CONFIG[format].file}_${new Date()
        .toISOString()
        .slice(0, 10)}.png`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Imagem gerada com sucesso.");
    } catch {
      toast.error("Erro ao gerar imagem de aniversário.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <AppCard>
        <SectionHeader
          icon={Cake}
          title="Aniversariantes do dia"
          description="Pessoas para celebrar e acompanhar hoje"
          action={
            <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold-muted dark:text-gold">
              Celebração
            </span>
          }
          className="mb-5"
        />

        <div className="space-y-3">
          {people.length === 0 ? (
            <p className="rounded-lg bg-surface-low p-4 text-center text-sm text-muted-foreground">
              Nenhum aniversariante hoje
            </p>
          ) : (
            people.map((person) => (
              <div key={person.id} className="item-row flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {person.photoUrl ? (
                      <Image
                        src={person.photoUrl}
                        alt={person.name}
                        fill
                        sizes="36px"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      person.initials
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {person.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {person.age ? `${person.age} anos` : "Idade não informada"} · {person.type}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="text-muted-foreground hover:bg-success/10 hover:text-success"
                    onClick={() => openWhatsapp(person)}
                    aria-label={`Enviar WhatsApp para ${person.name}`}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    onClick={() => openImageDialog(person)}
                    aria-label={`Criar imagem de aniversário para ${person.name}`}
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </AppCard>

      <Dialog open={Boolean(selectedPerson)} onOpenChange={(open) => !open && setSelectedPerson(null)}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Imagem de aniversário</DialogTitle>
            <DialogDescription>
              Revise a mensagem, escolha o formato e baixe a arte em PNG.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-high p-1">
              {(["portrait", "landscape"] as BirthdayFormat[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFormat(option)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    format === option
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {FORMAT_CONFIG[option].label}
                </button>
              ))}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Mensagem</Label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="mt-1.5 w-full resize-none rounded-xl border-0 bg-surface-high p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Versículo</Label>
              <Input
                value={verse}
                onChange={(e) => setVerse(e.target.value)}
                className="mt-1.5 h-10 rounded-xl border-0 bg-surface-high"
              />
            </div>

            <div className="rounded-xl bg-surface-high p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Foto manual</p>
                  <p className="text-xs text-muted-foreground">
                    Usada somente nesta arte, sem alterar o cadastro.
                  </p>
                </div>
                <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                  <Upload className="h-3.5 w-3.5" />
                  Escolher imagem
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handleManualPhotoChange}
                  />
                </label>
              </div>
              {manualPhotoName && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-background px-3 py-2 text-xs text-muted-foreground">
                  <span className="truncate">{manualPhotoName}</span>
                  <button
                    type="button"
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    onClick={() => {
                      setManualPhotoDataUrl(null);
                      setManualPhotoName("");
                    }}
                    aria-label="Remover imagem manual"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSelectedPerson(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="brand" onClick={handleDownloadImage} disabled={generating}>
              {generating ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Baixar PNG
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
