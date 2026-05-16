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

const FORMAT_CONFIG: Record<BirthdayFormat, { label: string; width: number; height: number; file: string }> = {
  portrait: { label: "9:16", width: 1080, height: 1920, file: "9x16" },
  landscape: { label: "16:9", width: 1920, height: 1080, file: "16x9" },
};

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

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Erro ao carregar imagem: ${src}`));
    image.src = src;
  });
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

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  initialSize: number,
  minSize: number,
  weight = "700"
) {
  let size = initialSize;
  ctx.font = `${weight} ${size}px "DM Sans", Arial, sans-serif`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px "DM Sans", Arial, sans-serif`;
  }
}

function drawInitials(
  ctx: CanvasRenderingContext2D,
  person: BirthdayPerson,
  x: number,
  y: number,
  radius: number
) {
  ctx.fillStyle = "#dbeafe";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#174a96";
  ctx.font = `700 ${radius * 0.45}px "DM Sans", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(person.initials, x, y);
  ctx.textBaseline = "alphabetic";
}

async function drawAvatar(
  ctx: CanvasRenderingContext2D,
  person: BirthdayPerson,
  src: string | null,
  x: number,
  y: number,
  radius: number
) {
  if (!src) {
    drawInitials(ctx, person, x, y, radius);
    return;
  }

  try {
    const image = await loadImage(src);
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    drawCoverImage(ctx, image, x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  } catch {
    drawInitials(ctx, person, x, y, radius);
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
  await document.fonts.ready;

  const config = FORMAT_CONFIG[format];
  const canvas = document.createElement("canvas");
  canvas.width = config.width;
  canvas.height = config.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível.");

  const gradient = ctx.createLinearGradient(0, 0, config.width, config.height);
  gradient.addColorStop(0, "#f8fbff");
  gradient.addColorStop(0.48, "#ffffff");
  gradient.addColorStop(1, "#eef5ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, config.width, config.height);

  ctx.fillStyle = "#174a96";
  ctx.fillRect(0, 0, config.width, Math.round(config.height * 0.018));
  ctx.fillStyle = "#f2b705";
  ctx.fillRect(0, Math.round(config.height * 0.018), config.width, Math.round(config.height * 0.008));

  ctx.strokeStyle = "rgba(23, 74, 150, 0.12)";
  ctx.lineWidth = format === "portrait" ? 3 : 4;
  for (let y = Math.round(config.height * 0.18); y < config.height; y += 72) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(config.width, y - 42);
    ctx.stroke();
  }

  const logo = await loadImage("/logo.png").catch(() => null);
  if (logo) {
    const logoWidth = format === "portrait" ? 180 : 210;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    ctx.drawImage(logo, format === "portrait" ? 70 : 90, format === "portrait" ? 80 : 70, logoWidth, logoHeight);
  }

  const photoSrc = manualPhotoDataUrl || person.photoUrl;
  const titleColor = "#174a96";
  const gold = "#b98105";

  if (format === "portrait") {
    await drawAvatar(ctx, person, photoSrc, 540, 360, 150);

    ctx.fillStyle = gold;
    ctx.font = '700 44px "DM Sans", Arial, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("Feliz aniversário", 540, 610);

    ctx.fillStyle = titleColor;
    fitText(ctx, person.name, 850, 76, 44);
    ctx.fillText(person.name, 540, 705);

    ctx.fillStyle = "#253044";
    ctx.font = '500 42px "DM Sans", Arial, sans-serif';
    drawWrappedText(ctx, message, 540, 840, 820, 58);

    ctx.fillStyle = titleColor;
    ctx.font = '700 38px "DM Sans", Arial, sans-serif';
    drawWrappedText(ctx, verse, 540, 1420, 780, 54);

    ctx.fillStyle = "#5b6472";
    ctx.font = '600 28px "DM Sans", Arial, sans-serif';
    ctx.fillText("Igreja Evangélica Avivamento Bíblico", 540, 1705);
  } else {
    await drawAvatar(ctx, person, photoSrc, 450, 450, 180);

    ctx.textAlign = "left";
    ctx.fillStyle = gold;
    ctx.font = '700 48px "DM Sans", Arial, sans-serif';
    ctx.fillText("Feliz aniversário", 760, 255);

    ctx.fillStyle = titleColor;
    fitText(ctx, person.name, 960, 86, 48);
    ctx.textAlign = "left";
    ctx.fillText(person.name, 760, 355);

    ctx.fillStyle = "#253044";
    ctx.font = '500 40px "DM Sans", Arial, sans-serif';
    drawWrappedText(ctx, message, 760, 470, 900, 56, "left");

    ctx.fillStyle = titleColor;
    ctx.font = '700 34px "DM Sans", Arial, sans-serif';
    drawWrappedText(ctx, verse, 760, 780, 860, 48, "left");

    ctx.fillStyle = "#5b6472";
    ctx.font = '600 26px "DM Sans", Arial, sans-serif';
    ctx.fillText("Igreja Evangélica Avivamento Bíblico", 760, 950);
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
