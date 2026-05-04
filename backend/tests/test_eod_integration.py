import pytest
import pytest_asyncio
from datetime import date
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import event

from app.database import Base
from app.models import Bank, Transaction, ClearingResult, SettlementFile, ProcessLog, ValidationResult
from app.services.eod_orchestrator import EODOrchestrator


@pytest_asyncio.fixture
async def db_session():
    """Create an in-memory SQLite database for testing."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)

    # Enable foreign keys in SQLite
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        # Seed test data
        banks = [
            Bank(id=1, name="First National Bank", bank_code="FNB001"),
            Bank(id=2, name="Central Bank of Commerce", bank_code="CBC002"),
            Bank(id=3, name="United Savings Bank", bank_code="USB003"),
        ]
        session.add_all(banks)
        await session.flush()

        transactions = [
            Transaction(
                reference="TXN-001", source_bank_id=1, destination_bank_id=2,
                amount=Decimal("100000.00"), status="SUCCESS", transaction_date=date(2026, 4, 10),
            ),
            Transaction(
                reference="TXN-002", source_bank_id=2, destination_bank_id=1,
                amount=Decimal("60000.00"), status="SUCCESS", transaction_date=date(2026, 4, 10),
            ),
            Transaction(
                reference="TXN-003", source_bank_id=1, destination_bank_id=3,
                amount=Decimal("30000.00"), status="SUCCESS", transaction_date=date(2026, 4, 10),
            ),
            Transaction(
                reference="TXN-004", source_bank_id=3, destination_bank_id=2,
                amount=Decimal("50000.00"), status="SUCCESS", transaction_date=date(2026, 4, 10),
            ),
            # FAILED - should be excluded
            Transaction(
                reference="TXN-005", source_bank_id=1, destination_bank_id=2,
                amount=Decimal("999999.00"), status="FAILED", transaction_date=date(2026, 4, 10),
            ),
            # REVERSED - should be excluded
            Transaction(
                reference="TXN-006", source_bank_id=2, destination_bank_id=1,
                amount=Decimal("888888.00"), status="REVERSED", transaction_date=date(2026, 4, 10),
            ),
        ]
        session.add_all(transactions)
        await session.commit()

        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_full_eod_run(db_session):
    """Integration test: full EOD pipeline with known data."""
    orchestrator = EODOrchestrator(db_session)
    result = await orchestrator.run(date(2026, 4, 10))

    assert result.status == "SUCCESS"
    assert result.total_transactions == 4  # Only SUCCESS transactions
    assert result.total_debit == result.total_credit  # Must balance
    assert len(result.bank_positions) == 3  # 3 banks involved
    assert len(result.validation_results) == 6  # All 6 checks
    assert all(v.status == "PASS" for v in result.validation_results)
    assert result.file_info is not None
    assert result.file_info.file_name == "EOD_COMPLETE"

    # Verify net positions sum to zero
    total_net = sum(p.net_position for p in result.bank_positions)
    assert total_net == Decimal("0.00")


@pytest.mark.asyncio
async def test_idempotency(db_session):
    """Running EOD twice for same date without force_rerun returns existing results."""
    orchestrator = EODOrchestrator(db_session)
    result1 = await orchestrator.run(date(2026, 4, 10))
    result2 = await orchestrator.run(date(2026, 4, 10))

    assert result1.status == "SUCCESS"
    assert result2.status == "SUCCESS"
    # Results should be the same (idempotent)
    assert result1.total_transactions == result2.total_transactions
    assert result1.total_debit == result2.total_debit


@pytest.mark.asyncio
async def test_force_rerun(db_session):
    """Force re-run replaces previous results."""
    orchestrator = EODOrchestrator(db_session)
    result1 = await orchestrator.run(date(2026, 4, 10))
    result2 = await orchestrator.run(date(2026, 4, 10), force_rerun=True)

    assert result2.status == "SUCCESS"
    assert result2.total_transactions == 4


@pytest.mark.asyncio
async def test_empty_date(db_session):
    """EOD run for a date with no transactions."""
    orchestrator = EODOrchestrator(db_session)
    result = await orchestrator.run(date(2026, 1, 1))

    assert result.status == "SUCCESS"
    assert result.total_transactions == 0
    assert len(result.bank_positions) == 0
    assert result.total_debit == Decimal("0.00")
    assert result.total_credit == Decimal("0.00")
    assert all(v.status == "PASS" for v in result.validation_results)
