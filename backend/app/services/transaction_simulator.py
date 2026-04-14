import logging
import random
import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bank import Bank
from app.models.transaction import Transaction

logger = logging.getLogger(__name__)

TRANSACTION_TYPES = ["ATM", "POS"]
AMOUNT_MIN = 50
AMOUNT_MAX = 50000


class TransactionSimulator:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def simulate(self, count: int, target_date: date) -> dict:
        """Generate guest banking transactions where issuer != acquirer."""
        banks = await self._get_all_banks()

        if len(banks) < 2:
            raise ValueError("At least 2 banks are required to simulate guest transactions")

        inserted = 0
        skipped = 0

        for _ in range(count):
            issuer, acquirer = random.sample(banks, 2)
            amount = Decimal(str(round(random.uniform(AMOUNT_MIN, AMOUNT_MAX), 2)))
            txn_type = random.choice(TRANSACTION_TYPES)
            reference = f"SIM-{target_date.isoformat()}-{uuid.uuid4().hex[:12].upper()}"

            txn = Transaction(
                reference=reference,
                source_bank_id=issuer.id,
                destination_bank_id=acquirer.id,
                amount=amount,
                status="SUCCESS",
                transaction_type=txn_type,
                transaction_date=target_date,
            )
            self.db.add(txn)
            inserted += 1

        await self.db.flush()
        logger.info(f"Simulated {inserted} guest transactions for {target_date}")

        return {
            "date": target_date.isoformat(),
            "inserted": inserted,
            "skipped": skipped,
            "total_requested": count,
        }

    async def _get_all_banks(self) -> list[Bank]:
        stmt = select(Bank).order_by(Bank.id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
