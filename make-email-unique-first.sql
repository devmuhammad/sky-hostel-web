-- =====================================================
-- MAKE EMAIL UNIQUE FIRST - SIMPLE APPROACH
-- =====================================================
-- Run these commands in your Supabase SQL Editor
-- =====================================================

-- STEP 1: Check current duplicates
SELECT 
    email,
    COUNT(*) as count,
    array_agg(id) as payment_ids,
    array_agg(status) as statuses
FROM payments 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- STEP 2: Create backup
CREATE TABLE payments_backup_$(date +%Y%m%d) AS SELECT * FROM payments;

-- STEP 3: Simple approach - Keep the most recent payment for each email
DELETE FROM payments 
WHERE id NOT IN (
    SELECT DISTINCT ON (email) id 
    FROM payments 
    ORDER BY email, created_at DESC
);

-- STEP 4: Verify duplicates are resolved
SELECT 
    email,
    COUNT(*) as count
FROM payments 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- STEP 5: Add unique constraint
ALTER TABLE payments 
ADD CONSTRAINT payments_email_unique 
UNIQUE (email);

-- STEP 6: Verify the constraint
SELECT 
    constraint_name,
    table_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'payments' 
AND constraint_name = 'payments_email_unique';

-- STEP 7: Check final state
SELECT 
    'payments' as table_name,
    COUNT(*) as total_records
FROM payments
UNION ALL
SELECT 
    'students' as table_name,
    COUNT(*) as total_records
FROM students; 