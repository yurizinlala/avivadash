-- Align the migration history with the current Prisma schema.
-- These statements are intentionally idempotent because some columns were
-- previously added manually in production.

ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "cpf" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "people_cpf_key" ON "people"("cpf");

ALTER TABLE "cells" ADD COLUMN IF NOT EXISTS "coverUrl" TEXT;
ALTER TABLE "cells" ADD COLUMN IF NOT EXISTS "foundedAt" TIMESTAMP(3);
ALTER TABLE "cells" ADD COLUMN IF NOT EXISTS "leaderId" TEXT;
ALTER TABLE "cells" ADD COLUMN IF NOT EXISTS "leaderCpf" TEXT;
ALTER TABLE "cells" ADD COLUMN IF NOT EXISTS "leaderBirthDate" TIMESTAMP(3);
ALTER TABLE "cells" ADD COLUMN IF NOT EXISTS "cep" TEXT;
ALTER TABLE "cells" ADD COLUMN IF NOT EXISTS "street" TEXT;
ALTER TABLE "cells" ADD COLUMN IF NOT EXISTS "number" TEXT;
ALTER TABLE "cells" ADD COLUMN IF NOT EXISTS "complement" TEXT;
ALTER TABLE "cells" ADD COLUMN IF NOT EXISTS "neighborhood" TEXT;
ALTER TABLE "cells" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "cells" ADD COLUMN IF NOT EXISTS "state" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cells'
      AND column_name = 'address'
  ) THEN
    UPDATE "cells"
    SET "street" = "address"
    WHERE "street" IS NULL
      AND "address" IS NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'cells_leaderId_fkey'
  ) THEN
    ALTER TABLE "cells"
      ADD CONSTRAINT "cells_leaderId_fkey"
      FOREIGN KEY ("leaderId") REFERENCES "people"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
