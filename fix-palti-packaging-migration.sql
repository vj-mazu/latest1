-- Migration: Fix Palti Packaging Direction
-- Purpose: Ensure all palti movements convert FROM bullet TO premium (not the reverse)
-- Date: 2025-12-21

-- Fix any palti movements that have wrong direction (premium → bullet should be bullet → premium)
UPDATE rice_stock_movements 
SET source_packaging_id = 2, target_packaging_id = 1 
WHERE movement_type = 'palti' 
  AND (source_packaging_id = 1 OR target_packaging_id = 2);

-- Verify the fix
SELECT 
  rsm.id,
  rsm.date,
  rsm.source_packaging_id,
  rsm.target_packaging_id,
  sp."brandName" as source_brand,
  tp."brandName" as target_brand
FROM rice_stock_movements rsm
LEFT JOIN packagings sp ON rsm.source_packaging_id = sp.id
LEFT JOIN packagings tp ON rsm.target_packaging_id = tp.id
WHERE rsm.movement_type = 'palti'
ORDER BY rsm.date;

-- Expected result: All palti movements should show "bullet → premium"