-- Safe idempotent migration: ensure all portal & supporting tables exist

-- Enums (safe)
DO $$ BEGIN
  CREATE TYPE "ContentCategory" AS ENUM ('SOCIAL_POST','REEL','VIDEO','AD_CREATIVE','BANNER','THUMBNAIL','BRANDING','OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ContentStatus" AS ENUM ('DRAFT','WAITING_APPROVAL','APPROVED','NEEDS_REVISION','PUBLISHED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ProjectPhase" AS ENUM ('DISCOVERY','PLANNING','DESIGN','DEVELOPMENT','TESTING','DEPLOYMENT','MAINTENANCE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- client_portal_users
CREATE TABLE IF NOT EXISTS "client_portal_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "client_portal_users_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  CREATE UNIQUE INDEX "client_portal_users_email_key" ON "client_portal_users"("email");
EXCEPTION WHEN duplicate_table THEN null; END $$;
DO $$ BEGIN
  CREATE UNIQUE INDEX "client_portal_users_clientId_key" ON "client_portal_users"("clientId");
EXCEPTION WHEN duplicate_table THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "client_portal_users" ADD CONSTRAINT "client_portal_users_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- project_updates
CREATE TABLE IF NOT EXISTS "project_updates" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "phase" "ProjectPhase",
    "imageUrl" TEXT,
    "fileUrl" TEXT,
    "postedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_updates_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_postedById_fkey"
    FOREIGN KEY ("postedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- update_comments
CREATE TABLE IF NOT EXISTS "update_comments" (
    "id" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isClient" BOOLEAN NOT NULL DEFAULT false,
    "authorName" TEXT NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "update_comments_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "update_comments" ADD CONSTRAINT "update_comments_updateId_fkey"
    FOREIGN KEY ("updateId") REFERENCES "project_updates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- content_deliveries
CREATE TABLE IF NOT EXISTS "content_deliveries" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "previewUrl" TEXT,
    "externalLink" TEXT,
    "category" "ContentCategory" NOT NULL DEFAULT 'OTHER',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "uploadedById" TEXT NOT NULL,
    "clientComment" TEXT,
    "revisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "content_deliveries_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "content_deliveries" ADD CONSTRAINT "content_deliveries_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "content_deliveries" ADD CONSTRAINT "content_deliveries_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- client_notifications
CREATE TABLE IF NOT EXISTS "client_notifications" (
    "id" TEXT NOT NULL,
    "clientPortalUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "client_notifications_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "client_notifications" ADD CONSTRAINT "client_notifications_clientPortalUserId_fkey"
    FOREIGN KEY ("clientPortalUserId") REFERENCES "client_portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- client_kpi_configs
CREATE TABLE IF NOT EXISTS "client_kpi_configs" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL, 
    "metaToken" TEXT,
    "metaAdAccountId" TEXT, 
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "client_kpi_configs_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  CREATE UNIQUE INDEX "client_kpi_configs_clientId_key" ON "client_kpi_configs"("clientId");
EXCEPTION WHEN duplicate_table THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "client_kpi_configs" ADD CONSTRAINT "client_kpi_configs_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- client_costs (from migration 20260518120000)
CREATE TABLE IF NOT EXISTS "client_costs" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "client_costs_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "client_costs" ADD CONSTRAINT "client_costs_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
