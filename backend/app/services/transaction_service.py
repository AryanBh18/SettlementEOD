from datetime import date

from app.models.transaction import Transaction
from app.repositories.transaction_repo import TransactionRepo


class TransactionService:
    def __init__(self, repo: TransactionRepo):
        self.repo = repo

    async def fetch_transactions(self, eod_date: date) -> list[Transaction]:
        return await self.repo.get_by_date(eod_date, status_filter="SUCCESS")

    async def count_transactions(self, eod_date: date) -> int:
        return await self.repo.count_by_date(eod_date)
