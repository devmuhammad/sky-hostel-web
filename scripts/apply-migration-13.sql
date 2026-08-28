-- Migration 13: Student blacklist (soft deactivate + free bed)
-- and sponsored / waived payments for external sponsors.

-- ========== Students: soft blacklist ==========
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'students_account_status_check'
  ) THEN
    ALTER TABLE students
      ADD CONSTRAINT students_account_status_check
      CHECK (account_status IN ('active', 'blacklisted', 'withdrawn'));
  END IF;
END $$;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS previous_block VARCHAR(10);

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS previous_room VARCHAR(100);

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS previous_bedspace_label VARCHAR(50);

-- Allow clearing live room assignment after blacklist
ALTER TABLE students ALTER COLUMN block DROP NOT NULL;
ALTER TABLE students ALTER COLUMN room DROP NOT NULL;
ALTER TABLE students ALTER COLUMN bedspace_label DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_students_account_status ON students(account_status);

-- ========== Payments: sponsored / waived source ==========
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_source VARCHAR(32) NOT NULL DEFAULT 'paycashless';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_payment_source_check'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT payments_payment_source_check
      CHECK (payment_source IN ('paycashless', 'sponsored', 'waived'));
  END IF;
END $$;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS waiver_reason TEXT;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS waived_by UUID REFERENCES admin_users(id) ON DELETE SET NULL;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_payments_payment_source ON payments(payment_source);
CREATE INDEX IF NOT EXISTS idx_payments_email_status ON payments(email, status);

SELECT 'Migration 13 (blacklist + sponsored payments) applied successfully' AS status;
