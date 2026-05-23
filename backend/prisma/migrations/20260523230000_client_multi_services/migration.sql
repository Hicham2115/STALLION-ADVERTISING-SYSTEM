-- Migrate clients.service (String) → clients.services (String[])
-- Step 1: add the new array column
ALTER TABLE "clients" ADD COLUMN "services" TEXT[] NOT NULL DEFAULT '{}';

-- Step 2: copy existing single-service value into the array (skip empty/null)
UPDATE "clients" SET "services" = ARRAY["service"] WHERE "service" IS NOT NULL AND "service" <> '';

-- Step 3: drop the old column
ALTER TABLE "clients" DROP COLUMN "service";
