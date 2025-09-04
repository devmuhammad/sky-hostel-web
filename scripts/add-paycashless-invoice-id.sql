-- Migration script to add paycashless_invoice_id column to existing payments table
-- Run this on your production database to add the missing column

-- Add the new column
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS paycashless_invoice_id VARCHAR(255);

-- Add the new column for webhook tracking
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS last_webhook_update TIMESTAMP;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_payments_paycashless_invoice_id ON payments(paycashless_invoice_id);

-- Update existing payments with their Paycashless invoice IDs
-- This will need to be done manually or through a sync process
-- since we don't have the historical Paycashless invoice IDs

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' 
  AND column_name IN ('paycashless_invoice_id', 'last_webhook_update')
ORDER BY column_name;
