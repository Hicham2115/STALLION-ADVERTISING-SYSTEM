-- AlterTable
ALTER TABLE "client_costs" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'MAD';
