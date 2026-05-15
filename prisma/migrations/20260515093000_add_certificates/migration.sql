CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "description" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "eventDate" TIMESTAMP(3),
    "issuerName" TEXT,
    "personId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "certificates"
ADD CONSTRAINT "certificates_personId_fkey"
FOREIGN KEY ("personId") REFERENCES "people"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
