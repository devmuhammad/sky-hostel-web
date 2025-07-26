-- Migration: Add unique constraints to students table
-- Run this in your Supabase SQL Editor

-- Add unique constraint for email
ALTER TABLE students 
ADD CONSTRAINT students_email_unique UNIQUE (email);

-- Add unique constraint for phone  
ALTER TABLE students 
ADD CONSTRAINT students_phone_unique UNIQUE (phone);

-- Optional: Add combined unique constraint (email + phone together)
-- This prevents someone from registering with same email but different phone, etc.
-- ALTER TABLE students 
-- ADD CONSTRAINT students_email_phone_unique UNIQUE (email, phone);

-- Verify the constraints were added
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'students'::regclass 
  AND contype = 'u';  -- 'u' for unique constraints 