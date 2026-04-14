import pytest
from decimal import Decimal
from unittest.mock import MagicMock

from app.services.bilateral_engine import BilateralEngine, BilateralResult


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


class TestBilateralEngine:
    def test_single_direction(self):
        """A→B only, no B→A transactions."""
        txns = [
            _make_txn(1, "FNB001", "FNB", 2, "CBC002", "CBC", "2000.00"),
            _make_txn(1, "FNB001", "FNB", 2, "CBC002", "CBC", "3000.00"),
        ]
        results = BilateralEngine.calculate_bilateral_settlements(txns)

        assert len(results) == 1
        r = results[0]
        assert r.bank_a_id == 1
        assert r.bank_b_id == 2
        assert r.bank_a_owes_b == Decimal("5000.00")
        assert r.bank_b_owes_a == Decimal("0.00")
        assert r.net_amount == Decimal("5000.00")
        assert r.net_direction == "A_TO_B"

    def test_bidirectional_netting(self):
        """Both A→B and B→A transactions, net to one side."""
        txns = [
            _make_txn(1, "FNB001", "FNB", 2, "CBC002", "CBC", "2000.00"),
            _make_txn(2, "CBC002", "CBC", 1, "FNB001", "FNB", "1500.00"),
        ]
        results = BilateralEngine.calculate_bilateral_settlements(txns)

        assert len(results) == 1
        r = results[0]
        assert r.bank_a_owes_b == Decimal("2000.00")
        assert r.bank_b_owes_a == Decimal("1500.00")
        assert r.net_amount == Decimal("500.00")
        assert r.net_direction == "A_TO_B"

    def test_reverse_direction_netting(self):
        """B owes more than A → net direction is B_TO_A."""
        txns = [
            _make_txn(1, "FNB001", "FNB", 2, "CBC002", "CBC", "1000.00"),
            _make_txn(2, "CBC002", "CBC", 1, "FNB001", "FNB", "3000.00"),
        ]
        results = BilateralEngine.calculate_bilateral_settlements(txns)

        assert len(results) == 1
        r = results[0]
        assert r.bank_a_owes_b == Decimal("1000.00")
        assert r.bank_b_owes_a == Decimal("3000.00")
        assert r.net_amount == Decimal("2000.00")
        assert r.net_direction == "B_TO_A"

    def test_zero_net(self):
        """Equal amounts in both directions → net is zero."""
        txns = [
            _make_txn(1, "FNB001", "FNB", 2, "CBC002", "CBC", "5000.00"),
            _make_txn(2, "CBC002", "CBC", 1, "FNB001", "FNB", "5000.00"),
        ]
        results = BilateralEngine.calculate_bilateral_settlements(txns)

        assert len(results) == 1
        r = results[0]
        assert r.net_amount == Decimal("0.00")
        assert r.net_direction == "ZERO"

    def test_multiple_pairs(self):
        """Multiple bank pairs produce separate results."""
        txns = [
            _make_txn(1, "FNB001", "FNB", 2, "CBC002", "CBC", "1000.00"),
            _make_txn(1, "FNB001", "FNB", 3, "USB003", "USB", "2000.00"),
            _make_txn(2, "CBC002", "CBC", 3, "USB003", "USB", "3000.00"),
        ]
        results = BilateralEngine.calculate_bilateral_settlements(txns)

        assert len(results) == 3
        # Pairs should be (1,2), (1,3), (2,3)
        pair_keys = [(r.bank_a_id, r.bank_b_id) for r in results]
        assert (1, 2) in pair_keys
        assert (1, 3) in pair_keys
        assert (2, 3) in pair_keys

    def test_canonical_ordering(self):
        """Transactions in any direction produce canonical pair ordering (smaller id first)."""
        txns = [
            _make_txn(3, "USB003", "USB", 1, "FNB001", "FNB", "1000.00"),
        ]
        results = BilateralEngine.calculate_bilateral_settlements(txns)

        assert len(results) == 1
        r = results[0]
        # bank_a should be 1 (smaller), bank_b should be 3
        assert r.bank_a_id == 1
        assert r.bank_b_id == 3
        # bank_b (3) owes bank_a (1) the amount
        assert r.bank_b_owes_a == Decimal("1000.00")
        assert r.bank_a_owes_b == Decimal("0.00")

    def test_empty_transactions(self):
        results = BilateralEngine.calculate_bilateral_settlements([])
        assert len(results) == 0

    def test_same_bank_ignored(self):
        """Same-bank transactions should be skipped."""
        txns = [
            _make_txn(1, "FNB001", "FNB", 1, "FNB001", "FNB", "1000.00"),
        ]
        results = BilateralEngine.calculate_bilateral_settlements(txns)
        assert len(results) == 0


