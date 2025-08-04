-- Migration script to update payments table schema
-- This script adds amount_to_pay field and properly handles amount_paid

-- Step 1: Add the new amount_to_pay column
ALTER TABLE payments ADD COLUMN amount_to_pay DECIMAL(10,2);

-- Step 2: Update existing records to set amount_to_pay to the current amount_paid value
-- (since the current amount_paid actually represents the amount to be paid)
UPDATE payments SET amount_to_pay = amount_paid;

-- Step 3: Set amount_to_pay as NOT NULL after populating it
ALTER TABLE payments ALTER COLUMN amount_to_pay SET NOT NULL;

-- Step 4: Reset amount_paid to 0 for all existing records
-- (since we don't have actual payment history, we'll start fresh)
UPDATE payments SET amount_paid = 0;

-- Step 5: Update status for records that should be pending
UPDATE payments SET status = 'pending' WHERE status = 'completed';

-- Step 6: Add the partially_paid status to the check constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
  CHECK (status IN ('pending', 'completed', 'failed', 'partially_paid'));

-- Step 7: Set default value for amount_paid
ALTER TABLE payments ALTER COLUMN amount_paid SET DEFAULT 0;

-- Verification query
SELECT 
  id,
  email,
  amount_to_pay,
  amount_paid,
  status,
  created_at
FROM payments 
ORDER BY created_at DESC 
LIMIT 10; 