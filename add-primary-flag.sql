-- =====================================================
-- ADD PRIMARY FLAG TO PAYMENTS (NO DELETION)
-- =====================================================

-- STEP 1: Add a primary flag column
ALTER TABLE payments 
ADD COLUMN is_primary BOOLEAN DEFAULT FALSE;

-- STEP 2: Set the most recent payment as primary for each email
UPDATE payments 
SET is_primary = TRUE
WHERE id IN (
    SELECT DISTINCT ON (email) id 
    FROM payments 
    ORDER BY email, created_at DESC
);

-- STEP 3: Create a unique index on email + is_primary = TRUE
CREATE UNIQUE INDEX idx_payments_email_primary 
ON payments (email) 
WHERE is_primary = TRUE;

-- STEP 4: Check the results
SELECT 
    email,
    COUNT(*) as total_payments,
    COUNT(CASE WHEN is_primary = TRUE THEN 1 END) as primary_payments
FROM payments 
GROUP BY email 
ORDER BY total_payments DESC;

-- STEP 5: Check specific problematic emails
SELECT 
    email,
    id,
    invoice_id,
    status,
    is_primary,
    created_at
FROM payments 
WHERE email IN ('qadriajetunmobi@gmail.com', 'timilehinjaiyeoba297@gmail.com')
ORDER BY email, created_at DESC; 