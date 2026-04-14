-- Migration 004: Guest Transaction Simulation & Bilateral Settlement
-- Adds cutoff_logs and bilateral_settlements tables

-- Cutoff log: stores cutoff events per settlement date
CREATE TABLE IF NOT EXISTS cutoff_logs (
    id BIGSERIAL PRIMARY KEY,
    settlement_date DATE NOT NULL,
    cutoff_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    triggered_by INT REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELLED')),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cutoff_settlement_date UNIQUE (settlement_date)
);

CREATE INDEX IF NOT EXISTS idx_cutoff_logs_date ON cutoff_logs(settlement_date);

-- Bilateral settlements: pairwise netting between bank pairs
-- bank_a_id is always < bank_b_id for canonical ordering (no duplicate pairs)
CREATE TABLE IF NOT EXISTS bilateral_settlements (
    id BIGSERIAL PRIMARY KEY,
    settlement_date DATE NOT NULL,
    bank_a_id INT NOT NULL REFERENCES banks(id),
    bank_b_id INT NOT NULL REFERENCES banks(id),
    bank_a_owes_b NUMERIC(15,2) NOT NULL DEFAULT 0,
    bank_b_owes_a NUMERIC(15,2) NOT NULL DEFAULT 0,
    net_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    net_direction VARCHAR(10) NOT NULL CHECK (net_direction IN ('A_TO_B', 'B_TO_A', 'ZERO')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_bilateral_pair_date UNIQUE (settlement_date, bank_a_id, bank_b_id),
    CONSTRAINT chk_bank_order CHECK (bank_a_id < bank_b_id)
);

CREATE INDEX IF NOT EXISTS idx_bilateral_date ON bilateral_settlements(settlement_date);
CREATE INDEX IF NOT EXISTS idx_bilateral_banks ON bilateral_settlements(bank_a_id, bank_b_id);
