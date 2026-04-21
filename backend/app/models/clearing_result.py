from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Numeric, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.timezone import now_sr


class ClearingResult(Base):
    __tablename__ = "clearing_results"
    __table_args__ = (UniqueConstraint("bank_id", "eod_date", name="uq_clearing_bank_date"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    bank_id: Mapped[int] = mapped_column(Integer, ForeignKey("banks.id"), nullable=False)
    total_incoming: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, default=Decimal("0.00"))
    total_outgoing: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, default=Decimal("0.00"))
    net_position: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, default=Decimal("0.00"))
    eod_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_sr)

    bank: Mapped["Bank"] = relationship(back_populates="clearing_results")  # noqa: F821
