-- SAFE Migration script for payments table schema
-- This script handles existing payment records carefully

-- Step 1: First, let's see what we have in the current database
-- (This is just for analysis, not part of the migration)
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
SET amount_to_pay = amount_paid,
    amount_paid = amount_paid  -- Keep the same (they've already paid)
WHERE status = 'completed' 
  AND amount_to_pay IS NULL;

-- Scenario B: Pending payments with amount_paid > 0 (partial payments)
UPDATE payments 
SET amount_to_pay = 219000,  -- Set the required amount
    amount_paid = amount_paid  -- Keep the partial amount they've paid
WHERE status = 'pending' 
  AND amount_paid > 0 
  AND amount_to_pay IS NULL;

-- Scenario C: Pending payments with amount_paid = 0 (no payment yet)
UPDATE payments 
SET amount_to_pay = 219000,  -- Set the required amount
    amount_paid = 0  -- They haven't paid anything yet
WHERE status = 'pending' 
  AND amount_paid = 0 
  AND amount_to_pay IS NULL;

-- Scenario D: Failed payments
UPDATE payments 
SET amount_to_pay = 219000,  -- Set the required amount
    amount_paid = 0  -- Reset to 0 since payment failed
WHERE status = 'failed' 
  AND amount_to_pay IS NULL;

-- Step 4: Set amount_to_pay as NOT NULL after populating it
ALTER TABLE payments ALTER COLUMN amount_to_pay SET NOT NULL;

-- Step 5: Add the partially_paid status to the check constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
  CHECK (status IN ('pending', 'completed', 'failed', 'partially_paid'));

-- Step 6: Set default value for amount_paid
ALTER TABLE payments ALTER COLUMN amount_paid SET DEFAULT 0;

-- Step 7: Update status for partial payments
UPDATE payments 
SET status = 'partially_paid'
WHERE status = 'pending' 
  AND amount_paid > 0 
  AND amount_paid < amount_to_pay;

-- Step 8: Verification - Show the results
SELECT 
  'MIGRATION_RESULTS' as step,
  COUNT(*) as total_payments,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
  COUNT(CASE WHEN status = 'partially_paid' THEN 1 END) as partially_paid_payments,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments
FROM payments;

-- Step 9: Show sample data after migration
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