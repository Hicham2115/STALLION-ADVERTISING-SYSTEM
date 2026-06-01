-- AlterTable
ALTER TABLE "client_kpi_configs" ADD COLUMN IF NOT EXISTS "metaTokenExpiresAt" TIMESTAMP(3);
