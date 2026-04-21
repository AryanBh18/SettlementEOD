from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import String, DateTime, Date, Numeric, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.timezone import now_sr


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    reference: Mapped[str] = mapped_column(String(100), unique=True, nullable=True)
    source_bank_id: Mapped[int] = mapped_column(Integer, ForeignKey("banks.id"), nullable=False)
    destination_bank_id: Mapped[int] = mapped_column(Integer, ForeignKey("banks.id"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="SUCCESS")
    transaction_type: Mapped[str] = mapped_column(String(20), nullable=False, default="TRANSFER")
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)
    uploaded_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_sr)

    source_bank: Mapped["Bank"] = relationship(foreign_keys=[source_bank_id])  # noqa: F821
    destination_bank: Mapped["Bank"] = relationship(foreign_keys=[destination_bank_id])  # noqa: F821
