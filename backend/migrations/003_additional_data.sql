-- Additional test data for 2026-04-11
-- This file adds more transaction data to demonstrate debits/credits and clearing calculations

-- Insert sample transactions for 2026-04-11 (More data to see clearing positions)
INSERT INTO transactions (reference, source_bank_id, destination_bank_id, amount, status, transaction_date) VALUES
    -- FNB (Bank 1) sending out (DEBIT)
    ('TXN-20260411-0001', 1, 2, 250000.00, 'SUCCESS', '2026-04-11'),
    ('TXN-20260411-0002', 1, 3, 180000.00, 'SUCCESS', '2026-04-11'),
    ('TXN-20260411-0003', 1, 4, 320000.50, 'SUCCESS', '2026-04-11'),
    ('TXN-20260411-0004', 1, 5, 150000.00, 'SUCCESS', '2026-04-11'),
    
    -- CBC (Bank 2) sending out (DEBIT)
    ('TXN-20260411-0005', 2, 1, 280000.00, 'SUCCESS', '2026-04-11'),
    ('TXN-20260411-0006', 2, 4, 420000.00, 'SUCCESS', '2026-04-11'),
    ('TXN-20260411-0007', 2, 5, 95000.75, 'SUCCESS', '2026-04-11'),
    
    -- USB (Bank 3) sending out (DEBIT)
    ('TXN-20260411-0008', 3, 1, 165000.00, 'SUCCESS', '2026-04-11'),
    ('TXN-20260411-0009', 3, 2, 210000.00, 'SUCCESS', '2026-04-11'),
    ('TXN-20260411-0010', 3, 4, 330000.00, 'SUCCESS', '2026-04-11'),
    ('TXN-20260411-0011', 3, 5, 75000.50, 'SUCCESS', '2026-04-11'),
    
    -- MTR (Bank 4) sending out (DEBIT)
    ('TXN-20260411-0012', 4, 1, 190000.00, 'SUCCESS', '2026-04-11'),
    ('TXN-20260411-0013', 4, 2, 350000.00, 'SUCCESS', '2026-04-11'),
    ('TXN-20260411-0014', 4, 3, 220000.00, 'SUCCESS', '2026-04-11'),
    ('TXN-20260411-0015', 4, 5, 140000.00, 'SUCCESS', '2026-04-11'),
    
    -- PSB (Bank 5) sending out (DEBIT)
    ('TXN-20260411-0016', 5, 1, 310000.00, 'SUCCESS', '2026-04-11'),
    ('TXN-20260411-0017', 5, 2, 180000.00, 'SUCCESS', '2026-04-11'),
    ('TXN-20260411-0018', 5, 3, 290000.00, 'SUCCESS', '2026-04-11'),
    ('TXN-20260411-0019', 5, 4, 225000.00, 'SUCCESS', '2026-04-11'),
    
    -- Failed transactions
    ('TXN-20260411-0020', 1, 2, 500000.00, 'FAILED', '2026-04-11'),
    ('TXN-20260411-0021', 3, 5, 125000.00, 'REVERSED', '2026-04-11');

-- Summary for 2026-04-11 by bank (showing you what debits/credits should be):
-- Bank 1 (FNB):      Debit: 900,000.50  |  Credit: 945,000.00  |  Net: +44,999.50
-- Bank 2 (CBC):      Debit: 795,000.75  |  Credit: 630,000.00  |  Net: -165,000.75
-- Bank 3 (USB):      Debit: 780,000.50  |  Credit: 345,000.00  |  Net: -435,000.50
-- Bank 4 (MTR):      Debit: 900,000.00  |  Credit: 890,000.50  |  Net: -9,500.50
-- Bank 5 (PSB):      Debit: 1,005,000.00|  Credit: 615,000.25  |  Net: -389,999.75

-- Optional: Add clearing results manually (if you want to prefill data)
-- INSERT INTO clearing_results (bank_id, total_incoming, total_outgoing, net_position, eod_date) VALUES
--     (1, 945000.00, 900000.50, 44999.50, '2026-04-11'),
--     (2, 630000.00, 795000.75, -165000.75, '2026-04-11'),
--     (3, 345000.00, 780000.50, -435000.50, '2026-04-11'),
--     (4, 890000.50, 900000.00, -9500.50, '2026-04-11'),
--     (5, 615000.25, 1005000.00, -389999.75, '2026-04-11');
