import pytest
from decimal import Decimal

from app.services.validation_engine import ValidationEngine, ValidationCheck
from app.services.clearing_engine import BankPosition
from app.services.settlement_engine import SettlementInstruction


class TestValidationEngine:
    def test_balance_check_pass(self):
        result = ValidationEngine._check_balance(Decimal("40000.00"), Decimal("40000.00"))
        assert result.status == "PASS"
        assert result.check_name == "BALANCE_CHECK"

    def test_balance_check_fail(self):
        result = ValidationEngine._check_balance(Decimal("40000.00"), Decimal("30000.00"))
        assert result.status == "FAIL"

    def test_bank_completeness_pass(self):
        positions = {
            1: BankPosition(1, "FNB001", "FNB"),
            2: BankPosition(2, "CBC002", "CBC"),
        }
        result = ValidationEngine._check_bank_completeness(positions, {1, 2})
        assert result.status == "PASS"

    def test_bank_completeness_fail(self):
        positions = {1: BankPosition(1, "FNB001", "FNB")}
        result = ValidationEngine._check_bank_completeness(positions, {1, 2, 3})
        assert result.status == "FAIL"
        assert "2" in result.message
        assert "3" in result.message

    def test_null_check_pass(self):
        instructions = [
            SettlementInstruction(1, "FNB001", "FNB", Decimal("100.00"), "D"),
        ]
        result = ValidationEngine._check_null_values(instructions)
        assert result.status == "PASS"

    def test_null_check_fail_empty_bank_code(self):
        instructions = [
            SettlementInstruction(1, "", "FNB", Decimal("100.00"), "D"),
        ]
        result = ValidationEngine._check_null_values(instructions)
        assert result.status == "FAIL"

    def test_null_check_fail_invalid_type(self):
        instructions = [
            SettlementInstruction(1, "FNB001", "FNB", Decimal("100.00"), "X"),
        ]
        result = ValidationEngine._check_null_values(instructions)
        assert result.status == "FAIL"

    def test_decimal_precision_pass(self):
        instructions = [
            SettlementInstruction(1, "FNB001", "FNB", Decimal("100.50"), "D"),
        ]
        result = ValidationEngine._check_decimal_precision(instructions)
        assert result.status == "PASS"

    def test_decimal_precision_fail(self):
        instructions = [
            SettlementInstruction(1, "FNB001", "FNB", Decimal("100.123"), "D"),
        ]
        result = ValidationEngine._check_decimal_precision(instructions)
        assert result.status == "FAIL"

    def test_all_checks_pass(self):
        positions = {
            1: BankPosition(1, "FNB001", "FNB", Decimal("0.00"), Decimal("40000.00")),
            2: BankPosition(2, "CBC002", "CBC", Decimal("40000.00"), Decimal("0.00")),
        }
        instructions = [
            SettlementInstruction(1, "FNB001", "FNB", Decimal("40000.00"), "D"),
            SettlementInstruction(2, "CBC002", "CBC", Decimal("40000.00"), "C"),
        ]

        checks = ValidationEngine.run_all_checks(
            positions, instructions,
            Decimal("40000.00"), Decimal("40000.00"), {1, 2},
        )
        assert ValidationEngine.all_passed(checks)
        assert len(checks) == 4
