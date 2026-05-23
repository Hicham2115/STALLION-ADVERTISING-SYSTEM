-- Migrate clients.service (String) → clients.services (String[])
-- Idempotent: safe to re-run after partial failure

-- Step 1: add the new array column (skip if already exists)
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "services" TEXT[] NOT NULL DEFAULT '{}';

-- Step 2: copy existing single-service value into the array
-- Only touches rows where services is still empty and service column still exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'service'
  ) THEN
    UPDATE "clients"
      SET "services" = ARRAY["service"]
      WHERE "service" IS NOT NULL AND "service" <> '' AND array_length("services", 1) IS NULL;
  END IF;
END $$; 

-- Step 3: drop the old column (skip if already gone)
ALTER TABLE "clients" DROP COLUMN IF EXISTS "service";
