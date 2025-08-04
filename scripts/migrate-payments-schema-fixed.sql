-- FIXED Migration script for payments table schema
-- This script handles existing payment records carefully and avoids NULL constraint errors

-- Step 1: First, let's see what we have in the current database
SELECT 
  'CURRENT_DATA_ANALYSIS' as step,
  COUNT(*) as total_payments,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
  AVG(amount_paid) as avg_amount_paid,
  MIN(amount_paid) as min_amount_paid,
  MAX(amount_paid) as max_amount_paid
FROM payments;

-- Step 2: Add the new amount_to_pay column (nullable initially)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_to_pay DECIMAL(10,2);

-- Step 3: Handle different scenarios based on current data
-- Scenario A: Completed payments (fully paid)
UPDATE payments 
SET amount_to_pay = amount_paid
WHERE status = 'completed' 
  AND amount_to_pay IS NULL;

-- Scenario B: Pending payments with amount_paid > 0 (partial payments)
UPDATE payments 
SET amount_to_pay = 219000
WHERE status = 'pending' 
  AND amount_paid > 0 
  AND amount_to_pay IS NULL;

-- Scenario C: Pending payments with amount_paid = 0 (no payment yet)
UPDATE payments 
SET amount_to_pay = 219000
WHERE status = 'pending' 
  AND amount_paid = 0 
  AND amount_to_pay IS NULL;

-- Scenario D: Failed payments
UPDATE payments 
SET amount_to_pay = 219000
WHERE status = 'failed' 
  AND amount_to_pay IS NULL;

-- Step 4: Verify all records have amount_to_pay populated
SELECT 
  'VERIFICATION' as step,
  COUNT(*) as total_payments,
  COUNT(CASE WHEN amount_to_pay IS NULL THEN 1 END) as null_amount_to_pay,
  COUNT(CASE WHEN amount_to_pay IS NOT NULL THEN 1 END) as populated_amount_to_pay
FROM payments;

-- Step 5: Only set NOT NULL if all records are populated
-- (This prevents the constraint error)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM payments WHERE amount_to_pay IS NULL) THEN
    ALTER TABLE payments ALTER COLUMN amount_to_pay SET NOT NULL;
    RAISE NOTICE 'amount_to_pay column set to NOT NULL successfully';
  ELSE
    RAISE NOTICE 'Some records still have NULL amount_to_pay. Please check the data.';
  END IF;
END $$;

-- Step 6: Add the partially_paid status to the check constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
  CHECK (status IN ('pending', 'completed', 'failed', 'partially_paid'));

-- Step 7: Set default value for amount_paid
ALTER TABLE payments ALTER COLUMN amount_paid SET DEFAULT 0;

-- Step 8: Update status for partial payments
UPDATE payments 
SET status = 'partially_paid'
WHERE status = 'pending' 
  AND amount_paid > 0 
  AND amount_paid < amount_to_pay;

-- Step 9: Final verification - Show the results
SELECT 
  'MIGRATION_RESULTS' as step,
  COUNT(*) as total_payments,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
  COUNT(CASE WHEN status = 'partially_paid' THEN 1 END) as partially_paid_payments,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
  COUNT(CASE WHEN amount_to_pay IS NULL THEN 1 END) as null_amount_to_pay
FROM payments;

-- Step 10: Show sample data after migration
SELECT 
  id,
  email,
  amount_to_pay,
  amount_paid,
  status,
  created_at,
  CASE 
    WHEN amount_paid >= amount_to_pay THEN 'FULLY_PAID'
    WHEN amount_paid > 0 THEN 'PARTIALLY_PAID'
    ELSE 'NO_PAYMENT'
  END as payment_status
FROM payments 
ORDER BY created_at DESC 
LIMIT 10; 