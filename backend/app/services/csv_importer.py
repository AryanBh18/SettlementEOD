import csv
import io
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal, InvalidOperation

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.bank import Bank
from app.models.transaction import Transaction


@dataclass
class ImportError:
    row: int
    message: str


@dataclass
class ImportResult:
    imported: int = 0
    skipped_duplicates: int = 0
    errors: list[ImportError] = field(default_factory=list)

    @property
    def total_processed(self) -> int:
        return self.imported + self.skipped_duplicates + len(self.errors)


REQUIRED_COLUMNS = {
    "reference", "source_bank_code", "destination_bank_code",
    "amount", "transaction_date",
}
OPTIONAL_COLUMNS = {"transaction_type", "status"}
VALID_TYPES = {"ATM", "POS", "WIRE", "TRANSFER", "OTHER"}
VALID_STATUSES = {"SUCCESS", "FAILED", "REVERSED"}


class CSVImporter:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def import_csv(self, file_content: str, uploaded_by: int | None = None) -> ImportResult:
        result = ImportResult()

        # Load bank code -> ID mapping
        bank_map = await self._load_bank_map()

        reader = csv.DictReader(io.StringIO(file_content))

        # Validate columns
        if reader.fieldnames is None:
            result.errors.append(ImportError(row=0, message="Empty CSV file"))
            return result

        headers = set(reader.fieldnames)
        missing = REQUIRED_COLUMNS - headers
        if missing:
            result.errors.append(ImportError(
                row=0, message=f"Missing required columns: {', '.join(sorted(missing))}"
            ))
            return result

        # Load existing references to detect duplicates
        existing_refs = await self._load_existing_references()

        for row_num, row in enumerate(reader, start=2):
            try:
                reference = row.get("reference", "").strip()
                if not reference:
                    result.errors.append(ImportError(row=row_num, message="Missing reference"))
                    continue

                # Duplicate check
                if reference in existing_refs:
                    result.skipped_duplicates += 1
                    continue

                source_code = row.get("source_bank_code", "").strip()
                dest_code = row.get("destination_bank_code", "").strip()

                if source_code not in bank_map:
                    result.errors.append(ImportError(row=row_num, message=f"Unknown source bank code: {source_code}"))
                    continue
                if dest_code not in bank_map:
                    result.errors.append(ImportError(row=row_num, message=f"Unknown destination bank code: {dest_code}"))
                    continue

                try:
                    amount = Decimal(row.get("amount", "0").strip())
                except InvalidOperation:
                    result.errors.append(ImportError(row=row_num, message=f"Invalid amount: {row.get('amount')}"))
                    continue

                if amount < 0:
                    result.errors.append(ImportError(row=row_num, message=f"Negative amount: {amount}"))
                    continue

                try:
                    txn_date = date.fromisoformat(row.get("transaction_date", "").strip())
                except ValueError:
                    result.errors.append(ImportError(row=row_num, message=f"Invalid date: {row.get('transaction_date')}"))
                    continue

                txn_type = row.get("transaction_type", "TRANSFER").strip().upper()
                if txn_type not in VALID_TYPES:
                    txn_type = "OTHER"

                status_val = row.get("status", "SUCCESS").strip().upper()
                if status_val not in VALID_STATUSES:
                    status_val = "SUCCESS"

                txn = Transaction(
                    reference=reference,
                    source_bank_id=bank_map[source_code],
                    destination_bank_id=bank_map[dest_code],
                    amount=amount,
                    status=status_val,
                    transaction_type=txn_type,
                    transaction_date=txn_date,
                    uploaded_by=uploaded_by,
                )
                self.db.add(txn)
                existing_refs.add(reference)
                result.imported += 1

            except Exception as e:
                result.errors.append(ImportError(row=row_num, message=str(e)))

        if result.imported > 0:
            await self.db.flush()

        return result

    async def _load_bank_map(self) -> dict[str, int]:
        stmt = select(Bank)
        res = await self.db.execute(stmt)
        banks = res.scalars().all()
        return {b.bank_code: b.id for b in banks}

    async def _load_existing_references(self) -> set[str]:
        stmt = select(Transaction.reference).where(Transaction.reference.isnot(None))
        res = await self.db.execute(stmt)
        return {r[0] for r in res.all()}
