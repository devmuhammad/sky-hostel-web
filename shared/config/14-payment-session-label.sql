-- Same as scripts/apply-migration-14.sql
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS session_label VARCHAR(16);

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS invoice_created_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS invoice_paid_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_payments_session_label ON payments(session_label);
CREATE INDEX IF NOT EXISTS idx_payments_session_status ON payments(session_label, status);
