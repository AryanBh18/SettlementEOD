-- Seed data for testing and demonstration
-- Run after 001_init.sql

-- Insert sample banks
INSERT INTO banks (name, bank_code) VALUES
    ('First National Bank', 'FNB001'),
    ('Central Bank of Commerce', 'CBC002'),
    ('United Savings Bank', 'USB003'),
    ('Metropolitan Trust', 'MTR004'),
    ('Pacific Standard Bank', 'PSB005')
ON CONFLICT (bank_code) DO NOTHING;

-- Insert sample transactions for 2026-04-10
INSERT INTO transactions (reference, source_bank_id, destination_bank_id, amount, status, transaction_date) VALUES
    -- FNB → CBC
    ('TXN-20260410-0001', 1, 2, 150000.00, 'SUCCESS', '2026-04-10'),
    ('TXN-20260410-0002', 1, 2, 75000.50, 'SUCCESS', '2026-04-10'),
    -- CBC → FNB
    ('TXN-20260410-0003', 2, 1, 200000.00, 'SUCCESS', '2026-04-10'),
    -- FNB → USB
    ('TXN-20260410-0004', 1, 3, 50000.00, 'SUCCESS', '2026-04-10'),
    -- USB → MTR
    ('TXN-20260410-0005', 3, 4, 120000.75, 'SUCCESS', '2026-04-10'),
    -- MTR → FNB
    ('TXN-20260410-0006', 4, 1, 80000.00, 'SUCCESS', '2026-04-10'),
    -- PSB → CBC
    ('TXN-20260410-0007', 5, 2, 300000.00, 'SUCCESS', '2026-04-10'),
    -- CBC → PSB
    ('TXN-20260410-0008', 2, 5, 250000.00, 'SUCCESS', '2026-04-10'),
    -- MTR → USB
    ('TXN-20260410-0009', 4, 3, 45000.25, 'SUCCESS', '2026-04-10'),
    -- PSB → FNB
    ('TXN-20260410-0010', 5, 1, 100000.00, 'SUCCESS', '2026-04-10'),
    -- FAILED transaction (should be excluded from clearing)
    ('TXN-20260410-0011', 1, 4, 500000.00, 'FAILED', '2026-04-10'),
    -- REVERSED transaction (should be excluded from clearing)
    ('TXN-20260410-0012', 3, 1, 25000.00, 'REVERSED', '2026-04-10'),
    -- FNB → PSB
    ('TXN-20260410-0013', 1, 5, 60000.00, 'SUCCESS', '2026-04-10'),
    -- USB → CBC
    ('TXN-20260410-0014', 3, 2, 35000.00, 'SUCCESS', '2026-04-10'),
    -- CBC → MTR
    ('TXN-20260410-0015', 2, 4, 90000.00, 'SUCCESS', '2026-04-10')
ON CONFLICT (reference) DO NOTHING;

-- Insert sample transactions for 2026-04-09 (previous day - for testing multi-date)
INSERT INTO transactions (reference, source_bank_id, destination_bank_id, amount, status, transaction_date) VALUES
    ('TXN-20260409-0001', 1, 2, 100000.00, 'SUCCESS', '2026-04-09'),
    ('TXN-20260409-0002', 2, 1, 80000.00, 'SUCCESS', '2026-04-09'),
    ('TXN-20260409-0003', 3, 4, 60000.00, 'SUCCESS', '2026-04-09'),
    ('TXN-20260409-0004', 4, 5, 45000.00, 'SUCCESS', '2026-04-09'),
    ('TXN-20260409-0005', 5, 3, 70000.00, 'SUCCESS', '2026-04-09')
ON CONFLICT (reference) DO NOTHING;
