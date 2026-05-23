-- Idempotent version of add_multi_tenancy migration
-- Safe to re-run after partial failure

-- DropIndex (safe)
DROP INDEX IF EXISTS "channels_name_key";
DROP INDEX IF EXISTS "channels_slug_key";
DROP INDEX IF EXISTS "company_services_slug_key";

-- CreateTable agencies (safe)
CREATE TABLE IF NOT EXISTS "agencies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add columns only if they don't exist yet
ALTER TABLE "channels"         ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "clients"          ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "company_services" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "expenses"         ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "leads"            ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "meeting_types"    ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "payments"         ADD COLUMN IF NOT EXISTS "pdfUrl"   TEXT;
ALTER TABLE "tasks"            ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "users"            ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "users"            ADD COLUMN IF NOT EXISTS "isCloser" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: drop defaults (idempotent — no-op if already dropped)
ALTER TABLE "admin_availability"   ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "channels"             ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "chat_messages"        ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "client_kpi_configs"   ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "client_portal_users"  ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "commission_rules"     ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "company_services"     ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "content_deliveries"   ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "conversations"        ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "crm_customers"        ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "crm_orders"           ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "exchange_rates"       ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "meeting_types"        ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "meetings"             ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "project_updates"      ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex (safe)
CREATE UNIQUE INDEX IF NOT EXISTS "channels_agencyId_slug_key"         ON "channels"("agencyId", "slug");
CREATE UNIQUE INDEX IF NOT EXISTS "company_services_agencyId_slug_key" ON "company_services"("agencyId", "slug");

-- AddForeignKey (safe — skip if constraint already exists)
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_agencyId_fkey"
    FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "clients" ADD CONSTRAINT "clients_agencyId_fkey"
    FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "expenses" ADD CONSTRAINT "expenses_agencyId_fkey"
    FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "leads" ADD CONSTRAINT "leads_agencyId_fkey"
    FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_agencyId_fkey"
    FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "company_services" ADD CONSTRAINT "company_services_agencyId_fkey"
    FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "channels" ADD CONSTRAINT "channels_agencyId_fkey"
    FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "meeting_types" ADD CONSTRAINT "meeting_types_agencyId_fkey"
    FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
