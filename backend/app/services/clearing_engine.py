from dataclasses import dataclass, field
from decimal import Decimal

from app.models.transaction import Transaction


@dataclass
class BankPosition:
    bank_id: int
    bank_code: str
    bank_name: str
    total_incoming: Decimal = field(default_factory=lambda: Decimal("0.00"))
    total_outgoing: Decimal = field(default_factory=lambda: Decimal("0.00"))

    @property
    def net_position(self) -> Decimal:
        return self.total_incoming - self.total_outgoing


class ClearingEngine:
    @staticmethod
    def calculate_positions(transactions: list[Transaction]) -> dict[int, BankPosition]:
        positions: dict[int, BankPosition] = {}

        for txn in transactions:
            # Destination bank: incoming
            dest_id = txn.destination_bank_id
            if dest_id not in positions:
                positions[dest_id] = BankPosition(
                    bank_id=dest_id,
                    bank_code=txn.destination_bank.bank_code,
                    bank_name=txn.destination_bank.name,
                )
            positions[dest_id].total_incoming += txn.amount

            # Source bank: outgoing
            src_id = txn.source_bank_id
            if src_id not in positions:
                positions[src_id] = BankPosition(
                    bank_id=src_id,
                    bank_code=txn.source_bank.bank_code,
                    bank_name=txn.source_bank.name,
                )
            positions[src_id].total_outgoing += txn.amount

        return positions
