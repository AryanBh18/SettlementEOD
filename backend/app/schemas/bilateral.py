from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class BilateralSettlementResponse(BaseModel):
    bank_a_id: int
    bank_a_code: str
    bank_a_name: str
    bank_b_id: int
    bank_b_code: str
    bank_b_name: str
    bank_a_owes_b: Decimal
    bank_b_owes_a: Decimal
    net_amount: Decimal
    net_direction: str  # A_TO_B, B_TO_A, ZERO

    model_config = {"from_attributes": True}


class CounterpartyBreakdownResponse(BaseModel):
    bank_id: int
    bank_code: str
    bank_name: str
    gross_payable: Decimal
    gross_receivable: Decimal
    net_amount: Decimal
    net_direction: str  # PAY, RECEIVE, ZERO

    model_config = {"from_attributes": True}


class BankStatementResponse(BaseModel):
    bank_id: int
    bank_code: str
    bank_name: str
    total_debit: Decimal
    total_credit: Decimal
    net_position: Decimal
    breakdown: list[CounterpartyBreakdownResponse]

    model_config = {"from_attributes": True}


class BilateralSettlementListResponse(BaseModel):
    settlement_date: date
    total_pairs: int
    settlements: list[BilateralSettlementResponse]


class BankStatementsListResponse(BaseModel):
    settlement_date: date
    total_banks: int
    statements: list[BankStatementResponse]
