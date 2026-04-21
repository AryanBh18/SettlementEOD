from datetime import datetime

from sqlalchemy import String, DateTime

from app.utils.timezone import now_sr
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Bank(Base):
    __tablename__ = "banks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    bank_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_sr)

    clearing_results: Mapped[list["ClearingResult"]] = relationship(back_populates="bank")  # noqa: F821
