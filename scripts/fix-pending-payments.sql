-- Fix pending payments that have incorrect amount_paid values
-- Pending payments should have amount_paid = 0 if they haven't paid anything

-- Step 1: Show current problematic data
SELECT 
  'CURRENT_PENDING_ISSUES' as step,
  COUNT(*) as total_pending,
  COUNT(CASE WHEN amount_paid > 0 THEN 1 END) as pending_with_payment,
  COUNT(CASE WHEN amount_paid = 0 THEN 1 END) as pending_no_payment,
  COUNT(CASE WHEN amount_paid = 219000 THEN 1 END) as pending_with_full_amount
FROM payments 
WHERE status = 'pending';

-- Step 2: Show the problematic records
SELECT 
  id,
  email,
  amount_to_pay,
  amount_paid,
  status,
  created_at
FROM payments 
WHERE status = 'pending' 
  AND amount_paid = 219000
ORDER BY created_at DESC;

-- Step 3: Fix pending payments that have amount_paid = 219000
-- These should be 0 since they haven't actually paid anything
UPDATE payments 
SET amount_paid = 0
WHERE status = 'pending' 
  AND amount_paid = 219000;

-- Step 4: Verify the fix
SELECT 
  'AFTER_FIX' as step,
  COUNT(*) as total_pending,
  COUNT(CASE WHEN amount_paid > 0 THEN 1 END) as pending_with_payment,
  COUNT(CASE WHEN amount_paid = 0 THEN 1 END) as pending_no_payment,
  COUNT(CASE WHEN amount_paid = 219000 THEN 1 END) as pending_with_full_amount
FROM payments 
WHERE status = 'pending';

-- Step 5: Show sample data after fix
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
WHERE status = 'pending'
ORDER BY created_at DESC 
LIMIT 10; 