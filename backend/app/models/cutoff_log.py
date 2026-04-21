from datetime import date, datetime

from sqlalchemy import String, Date, DateTime, Text, Integer, ForeignKey

from app.utils.timezone import now_sr
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CutoffLog(Base):
    __tablename__ = "cutoff_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    settlement_date: Mapped[date] = mapped_column(Date, unique=True, nullable=False)
    cutoff_timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=now_sr)
    triggered_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_sr)
