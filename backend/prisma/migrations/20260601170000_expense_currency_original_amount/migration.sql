-- AlterTable
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'MAD';
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "originalAmount" DOUBLE PRECISION;

-- Backfill for existing rows (treat stored MAD as the original amount)
UPDATE "expenses"
SET "originalAmount" = "amount"
WHERE "originalAmount" IS NULL;
