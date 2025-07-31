-- =====================================================
-- HANDLE SPECIFIC DUPLICATE CASE: qadriajetunmobi@gmail.com
-- =====================================================

-- STEP 1: Check current state of this email's payments
SELECT 
    id,
    email,
    phone,
    amount_paid,
    invoice_id,
    status,
    paid_at,
    created_at,
    updated_at
FROM payments 
WHERE email = 'qadriajetunmobi@gmail.com'
ORDER BY created_at DESC;

-- STEP 2: Check if the Paycashless invoice ID exists in our database
SELECT 
    id,
    email,
    invoice_id,
    status,
    created_at
FROM payments 
WHERE invoice_id = 'inv_brhg2pzos605g7yazr5wtyxnn8psnwre'
OR invoice_id LIKE '%brhg2pzos605g7yazr5wtyxnn8psnwre%';

-- STEP 3: Check all duplicate emails to understand the full scope
SELECT 
    email,
    COUNT(*) as count,
    array_agg(id) as payment_ids,
    array_agg(status) as statuses,
    array_agg(invoice_id) as invoice_ids
FROM payments 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- STEP 4: Create backup before making changes
CREATE TABLE payments_backup_$(date +%Y%m%d) AS SELECT * FROM payments;

-- STEP 5: Strategy for qadriajetunmobi@gmail.com
-- Since there's an ongoing payment, we should:
-- 1. Keep the payment with the Paycashless invoice ID
-- 2. Delete other payments for this email
-- 3. Update the kept payment's invoice_id if needed

-- First, let's identify which payment to keep
-- Option A: Keep the payment with the Paycashless invoice ID
UPDATE payments 
SET invoice_id = 'inv_brhg2pzos605g7yazr5wtyxnn8psnwre'
WHERE email = 'qadriajetunmobi@gmail.com'
AND created_at = (
    SELECT MAX(created_at)
    FROM payments
    WHERE email = 'qadriajetunmobi@gmail.com'
);

-- Option B: Delete other payments for this email (keeping the most recent)
DELETE FROM payments 
WHERE email = 'qadriajetunmobi@gmail.com'
AND id NOT IN (
    SELECT id
    FROM payments
    WHERE email = 'qadriajetunmobi@gmail.com'
    ORDER BY created_at DESC
    LIMIT 1
);

-- STEP 6: Handle other duplicate emails
-- For emails without ongoing payments, keep completed payments or most recent

-- Delete pending payments where there's a completed payment for the same email
DELETE FROM payments 
WHERE status = 'pending' 
AND email IN (
    SELECT email 
    FROM payments 
    WHERE status = 'completed'
)
AND email != 'qadriajetunmobi@gmail.com'; -- Exclude the specific case

-- For remaining duplicates (no completed payments), keep the most recent
DELETE FROM payments 
WHERE id NOT IN (
    SELECT DISTINCT ON (email) id 
    FROM payments 
    ORDER BY email, created_at DESC
)
AND email != 'qadriajetunmobi@gmail.com'; -- Exclude the specific case

-- STEP 7: Verify duplicates are resolved
SELECT 
    email,
    COUNT(*) as count
FROM payments 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- STEP 8: Now add the unique constraint
ALTER TABLE payments 
ADD CONSTRAINT payments_email_unique 
UNIQUE (email);

-- STEP 9: Verify the constraint was added
SELECT 
    constraint_name,
    table_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'payments' 
AND constraint_name = 'payments_email_unique';

-- STEP 10: Check for orphaned students
SELECT 
    s.id,
    s.email,
    s.payment_id,
    p.id as payment_exists
FROM students s
LEFT JOIN payments p ON s.payment_id = p.id
WHERE p.id IS NULL;

-- STEP 11: Update orphaned students (if needed)
UPDATE students 
SET payment_id = (
    SELECT id FROM payments 
    WHERE email = students.email 
    ORDER BY created_at DESC 
    LIMIT 1
)
WHERE payment_id NOT IN (SELECT id FROM payments);

-- STEP 12: Final verification
SELECT 
    'payments' as table_name,
    COUNT(*) as total_records
FROM payments
UNION ALL
SELECT 
    'students' as table_name,
    COUNT(*) as total_records
FROM students; 