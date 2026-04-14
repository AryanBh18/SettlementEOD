from dataclasses import dataclass, field
from decimal import Decimal

from app.models.transaction import Transaction


@dataclass
class BilateralResult:
    bank_a_id: int
    bank_a_code: str
    bank_a_name: str
    bank_b_id: int
    bank_b_code: str
    bank_b_name: str
    bank_a_owes_b: Decimal = field(default_factory=lambda: Decimal("0.00"))
    bank_b_owes_a: Decimal = field(default_factory=lambda: Decimal("0.00"))

    @property
    def net_amount(self) -> Decimal:
        return abs(self.bank_a_owes_b - self.bank_b_owes_a)

    @property
    def net_direction(self) -> str:
        diff = self.bank_a_owes_b - self.bank_b_owes_a
        if diff > 0:
            return "A_TO_B"
        elif diff < 0:
            return "B_TO_A"
        return "ZERO"


@dataclass
class CounterpartyBreakdown:
    bank_id: int
    bank_code: str
    bank_name: str
    gross_payable: Decimal  # what we owe them
    gross_receivable: Decimal  # what they owe us
    net_amount: Decimal  # absolute net
    net_direction: str  # "PAY" or "RECEIVE" or "ZERO"


@dataclass
class BankStatement:
    bank_id: int
    bank_code: str
    bank_name: str
    total_debit: Decimal  # total the bank must pay (sum of net amounts where bank pays)
    total_credit: Decimal  # total the bank will receive (sum of net amounts where bank receives)
    net_position: Decimal  # total_credit - total_debit
    breakdown: list[CounterpartyBreakdown] = field(default_factory=list)


class BilateralEngine:
    @staticmethod
    def calculate_bilateral_settlements(
        transactions: list[Transaction],
    ) -> list[BilateralResult]:
        """
        Group transactions by ordered bank pairs (smaller id first).
        For each pair, sum amounts in each direction, then compute net.
        """
        pair_data: dict[tuple[int, int], BilateralResult] = {}

        for txn in transactions:
            src_id = txn.source_bank_id
            dst_id = txn.destination_bank_id

            if src_id == dst_id:
                continue  # skip same-bank transactions

            # Canonical ordering: smaller id is bank_a
            if src_id < dst_id:
                key = (src_id, dst_id)
                if key not in pair_data:
                    pair_data[key] = BilateralResult(
                        bank_a_id=src_id,
                        bank_a_code=txn.source_bank.bank_code,
                        bank_a_name=txn.source_bank.name,
                        bank_b_id=dst_id,
                        bank_b_code=txn.destination_bank.bank_code,
                        bank_b_name=txn.destination_bank.name,
                    )
                # Source (bank_a) owes destination (bank_b)
                pair_data[key].bank_a_owes_b += txn.amount
            else:
                key = (dst_id, src_id)
                if key not in pair_data:
                    pair_data[key] = BilateralResult(
                        bank_a_id=dst_id,
                        bank_a_code=txn.destination_bank.bank_code,
                        bank_a_name=txn.destination_bank.name,
                        bank_b_id=src_id,
                        bank_b_code=txn.source_bank.bank_code,
                        bank_b_name=txn.source_bank.name,
                    )
                # Source (bank_b) owes destination (bank_a)
                pair_data[key].bank_b_owes_a += txn.amount

        return sorted(pair_data.values(), key=lambda r: (r.bank_a_id, r.bank_b_id))

    @staticmethod
    def generate_bank_statement(
        bank_id: int,
        bank_code: str,
        bank_name: str,
        bilateral_results: list[BilateralResult],
    ) -> BankStatement:
        """Generate a settlement statement for a specific bank."""
        total_debit = Decimal("0.00")
        total_credit = Decimal("0.00")
        breakdown: list[CounterpartyBreakdown] = []

        for result in bilateral_results:
            if result.bank_a_id != bank_id and result.bank_b_id != bank_id:
                continue

            is_bank_a = result.bank_a_id == bank_id

            if is_bank_a:
                counterparty_id = result.bank_b_id
                counterparty_code = result.bank_b_code
                counterparty_name = result.bank_b_name
                gross_payable = result.bank_a_owes_b
                gross_receivable = result.bank_b_owes_a
            else:
                counterparty_id = result.bank_a_id
                counterparty_code = result.bank_a_code
                counterparty_name = result.bank_a_name
                gross_payable = result.bank_b_owes_a
                gross_receivable = result.bank_a_owes_b

            net = result.net_amount
            direction = result.net_direction

            # Determine if this bank pays or receives in the net
            if direction == "ZERO":
                net_dir = "ZERO"
            elif (direction == "A_TO_B" and is_bank_a) or (direction == "B_TO_A" and not is_bank_a):
                net_dir = "PAY"
                total_debit += net
            else:
                net_dir = "RECEIVE"
                total_credit += net

            breakdown.append(CounterpartyBreakdown(
                bank_id=counterparty_id,
                bank_code=counterparty_code,
                bank_name=counterparty_name,
                gross_payable=gross_payable,
                gross_receivable=gross_receivable,
                net_amount=net,
                net_direction=net_dir,
            ))

        breakdown.sort(key=lambda b: b.bank_id)

        return BankStatement(
            bank_id=bank_id,
            bank_code=bank_code,
            bank_name=bank_name,
            total_debit=total_debit,
            total_credit=total_credit,
            net_position=total_credit - total_debit,
            breakdown=breakdown,
        )

    @staticmethod
    def generate_all_bank_statements(
        bilateral_results: list[BilateralResult],
    ) -> list[BankStatement]:
        """Generate statements for all banks involved in bilateral results."""
        bank_info: dict[int, tuple[str, str]] = {}
        for r in bilateral_results:
            bank_info[r.bank_a_id] = (r.bank_a_code, r.bank_a_name)
            bank_info[r.bank_b_id] = (r.bank_b_code, r.bank_b_name)

        statements = []
        for bid, (bcode, bname) in sorted(bank_info.items()):
            stmt = BilateralEngine.generate_bank_statement(
                bid, bcode, bname, bilateral_results
            )
            statements.append(stmt)

        return statements
