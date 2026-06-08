-- Add productName and commissionAmount to Client
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "productName" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "commissionAmount" DOUBLE PRECISION;

-- Create AgencyCommission table
CREATE TABLE IF NOT EXISTS "agency_commissions" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_commissions_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on clientId
CREATE UNIQUE INDEX IF NOT EXISTS "agency_commissions_clientId_key" ON "agency_commissions"("clientId");

-- Foreign key
ALTER TABLE "agency_commissions" ADD CONSTRAINT "agency_commissions_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
