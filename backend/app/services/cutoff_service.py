import logging
from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bank import Bank
from app.models.cutoff_log import CutoffLog
from app.repositories.cutoff_repo import CutoffRepo
from app.repositories.log_repo import LogRepo
from app.utils.timezone import now_sr

logger = logging.getLogger(__name__)


class CutoffService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.cutoff_repo = CutoffRepo(db)
        self.log_repo = LogRepo(db)

    async def trigger_cutoff(
        self, settlement_date: date, user_id: int | None = None
    ) -> CutoffLog:
        """Trigger cutoff for a settlement date. Stores timestamp and notifies banks."""
        existing = await self.cutoff_repo.get_by_date(settlement_date)
        if existing:
            raise ValueError(f"Cutoff already exists for {settlement_date}")

        cutoff = CutoffLog(
            settlement_date=settlement_date,
            cutoff_timestamp=now_sr(),
            triggered_by=user_id,
            status="ACTIVE",
            message=f"Cutoff triggered for settlement date {settlement_date}",
        )
        await self.cutoff_repo.create_cutoff(cutoff)

        # Log the cutoff event
        await self.log_repo.log(
            "CUTOFF_TRIGGERED", "SUCCESS",
            f"Cutoff triggered for {settlement_date} at {cutoff.cutoff_timestamp.isoformat()}",
            settlement_date,
        )

        # Mock-notify all banks
        await self._notify_banks(settlement_date, cutoff.cutoff_timestamp)

        return cutoff

    async def get_cutoff(self, settlement_date: date) -> CutoffLog | None:
        return await self.cutoff_repo.get_by_date(settlement_date)

    async def get_latest_cutoff(self) -> CutoffLog | None:
        return await self.cutoff_repo.get_latest()

    async def get_settlement_date_for_transaction(self, txn_timestamp: datetime) -> date:
        """Determine which settlement date a transaction belongs to based on cutoff."""
        txn_date = txn_timestamp.date()
        cutoff = await self.cutoff_repo.get_by_date(txn_date)

        if cutoff and txn_timestamp >= cutoff.cutoff_timestamp:
            # Transaction is after cutoff → belongs to next settlement day
            return txn_date + timedelta(days=1)

        return txn_date

    async def _notify_banks(self, settlement_date: date, cutoff_time: datetime) -> None:
        """Mock notification to all banks about cutoff."""
        stmt = select(Bank).order_by(Bank.id)
        result = await self.db.execute(stmt)
        banks = result.scalars().all()

        for bank in banks:
            logger.info(
                f"[NOTIFICATION] Bank {bank.bank_code} ({bank.name}): "
                f"Cutoff triggered for {settlement_date} at {cutoff_time.isoformat()}. "
                f"Transactions after this time will settle on {settlement_date + timedelta(days=1)}."
            )

        await self.log_repo.log(
            "CUTOFF_NOTIFICATION", "SUCCESS",
            f"Notified {len(list(banks))} banks about cutoff for {settlement_date}",
            settlement_date,
        )
