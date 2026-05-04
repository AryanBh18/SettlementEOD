-- Log Enhancements Migration
-- Adds triggered_by (user tracking) to validation_results

ALTER TABLE validation_results ADD COLUMN IF NOT EXISTS triggered_by INT REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_validation_triggered_by ON validation_results(triggered_by);
