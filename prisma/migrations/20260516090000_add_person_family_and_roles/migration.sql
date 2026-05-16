-- Remove profession and add ecclesiastical/family data to people.
ALTER TABLE "people" DROP COLUMN IF EXISTS "profession";

ALTER TABLE "people"
  ADD COLUMN "ecclesiasticalRole" TEXT NOT NULL DEFAULT 'NENHUM',
  ADD COLUMN "churchLocationId" TEXT;

CREATE TABLE "person_children" (
  "id" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "childPersonId" TEXT,
  "manualName" TEXT,
  "manualBirthDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "person_children_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "person_children_parentId_idx" ON "person_children"("parentId");
CREATE INDEX "person_children_childPersonId_idx" ON "person_children"("childPersonId");

ALTER TABLE "people"
  ADD CONSTRAINT "people_churchLocationId_fkey"
  FOREIGN KEY ("churchLocationId") REFERENCES "church_locations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "person_children"
  ADD CONSTRAINT "person_children_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "people"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "person_children"
  ADD CONSTRAINT "person_children_childPersonId_fkey"
  FOREIGN KEY ("childPersonId") REFERENCES "people"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
