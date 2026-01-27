-- Fix existing shifting entries that have toKunchinintuId = NULL
-- This script updates old shifting entries to set the toKunchinintuId based on toWarehouseShiftId

-- First, let's see which entries need fixing
SELECT 
  id,
  date,
  "movementType",
  variety,
  bags,
  "fromKunchinintuId",
  "toKunchinintuId",
  "toWarehouseShiftId"
FROM arrivals
WHERE "movementType" = 'shifting'
  AND "toKunchinintuId" IS NULL
  AND "toWarehouseShiftId" IS NOT NULL;

-- Now fix them by finding the kunchinittu that owns the destination warehouse
UPDATE arrivals a
SET "toKunchinintuId" = w."kunchinintuId"
FROM warehouses w
WHERE a."movementType" = 'shifting'
  AND a."toKunchinintuId" IS NULL
  AND a."toWarehouseShiftId" = w.id
  AND a."toWarehouseShiftId" IS NOT NULL;

-- Verify the fix
SELECT 
  id,
  date,
  "movementType",
  variety,
  bags,
  "fromKunchinintuId",
  "toKunchinintuId",
  "toWarehouseShiftId"
FROM arrivals
WHERE "movementType" = 'shifting'
ORDER BY date DESC
LIMIT 10;
