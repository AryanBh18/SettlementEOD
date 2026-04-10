from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import String, Date, DateTime, Numeric, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SettlementFile(Base):
    __tablename__ = "settlement_files"
    __table_args__ = (UniqueConstraint("eod_date", name="uq_settlement_eod_date"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    total_debit: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, default=Decimal("0.00"))
    total_credit: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, default=Decimal("0.00"))
    eod_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="SUCCESS")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
