-- Migration 17: Payment refunds
-- Safe to re-run. Does not delete data.
-- Mirror of scripts/apply-migration-17.sql
--
-- Marks a payment refunded so the student cannot continue payment or
-- registration. Registered students are withdrawn separately in app code
-- and their bed is released.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS refunded_by UUID REFERENCES admin_users(id) ON DELETE SET NULL;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS refund_reason TEXT;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'payments'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%status%'
      AND pg_get_constraintdef(c.oid) ILIKE '%pending%'
  LOOP
    EXECUTE format('ALTER TABLE payments DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_status_check'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT payments_status_check
      CHECK (status IN ('pending', 'completed', 'failed', 'partially_paid', 'refunded'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_refunded_at ON payments(refunded_at)
  WHERE refunded_at IS NOT NULL;

SELECT 'Migration 17 (payment refunds) applied successfully' AS status;
