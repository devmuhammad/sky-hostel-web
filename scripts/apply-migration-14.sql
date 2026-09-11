-- Migration 14: Academic session tagging on payments
-- Enables separating last-session vs current-session revenue without deleting rows.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS session_label VARCHAR(16);

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS invoice_created_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS invoice_paid_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_payments_session_label ON payments(session_label);
CREATE INDEX IF NOT EXISTS idx_payments_session_status ON payments(session_label, status);

-- Soft default: leave NULL until reconcile backfills from Paycashless dates.
-- New creates should set session_label explicitly in app code.

SELECT 'Migration 14 (payment session_label) applied successfully' AS status;
