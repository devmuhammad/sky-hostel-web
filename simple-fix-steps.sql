-- =====================================================
-- SIMPLE STEP-BY-STEP FIX FOR DUPLICATE EMAILS
-- =====================================================
-- Run these commands one by one in your Supabase SQL Editor
-- =====================================================

-- STEP 1: Check what duplicates we have
SELECT 
    email,
    COUNT(*) as count,
    array_agg(id) as payment_ids,
    array_agg(status) as statuses
FROM payments 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- STEP 2: Look at the specific problematic email
SELECT 
    id,
    email,
    status,
    invoice_id,
    created_at,
    amount_paid
FROM payments 
WHERE email = 'qadriajetunmobi@gmail.com'
ORDER BY created_at DESC;

-- STEP 3: Check if the Paycashless invoice exists
SELECT 
    id,
    email,
    invoice_id,
    status
FROM payments 
WHERE invoice_id = 'inv_brhg2pzos605g7yazr5wtyxnn8psnwre'
OR invoice_id LIKE '%brhg2pzos605g7yazr5wtyxnn8psnwre%';

-- STEP 4: Create backup (run this first!)
CREATE TABLE payments_backup_$(date +%Y%m%d) AS SELECT * FROM payments;

-- STEP 5: Handle qadriajetunmobi@gmail.com specifically
-- Update the most recent payment with the correct invoice ID
UPDATE payments 
SET invoice_id = 'inv_brhg2pzos605g7yazr5wtyxnn8psnwre'
WHERE email = 'qadriajetunmobi@gmail.com'
AND created_at = (
    SELECT MAX(created_at)
    FROM payments
    WHERE email = 'qadriajetunmobi@gmail.com'
);

-- STEP 6: Delete other payments for qadriajetunmobi@gmail.com
DELETE FROM payments 
WHERE email = 'qadriajetunmobi@gmail.com'
AND id NOT IN (
    SELECT id
    FROM payments
    WHERE email = 'qadriajetunmobi@gmail.com'
    ORDER BY created_at DESC
    LIMIT 1
);

-- STEP 7: Handle other duplicate emails
-- Delete pending payments where there's a completed payment
DELETE FROM payments 
WHERE status = 'pending' 
AND email IN (
    SELECT email 
    FROM payments 
    WHERE status = 'completed'
)
AND email != 'qadriajetunmobi@gmail.com';

-- STEP 8: For remaining duplicates, keep the most recent
DELETE FROM payments 
WHERE id NOT IN (
    SELECT DISTINCT ON (email) id 
    FROM payments 
    ORDER BY email, created_at DESC
)
AND email != 'qadriajetunmobi@gmail.com';

-- STEP 9: Verify duplicates are resolved
SELECT 
    email,
    COUNT(*) as count
FROM payments 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- STEP 10: Add unique constraint
ALTER TABLE payments 
ADD CONSTRAINT payments_email_unique 
UNIQUE (email);

-- STEP 11: Verify the constraint
SELECT 
    constraint_name,
    table_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'payments' 
AND constraint_name = 'payments_email_unique';

-- STEP 12: Final check
SELECT 
    'payments' as table_name,
    COUNT(*) as total_records
FROM payments
UNION ALL
SELECT 
    'students' as table_name,
    COUNT(*) as total_records
FROM students; 