-- CreateTable
CREATE TABLE "church_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CONGREGACAO',
    "cep" TEXT,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "church_locations_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "events" ADD COLUMN "churchLocationId" TEXT;

-- CreateIndex
CREATE INDEX "events_churchLocationId_idx" ON "events"("churchLocationId");

-- AddForeignKey
ALTER TABLE "events"
ADD CONSTRAINT "events_churchLocationId_fkey"
FOREIGN KEY ("churchLocationId")
REFERENCES "church_locations"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- SeedData
INSERT INTO "church_locations" (
    "id",
    "name",
    "type",
    "cep",
    "street",
    "number",
    "neighborhood",
    "city",
    "state",
    "createdAt",
    "updatedAt"
) VALUES
(
    'church-location-sede',
    'Sede',
    'SEDE',
    '59073-150',
    'Rua Monte Rei',
    '1161',
    'Planalto',
    'Natal',
    'RN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'church-location-zona-norte',
    'Congregação Zona Norte',
    'CONGREGACAO',
    '59115-570',
    'Rua Artesão Dary Miranda',
    '1038',
    'Nossa Sra. da Apresentação',
    'Natal',
    'RN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
