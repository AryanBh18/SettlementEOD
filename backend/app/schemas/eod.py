from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


# --- Request ---

class EODRunRequest(BaseModel):
    eod_date: date
    force_rerun: bool = False
    max_retries: int = 0


# --- Response sub-models ---

class BankPositionResponse(BaseModel):
    bank_id: int
    bank_code: str
    bank_name: str
    total_incoming: Decimal
    total_outgoing: Decimal
    net_position: Decimal

    model_config = {"from_attributes": True}


class ValidationCheckResponse(BaseModel):
    check_name: str
    status: str  # PASS or FAIL
    message: str | None = None

    model_config = {"from_attributes": True}


class ProcessLogResponse(BaseModel):
    id: int
    process_name: str
    status: str
    message: str | None = None
    eod_date: date
    created_at: datetime

    model_config = {"from_attributes": True}


class FileInfoResponse(BaseModel):
    file_name: str
    total_debit: Decimal
    total_credit: Decimal
    eod_date: date
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Top-level responses ---

class EODRunResponse(BaseModel):
    eod_date: date
    status: str  # SUCCESS or FAILED
    total_transactions: int
    total_debit: Decimal
    total_credit: Decimal
    bank_positions: list[BankPositionResponse]
    validation_results: list[ValidationCheckResponse]
    file_info: FileInfoResponse | None = None


class EODStatusResponse(BaseModel):
    eod_date: date
    status: str  # SUCCESS, FAILED, or NOT_RUN
    total_transactions: int
    total_debit: Decimal
    total_credit: Decimal
    bank_positions: list[BankPositionResponse]
    validation_results: list[ValidationCheckResponse]
    process_logs: list[ProcessLogResponse]
    file_info: FileInfoResponse | None = None