class TestBankStatements:
    def _make_bilateral_results(self):
        """
        FNB(1) owes CBC(2) = 2000
        CBC(2) owes FNB(1) = 1500
        Net: FNB pays CBC 500

        FNB(1) owes USB(3) = 1000
        USB(3) owes FNB(1) = 3000
        Net: USB pays FNB 2000
        """
        r1 = BilateralResult(
            bank_a_id=1, bank_a_code="FNB001", bank_a_name="FNB",
            bank_b_id=2, bank_b_code="CBC002", bank_b_name="CBC",
            bank_a_owes_b=Decimal("2000.00"),
            bank_b_owes_a=Decimal("1500.00"),
        )
        r2 = BilateralResult(
            bank_a_id=1, bank_a_code="FNB001", bank_a_name="FNB",
            bank_b_id=3, bank_b_code="USB003", bank_b_name="USB",
            bank_a_owes_b=Decimal("1000.00"),
            bank_b_owes_a=Decimal("3000.00"),
        )
        return [r1, r2]

    def test_bank_statement_totals(self):
        results = self._make_bilateral_results()
        stmt = BilateralEngine.generate_bank_statement(1, "FNB001", "FNB", results)

        # FNB pays CBC 500, receives from USB 2000
        assert stmt.total_debit == Decimal("500.00")
        assert stmt.total_credit == Decimal("2000.00")
        assert stmt.net_position == Decimal("1500.00")

    def test_bank_statement_breakdown(self):
        results = self._make_bilateral_results()
        stmt = BilateralEngine.generate_bank_statement(1, "FNB001", "FNB", results)

        assert len(stmt.breakdown) == 2
        cbc_entry = next(b for b in stmt.breakdown if b.bank_code == "CBC002")
        usb_entry = next(b for b in stmt.breakdown if b.bank_code == "USB003")

        assert cbc_entry.net_direction == "PAY"
        assert cbc_entry.net_amount == Decimal("500.00")
        assert usb_entry.net_direction == "RECEIVE"
        assert usb_entry.net_amount == Decimal("2000.00")

    def test_counterparty_statement(self):
        """Test from CBC's perspective."""
        results = self._make_bilateral_results()
        stmt = BilateralEngine.generate_bank_statement(2, "CBC002", "CBC", results)

        # CBC receives from FNB 500
        assert stmt.total_debit == Decimal("0.00")
        assert stmt.total_credit == Decimal("500.00")
        assert stmt.net_position == Decimal("500.00")

    def test_generate_all_statements(self):
        results = self._make_bilateral_results()
        statements = BilateralEngine.generate_all_bank_statements(results)

        assert len(statements) == 3  # FNB, CBC, USB

        # Net positions should sum to zero across all banks
        total_net = sum(s.net_position for s in statements)
        assert total_net == Decimal("0.00")

    def test_empty_bilateral_results(self):
        stmt = BilateralEngine.generate_bank_statement(1, "FNB001", "FNB", [])
        assert stmt.total_debit == Decimal("0.00")
        assert stmt.total_credit == Decimal("0.00")
        assert stmt.net_position == Decimal("0.00")
        assert len(stmt.breakdown) == 0
