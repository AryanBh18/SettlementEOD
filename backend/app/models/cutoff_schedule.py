from datetime import datetime

from sqlalchemy import String, Boolean, DateTime

from app.utils.timezone import now_sr
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CutoffSchedule(Base):
    __tablename__ = "cutoff_schedules"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    cutoff_time: Mapped[str] = mapped_column(String(5), nullable=False, default="16:00")
    is_auto_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_sr)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now_sr, onupdate=now_sr)
