-- Rollback script for payments table schema
-- Use this if you need to revert the changes

-- Step 1: Drop the new column
ALTER TABLE payments DROP COLUMN IF EXISTS amount_to_pay;

-- Step 2: Revert the status constraint to original
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
  CHECK (status IN ('pending', 'completed', 'failed'));

-- Step 3: Remove default from amount_paid
ALTER TABLE payments ALTER COLUMN amount_paid DROP DEFAULT;

-- Step 4: Verification
SELECT 
  'ROLLBACK_COMPLETE' as step,
  COUNT(*) as total_payments,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments
FROM payments; 