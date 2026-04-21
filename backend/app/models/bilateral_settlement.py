from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import String, Date, DateTime, Numeric, ForeignKey, Integer, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.timezone import now_sr


class BilateralSettlement(Base):
    __tablename__ = "bilateral_settlements"
    __table_args__ = (
        UniqueConstraint("settlement_date", "bank_a_id", "bank_b_id", name="uq_bilateral_pair_date"),
        CheckConstraint("bank_a_id < bank_b_id", name="chk_bank_order"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    settlement_date: Mapped[date] = mapped_column(Date, nullable=False)
    bank_a_id: Mapped[int] = mapped_column(Integer, ForeignKey("banks.id"), nullable=False)
    bank_b_id: Mapped[int] = mapped_column(Integer, ForeignKey("banks.id"), nullable=False)
    bank_a_owes_b: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, default=Decimal("0.00"))
    bank_b_owes_a: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, default=Decimal("0.00"))
    net_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, default=Decimal("0.00"))
    net_direction: Mapped[str] = mapped_column(String(10), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_sr)

    bank_a: Mapped["Bank"] = relationship(foreign_keys=[bank_a_id])  # noqa: F821
    bank_b: Mapped["Bank"] = relationship(foreign_keys=[bank_b_id])  # noqa: F821
