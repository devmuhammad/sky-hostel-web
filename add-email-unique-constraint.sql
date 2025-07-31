-- Add unique constraint to payments.email
-- This prevents multiple payments for the same email

-- First, check if there are any duplicate emails
SELECT email, COUNT(*) as count 
FROM payments 
GROUP BY email 
HAVING COUNT(*) > 1;

-- If there are duplicates, you'll need to handle them first
-- Then add the unique constraint:

ALTER TABLE payments ADD CONSTRAINT payments_email_unique UNIQUE (email);

-- Add a comment to explain the constraint
COMMENT ON CONSTRAINT payments_email_unique ON payments IS 'Prevents multiple payments for the same email address'; 