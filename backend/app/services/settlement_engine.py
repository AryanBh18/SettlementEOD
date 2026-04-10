from dataclasses import dataclass
from decimal import Decimal

from app.services.clearing_engine import BankPosition


@dataclass
class SettlementInstruction:
    bank_id: int
    bank_code: str
    bank_name: str
    amount: Decimal
    instruction_type: str  # "D" (debit) or "C" (credit)


class SettlementEngine:
    @staticmethod
    def generate_instructions(positions: dict[int, BankPosition]) -> list[SettlementInstruction]:
        instructions: list[SettlementInstruction] = []

        for bank_id, pos in sorted(positions.items()):
            net = pos.net_position
            if net < Decimal("0"):
                instructions.append(SettlementInstruction(
                    bank_id=bank_id,
                    bank_code=pos.bank_code,
                    bank_name=pos.bank_name,
                    amount=abs(net),
                    instruction_type="D",
                ))
            elif net > Decimal("0"):
                instructions.append(SettlementInstruction(
                    bank_id=bank_id,
                    bank_code=pos.bank_code,
                    bank_name=pos.bank_name,
                    amount=net,
                    instruction_type="C",
                ))
            # net == 0: no instruction needed

        return instructions

    @staticmethod
    def validate_balance(instructions: list[SettlementInstruction]) -> bool:
        total_debit = sum(i.amount for i in instructions if i.instruction_type == "D")
        total_credit = sum(i.amount for i in instructions if i.instruction_type == "C")
        return total_debit == total_credit

    @staticmethod
    def get_totals(instructions: list[SettlementInstruction]) -> tuple[Decimal, Decimal]:
        total_debit = sum(
            (i.amount for i in instructions if i.instruction_type == "D"),
            Decimal("0.00"),
        )
        total_credit = sum(
            (i.amount for i in instructions if i.instruction_type == "C"),
            Decimal("0.00"),
        )
        return total_debit, total_credit
