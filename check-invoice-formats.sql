-- =====================================================
-- CHECK INVOICE ID FORMATS AND DIFFERENCES
-- =====================================================

-- STEP 1: Check our database invoice_id format
SELECT 
    id,
    email,
    invoice_id,
    status,
    created_at
FROM payments 
WHERE email = 'qadriajetunmobi@gmail.com'
ORDER BY created_at DESC;

-- STEP 2: Check all invoice_id patterns in our database
SELECT 
    invoice_id,
    COUNT(*) as count,
    array_agg(email) as emails
FROM payments 
GROUP BY invoice_id
ORDER BY count DESC
LIMIT 10;

-- STEP 3: Check for Paycashless-style invoice IDs
SELECT 
    id,
    email,
    invoice_id,
    status,
    created_at
FROM payments 
WHERE invoice_id LIKE 'inv_%'
OR invoice_id LIKE 'inpay_%'
ORDER BY created_at DESC;

-- STEP 4: Check for our generated invoice IDs (SKY- format)
SELECT 
    id,
    email,
    invoice_id,
    status,
    created_at
FROM payments 
WHERE invoice_id LIKE 'SKY-%'
ORDER BY created_at DESC;

-- STEP 5: Check all duplicate emails with their invoice IDs
SELECT 
    email,
    COUNT(*) as count,
    array_agg(invoice_id) as invoice_ids,
    array_agg(status) as statuses
FROM payments 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- STEP 6: Check specific problematic emails
SELECT 
    email,
    id,
    invoice_id,
    status,
    created_at
FROM payments 
WHERE email IN ('qadriajetunmobi@gmail.com', 'timilehinjaiyeoba297@gmail.com')
ORDER BY email, created_at DESC; 