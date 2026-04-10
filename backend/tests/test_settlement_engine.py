import pytest
from decimal import Decimal
from unittest.mock import MagicMock

from app.services.settlement_engine import SettlementEngine, SettlementInstruction
from app.services.clearing_engine import BankPosition


class TestSettlementEngine:
    def test_generate_instructions_basic(self):
        positions = {
            1: BankPosition(1, "FNB001", "FNB", Decimal("60000.00"), Decimal("100000.00")),
            2: BankPosition(2, "CBC002", "CBC", Decimal("100000.00"), Decimal("60000.00")),
        }
        instructions = SettlementEngine.generate_instructions(positions)

        assert len(instructions) == 2
        # Bank 1 net = -40000 → DEBIT
        debit = [i for i in instructions if i.instruction_type == "D"]
        assert len(debit) == 1
        assert debit[0].bank_code == "FNB001"
        assert debit[0].amount == Decimal("40000.00")
        # Bank 2 net = 40000 → CREDIT
        credit = [i for i in instructions if i.instruction_type == "C"]
        assert len(credit) == 1
        assert credit[0].bank_code == "CBC002"
        assert credit[0].amount == Decimal("40000.00")

    def test_zero_net_excluded(self):
        positions = {
            1: BankPosition(1, "FNB001", "FNB", Decimal("50000.00"), Decimal("50000.00")),
        }
        instructions = SettlementEngine.generate_instructions(positions)
        assert len(instructions) == 0

    def test_validate_balance_pass(self):
        instructions = [
            SettlementInstruction(1, "FNB001", "FNB", Decimal("40000.00"), "D"),
            SettlementInstruction(2, "CBC002", "CBC", Decimal("40000.00"), "C"),
        ]
        assert SettlementEngine.validate_balance(instructions) is True

    def test_validate_balance_fail(self):
        instructions = [
            SettlementInstruction(1, "FNB001", "FNB", Decimal("40000.00"), "D"),
            SettlementInstruction(2, "CBC002", "CBC", Decimal("30000.00"), "C"),
        ]
        assert SettlementEngine.validate_balance(instructions) is False

    def test_get_totals(self):
        instructions = [
            SettlementInstruction(1, "FNB001", "FNB", Decimal("40000.00"), "D"),
            SettlementInstruction(2, "CBC002", "CBC", Decimal("25000.00"), "C"),
            SettlementInstruction(3, "USB003", "USB", Decimal("15000.00"), "C"),
        ]
        total_d, total_c = SettlementEngine.get_totals(instructions)
        assert total_d == Decimal("40000.00")
        assert total_c == Decimal("40000.00")

    def test_empty_positions(self):
        instructions = SettlementEngine.generate_instructions({})
        assert len(instructions) == 0
