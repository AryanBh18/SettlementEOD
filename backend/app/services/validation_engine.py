from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.transaction import Transaction

from app.services.clearing_engine import BankPosition
from app.services.file_generator import FileGenerator
from app.services.settlement_engine import SettlementInstruction

VALID_TRANSACTION_TYPES = {"ATM", "POS"}


@dataclass
class ValidationCheck:
    check_name: str
    status: str  # "PASS" or "FAIL"
    message: str


class ValidationEngine:
    @staticmethod
    def run_all_checks(
        positions: dict[int, BankPosition],
        instructions: list[SettlementInstruction],
        file_content: str,
        total_debit: Decimal,
        total_credit: Decimal,
        transacting_bank_ids: set[int],
        references: list[str] | None = None,
        transactions: list[Transaction] | None = None,
    ) -> list[ValidationCheck]:
        checks: list[ValidationCheck] = []

        if transactions is not None:
            checks.append(ValidationEngine._check_transaction_quality(transactions))
        checks.append(ValidationEngine._check_balance(total_debit, total_credit))
        checks.append(ValidationEngine._check_file_structure(file_content))
        checks.append(ValidationEngine._check_bank_completeness(positions, transacting_bank_ids))
        checks.append(ValidationEngine._check_null_values(instructions))
        checks.append(ValidationEngine._check_decimal_precision(instructions))
        checks.append(ValidationEngine._check_trailer_hash(file_content))
        if references is not None:
            checks.append(ValidationEngine._check_duplicate_references(references))

        return checks

    @staticmethod
    def all_passed(checks: list[ValidationCheck]) -> bool:
        return all(c.status == "PASS" for c in checks)

    # --- Individual checks ---

    @staticmethod
    def _check_transaction_quality(transactions: list[Transaction]) -> ValidationCheck:
        same_bank: list[str] = []
        zero_amount: list[str] = []
        bad_type: list[str] = []

        for txn in transactions:
            ref = txn.reference or f"id={txn.id}"
            if txn.source_bank_id == txn.destination_bank_id:
                same_bank.append(ref)
            if txn.amount == Decimal("0.00"):
                zero_amount.append(ref)
            if txn.transaction_type not in VALID_TRANSACTION_TYPES:
                bad_type.append(f"{ref}({txn.transaction_type})")

        issues: list[str] = []
        if same_bank:
            issues.append(f"{len(same_bank)} same-bank transaction(s): {', '.join(same_bank[:3])}")
        if zero_amount:
            issues.append(f"{len(zero_amount)} zero-amount transaction(s): {', '.join(zero_amount[:3])}")
        if bad_type:
            issues.append(f"{len(bad_type)} unrecognised type(s): {', '.join(bad_type[:3])}")

        if issues:
            return ValidationCheck(
                "TRANSACTION_QUALITY",
                "FAIL",
                "Invalid transactions detected — " + "; ".join(issues),
            )
        return ValidationCheck(
            "TRANSACTION_QUALITY",
            "PASS",
            f"All {len(transactions)} transactions passed quality checks",
        )

    @staticmethod
    def _check_balance(total_debit: Decimal, total_credit: Decimal) -> ValidationCheck:
        if total_debit == total_credit:
            return ValidationCheck(
                check_name="BALANCE_CHECK",
                status="PASS",
                message=f"Total debit ({total_debit:.2f}) equals total credit ({total_credit:.2f})",
            )
        return ValidationCheck(
            check_name="BALANCE_CHECK",
            status="FAIL",
            message=f"Mismatch: debit={total_debit:.2f}, credit={total_credit:.2f}",
        )

    @staticmethod
    def _check_file_structure(file_content: str) -> ValidationCheck:
        parsed = FileGenerator.parse_nsi_file(file_content)

        if parsed["header"] is None:
            return ValidationCheck("FILE_STRUCTURE", "FAIL", "Missing HDR line")
        if parsed["trailer"] is None:
            return ValidationCheck("FILE_STRUCTURE", "FAIL", "Missing TRL line")

        expected_count = parsed["header"]["record_count"]
        actual_count = len(parsed["details"])
        if expected_count != actual_count:
            return ValidationCheck(
                "FILE_STRUCTURE",
                "FAIL",
                f"Header record_count={expected_count} but found {actual_count} detail lines",
            )

        trailer_count = parsed["trailer"]["record_count"]
        if trailer_count != actual_count:
            return ValidationCheck(
                "FILE_STRUCTURE",
                "FAIL",
                f"Trailer record_count={trailer_count} but found {actual_count} detail lines",
            )

        return ValidationCheck("FILE_STRUCTURE", "PASS", "Header, details, and trailer are consistent")

    @staticmethod
    def _check_bank_completeness(
        positions: dict[int, BankPosition],
        transacting_bank_ids: set[int],
    ) -> ValidationCheck:
        missing = transacting_bank_ids - set(positions.keys())
        if missing:
            return ValidationCheck(
                "BANK_COMPLETENESS",
                "FAIL",
                f"Missing clearing results for bank IDs: {sorted(missing)}",
            )
        return ValidationCheck(
            "BANK_COMPLETENESS",
            "PASS",
            f"All {len(transacting_bank_ids)} transacting banks have clearing results",
        )

    @staticmethod
    def _check_null_values(instructions: list[SettlementInstruction]) -> ValidationCheck:
        for instr in instructions:
            if not instr.bank_code:
                return ValidationCheck("NULL_CHECK", "FAIL", f"Null bank_code for bank_id={instr.bank_id}")
            if instr.amount is None:
                return ValidationCheck("NULL_CHECK", "FAIL", f"Null amount for bank {instr.bank_code}")
            if instr.instruction_type not in ("D", "C"):
                return ValidationCheck(
                    "NULL_CHECK",
                    "FAIL",
                    f"Invalid instruction type '{instr.instruction_type}' for bank {instr.bank_code}",
                )
        return ValidationCheck("NULL_CHECK", "PASS", "No null or invalid values in settlement instructions")

    @staticmethod
    def _check_decimal_precision(instructions: list[SettlementInstruction]) -> ValidationCheck:
        for instr in instructions:
            # Check that amount has at most 2 decimal places
            if instr.amount != instr.amount.quantize(Decimal("0.01")):
                return ValidationCheck(
                    "DECIMAL_PRECISION",
                    "FAIL",
                    f"Amount {instr.amount} for bank {instr.bank_code} exceeds 2 decimal places",
                )
        return ValidationCheck("DECIMAL_PRECISION", "PASS", "All amounts have correct decimal precision (2 places)")

    @staticmethod
    def _check_trailer_hash(file_content: str) -> ValidationCheck:
        parsed = FileGenerator.parse_nsi_file(file_content)
        if parsed["trailer"] is None:
            return ValidationCheck("TRAILER_HASH", "FAIL", "No trailer found to verify hash")

        recalculated = sum((d["amount"] for d in parsed["details"]), Decimal("0.00"))
        trailer_hash = parsed["trailer"]["hash_total"]

        if recalculated == trailer_hash:
            return ValidationCheck(
                "TRAILER_HASH",
                "PASS",
                f"Hash total ({trailer_hash:.2f}) matches recalculated value",
            )
        return ValidationCheck(
            "TRAILER_HASH",
            "FAIL",
            f"Trailer hash={trailer_hash:.2f}, recalculated={recalculated:.2f}",
        )

    @staticmethod
    def _check_duplicate_references(references: list[str]) -> ValidationCheck:
        seen: set[str] = set()
        duplicates: set[str] = set()
        for ref in references:
            if ref in seen:
                duplicates.add(ref)
            seen.add(ref)

        if duplicates:
            sample = sorted(duplicates)[:5]
            return ValidationCheck(
                "DUPLICATE_CHECK",
                "FAIL",
                f"Found {len(duplicates)} duplicate reference(s): {', '.join(sample)}",
            )
        return ValidationCheck(
            "DUPLICATE_CHECK",
            "PASS",
            f"No duplicate references among {len(references)} transactions",
        )
