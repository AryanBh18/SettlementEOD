-- EOD Settlement System - PostgreSQL Schema
-- Adapted from MySQL DDL for PostgreSQL / Supabase

CREATE TABLE IF NOT EXISTS banks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bank_code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    reference VARCHAR(100) UNIQUE,
    source_bank_id INT NOT NULL,
    destination_bank_id INT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',  -- SUCCESS, FAILED, REVERSED
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_source_bank FOREIGN KEY (source_bank_id) REFERENCES banks(id),
    CONSTRAINT fk_destination_bank FOREIGN KEY (destination_bank_id) REFERENCES banks(id),
    CONSTRAINT chk_status CHECK (status IN ('SUCCESS', 'FAILED', 'REVERSED')),
    CONSTRAINT chk_positive_amount CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date_status ON transactions(transaction_date, status);

CREATE TABLE IF NOT EXISTS clearing_results (
    id BIGSERIAL PRIMARY KEY,
    bank_id INT NOT NULL,
    total_incoming NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_outgoing NUMERIC(15, 2) NOT NULL DEFAULT 0,
    net_position NUMERIC(15, 2) NOT NULL DEFAULT 0,
    eod_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_clearing_bank FOREIGN KEY (bank_id) REFERENCES banks(id),
    CONSTRAINT uq_clearing_bank_date UNIQUE (bank_id, eod_date)
);

CREATE INDEX IF NOT EXISTS idx_clearing_eod_date ON clearing_results(eod_date);

CREATE TABLE IF NOT EXISTS settlement_files (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    total_debit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_credit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    eod_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',  -- SUCCESS, FAILED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_settlement_eod_date UNIQUE (eod_date),
    CONSTRAINT chk_file_status CHECK (status IN ('SUCCESS', 'FAILED'))
);

CREATE TABLE IF NOT EXISTS process_logs (
    id BIGSERIAL PRIMARY KEY,
    process_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    message TEXT,
    eod_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_process_logs_eod_date ON process_logs(eod_date);

CREATE TABLE IF NOT EXISTS validation_results (
    id BIGSERIAL PRIMARY KEY,
    check_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,   -- PASS, FAIL
    message TEXT,
    eod_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_validation_eod_date ON validation_results(eod_date);
