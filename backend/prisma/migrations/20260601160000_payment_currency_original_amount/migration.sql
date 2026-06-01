-- AlterTable
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'MAD';
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "originalAmount" DOUBLE PRECISION;

-- Backfill for existing rows (treat stored MAD as the original amount)
UPDATE "payments"
SET "originalAmount" = "amount"
WHERE "originalAmount" IS NULL;
