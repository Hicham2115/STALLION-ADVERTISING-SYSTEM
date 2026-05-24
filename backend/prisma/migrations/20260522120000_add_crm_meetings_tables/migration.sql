-- CreateEnum (safe, skip if exists)
DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('NEW','PENDING_CONFIRMATION','CONFIRMED','NO_ANSWER','CANCELLED','REFUSED','SHIPPED','DELIVERED','RETURNED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "OrderPaymentStatus" AS ENUM ('PAID','COD_PENDING','REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "OrderSource" AS ENUM ('FACEBOOK_ADS','TIKTOK_ADS','GOOGLE_ADS','ORGANIC','WHATSAPP','INSTAGRAM','OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "CommissionType" AS ENUM ('FIXED_PER_ORDER','PERCENTAGE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED','CONFIRMED','COMPLETED','CANCELLED','RESCHEDULED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable: meeting_types
CREATE TABLE IF NOT EXISTS "meeting_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#f59e0b',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meeting_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable: admin_availability
CREATE TABLE IF NOT EXISTS "admin_availability" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Casablanca',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable: blocked_dates
CREATE TABLE IF NOT EXISTS "blocked_dates" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "blockedDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blocked_dates_pkey" PRIMARY KEY ("id")
);
 
-- CreateTable: meetings
CREATE TABLE IF NOT EXISTS "meetings" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "adminId" TEXT NOT NULL,
    "meetingTypeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "meetingLink" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Casablanca',
    "notes" TEXT,
    "internalNotes" TEXT,
    "cancelReason" TEXT,
    "bookedByPortalUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: crm_customers
CREATE TABLE IF NOT EXISTS "crm_customers" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "totalSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable: crm_orders
CREATE TABLE IF NOT EXISTS "crm_orders" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "closerId" TEXT,
    "customerId" TEXT,
    "shopifyOrderId" TEXT,
    "shopifyStore" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerCity" TEXT,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "orderAmount" DOUBLE PRECISION NOT NULL,
    "productCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closerCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "paymentStatus" "OrderPaymentStatus" NOT NULL DEFAULT 'COD_PENDING',
    "source" "OrderSource" NOT NULL DEFAULT 'OTHER',
    "notes" TEXT,
    "closerNotes" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable: shopify_configs (safe)
CREATE TABLE IF NOT EXISTS "shopify_configs" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "storeUrl" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shopify_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: commission_rules
CREATE TABLE IF NOT EXISTS "commission_rules" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "closerId" TEXT,
    "name" TEXT NOT NULL,
    "type" "CommissionType" NOT NULL DEFAULT 'FIXED_PER_ORDER',
    "fixedAmount" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable: closer_commission_records
CREATE TABLE IF NOT EXISTS "closer_commission_records" (
    "id" TEXT NOT NULL,
    "closerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "closer_commission_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable: client_closers
CREATE TABLE IF NOT EXISTS "client_closers" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "client_closers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey (safe)
DO $$ BEGIN
  ALTER TABLE "admin_availability" ADD CONSTRAINT "admin_availability_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "blocked_dates" ADD CONSTRAINT "blocked_dates_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "meetings" ADD CONSTRAINT "meetings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "meetings" ADD CONSTRAINT "meetings_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "meetings" ADD CONSTRAINT "meetings_meetingTypeId_fkey" FOREIGN KEY ("meetingTypeId") REFERENCES "meeting_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "crm_customers" ADD CONSTRAINT "crm_customers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "crm_orders" ADD CONSTRAINT "crm_orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "crm_orders" ADD CONSTRAINT "crm_orders_closerId_fkey" FOREIGN KEY ("closerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "crm_orders" ADD CONSTRAINT "crm_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "crm_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "shopify_configs" ADD CONSTRAINT "shopify_configs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_closerId_fkey" FOREIGN KEY ("closerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "closer_commission_records" ADD CONSTRAINT "closer_commission_records_closerId_fkey" FOREIGN KEY ("closerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "closer_commission_records" ADD CONSTRAINT "closer_commission_records_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "crm_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "client_closers" ADD CONSTRAINT "client_closers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "client_closers" ADD CONSTRAINT "client_closers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- UniqueConstraints (safe)
DO $$ BEGIN
  ALTER TABLE "admin_availability" ADD CONSTRAINT "admin_availability_adminId_dayOfWeek_key" UNIQUE ("adminId", "dayOfWeek");
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "client_closers" ADD CONSTRAINT "client_closers_clientId_userId_key" UNIQUE ("clientId", "userId");
EXCEPTION WHEN duplicate_object THEN null; END $$;
