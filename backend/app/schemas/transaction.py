from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class TransactionResponse(BaseModel):
    id: int
    reference: str | None
    source_bank_code: str
    source_bank_name: str
    destination_bank_code: str
    destination_bank_name: str
    amount: Decimal
    status: str
    transaction_date: date
    created_at: datetime

    model_config = {"from_attributes": True}
