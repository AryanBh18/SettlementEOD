-- Feature Updates Migration
-- Run after 001_init.sql

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'VIEWER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_role CHECK (role IN ('ADMIN', 'OPERATOR', 'VIEWER'))
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id SERIAL PRIMARY KEY,
    email_recipients TEXT[] DEFAULT '{}',
    notify_on_success BOOLEAN DEFAULT FALSE,
    notify_on_failure BOOLEAN DEFAULT TRUE,
    smtp_configured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mapping rules table
CREATE TABLE IF NOT EXISTS mapping_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    field_source VARCHAR(100) NOT NULL,
    field_target VARCHAR(100) NOT NULL,
    transform_type VARCHAR(50) NOT NULL DEFAULT 'DIRECT',
    transform_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add transaction_type to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(20) DEFAULT 'TRANSFER';

-- Add uploaded_by to transactions (nullable FK to users)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS uploaded_by INT REFERENCES users(id);

-- Add triggered_by to process_logs (nullable FK to users)
ALTER TABLE process_logs ADD COLUMN IF NOT EXISTS triggered_by INT REFERENCES users(id);

-- Add file_type to settlement_files for per-bank files
ALTER TABLE settlement_files ADD COLUMN IF NOT EXISTS file_type VARCHAR(20) DEFAULT 'COMBINED';
ALTER TABLE settlement_files ADD COLUMN IF NOT EXISTS bank_code VARCHAR(20);

-- Drop unique constraint on eod_date to allow multiple files per date
ALTER TABLE settlement_files DROP CONSTRAINT IF EXISTS uq_settlement_eod_date;

-- Add composite unique constraint for file_type + eod_date + bank_code
CREATE UNIQUE INDEX IF NOT EXISTS uq_settlement_file_type_date
    ON settlement_files(eod_date, file_type, COALESCE(bank_code, ''));

-- Update existing transaction seed data with transaction types
UPDATE transactions SET transaction_type = 'WIRE' WHERE reference LIKE 'TXN-20260410-000%';
UPDATE transactions SET transaction_type = 'ATM' WHERE reference IN ('TXN-20260410-0005', 'TXN-20260410-0009');
UPDATE transactions SET transaction_type = 'POS' WHERE reference IN ('TXN-20260410-0007', 'TXN-20260410-0010');
UPDATE transactions SET transaction_type = 'TRANSFER' WHERE reference LIKE 'TXN-20260409-%';
UPDATE transactions SET transaction_type = 'WIRE' WHERE reference LIKE 'TXN-20260411-%' AND transaction_type = 'TRANSFER';

-- Insert default admin user (password: admin123 - bcrypt hash)
INSERT INTO users (username, password_hash, email, role, is_active)
VALUES ('admin', '$2b$12$J/120E5OgYi7EbDsrJ8H5e4pGCJnfzZAYfGg5WBIuv4TTwaUcvtbW', 'admin@eod-settlement.local', 'ADMIN', TRUE)
ON CONFLICT (username) DO UPDATE SET password_hash = '$2b$12$J/120E5OgYi7EbDsrJ8H5e4pGCJnfzZAYfGg5WBIuv4TTwaUcvtbW';

-- Insert default notification settings
INSERT INTO notification_settings (email_recipients, notify_on_success, notify_on_failure, smtp_configured)
VALUES ('{}', FALSE, TRUE, FALSE);

-- Insert default mapping rules
INSERT INTO mapping_rules (rule_name, field_source, field_target, transform_type, transform_config) VALUES
    ('Bank Code', 'bank_code', 'BANK_CODE', 'DIRECT', '{}'),
    ('Amount', 'amount', 'AMOUNT', 'FORMAT', '{"width": 15, "align": "right", "decimal_places": 2}'),
    ('Instruction Type', 'instruction_type', 'TYPE', 'DIRECT', '{}'),
    ('Bank Name', 'bank_name', 'BANK_NAME', 'DIRECT', '{}'),
    ('Date Format', 'eod_date', 'DATE', 'DATE_FORMAT', '{"format": "%Y%m%d"}');
