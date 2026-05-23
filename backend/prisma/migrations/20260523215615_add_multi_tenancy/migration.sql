/*
  Warnings:

  - A unique constraint covering the columns `[agencyId,slug]` on the table `channels` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[agencyId,slug]` on the table `company_services` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "channels_name_key";

-- DropIndex
DROP INDEX "channels_slug_key";

-- DropIndex
DROP INDEX "company_services_slug_key";

-- AlterTable
ALTER TABLE "admin_availability" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "channels" ADD COLUMN     "agencyId" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "chat_messages" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "client_kpi_configs" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "client_portal_users" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "agencyId" TEXT;

-- AlterTable
ALTER TABLE "commission_rules" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "company_services" ADD COLUMN     "agencyId" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "content_deliveries" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "conversations" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "crm_customers" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "crm_orders" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "exchange_rates" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "agencyId" TEXT;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "agencyId" TEXT;

-- AlterTable
ALTER TABLE "meeting_types" ADD COLUMN     "agencyId" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "meetings" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "pdfUrl" TEXT;

-- AlterTable
ALTER TABLE "project_updates" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "agencyId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "agencyId" TEXT,
ADD COLUMN     "isCloser" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "agencies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "channels_agencyId_slug_key" ON "channels"("agencyId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "company_services_agencyId_slug_key" ON "company_services"("agencyId", "slug");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_services" ADD CONSTRAINT "company_services_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_types" ADD CONSTRAINT "meeting_types_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
