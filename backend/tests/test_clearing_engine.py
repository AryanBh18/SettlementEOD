import pytest
from decimal import Decimal
from unittest.mock import MagicMock

from app.services.clearing_engine import ClearingEngine, BankPosition


def _make_txn(source_id, source_code, source_name, dest_id, dest_code, dest_name, amount):
    """Helper to create a mock transaction."""
    txn = MagicMock()
    txn.source_bank_id = source_id
    txn.destination_bank_id = dest_id
    txn.amount = Decimal(str(amount))

    txn.source_bank = MagicMock()
    txn.source_bank.bank_code = source_code
    txn.source_bank.name = source_name

    txn.destination_bank = MagicMock()
    txn.destination_bank.bank_code = dest_code
    txn.destination_bank.name = dest_name
    return txn


class TestClearingEngine:
    def test_single_transaction(self):
        txns = [
            _make_txn(1, "FNB001", "First National", 2, "CBC002", "Central Bank", "100000.00")
        ]
        positions = ClearingEngine.calculate_positions(txns)

        assert len(positions) == 2
        # Source bank (FNB): outgoing=100000, incoming=0
        assert positions[1].total_outgoing == Decimal("100000.00")
        assert positions[1].total_incoming == Decimal("0.00")
        assert positions[1].net_position == Decimal("-100000.00")
        # Dest bank (CBC): incoming=100000, outgoing=0
        assert positions[2].total_incoming == Decimal("100000.00")
        assert positions[2].total_outgoing == Decimal("0.00")
        assert positions[2].net_position == Decimal("100000.00")

    def test_bidirectional_transactions(self):
        txns = [
            _make_txn(1, "FNB001", "First National", 2, "CBC002", "Central Bank", "100000.00"),
            _make_txn(2, "CBC002", "Central Bank", 1, "FNB001", "First National", "60000.00"),
        ]
        positions = ClearingEngine.calculate_positions(txns)

        assert len(positions) == 2
        # FNB: outgoing=100000, incoming=60000, net=-40000
        assert positions[1].net_position == Decimal("-40000.00")
        # CBC: incoming=100000, outgoing=60000, net=40000
        assert positions[2].net_position == Decimal("40000.00")

    def test_net_positions_sum_to_zero(self):
        txns = [
            _make_txn(1, "FNB001", "FNB", 2, "CBC002", "CBC", "150000.00"),
            _make_txn(1, "FNB001", "FNB", 3, "USB003", "USB", "50000.00"),
            _make_txn(2, "CBC002", "CBC", 1, "FNB001", "FNB", "200000.00"),
            _make_txn(3, "USB003", "USB", 4, "MTR004", "MTR", "120000.00"),
            _make_txn(4, "MTR004", "MTR", 1, "FNB001", "FNB", "80000.00"),
            _make_txn(5, "PSB005", "PSB", 2, "CBC002", "CBC", "300000.00"),
        ]
        positions = ClearingEngine.calculate_positions(txns)
        total_net = sum(p.net_position for p in positions.values())
        assert total_net == Decimal("0.00")

    def test_empty_transactions(self):
        positions = ClearingEngine.calculate_positions([])
        assert len(positions) == 0

    def test_all_to_one_bank(self):
        txns = [
            _make_txn(1, "FNB001", "FNB", 3, "USB003", "USB", "100.00"),
            _make_txn(2, "CBC002", "CBC", 3, "USB003", "USB", "200.00"),
        ]
        positions = ClearingEngine.calculate_positions(txns)

        assert positions[3].total_incoming == Decimal("300.00")
        assert positions[3].total_outgoing == Decimal("0.00")
        assert positions[3].net_position == Decimal("300.00")

    def test_decimal_precision(self):
        txns = [
            _make_txn(1, "FNB001", "FNB", 2, "CBC002", "CBC", "0.01"),
            _make_txn(2, "CBC002", "CBC", 1, "FNB001", "FNB", "0.01"),
        ]
        positions = ClearingEngine.calculate_positions(txns)
        assert positions[1].net_position == Decimal("0.00")
        assert positions[2].net_position == Decimal("0.00")
