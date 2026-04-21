from datetime import datetime

from sqlalchemy import String, DateTime, Boolean, Text

from app.utils.timezone import now_sr
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MappingRule(Base):
    __tablename__ = "mapping_rules"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    rule_name: Mapped[str] = mapped_column(String(100), nullable=False)
    field_source: Mapped[str] = mapped_column(String(100), nullable=False)
    field_target: Mapped[str] = mapped_column(String(100), nullable=False)
    transform_type: Mapped[str] = mapped_column(String(50), nullable=False, default="DIRECT")
    transform_config: Mapped[dict | None] = mapped_column(JSONB, default={})
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_sr)


class NotificationSetting(Base):
    __tablename__ = "notification_settings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email_recipients: Mapped[dict | None] = mapped_column(JSONB, default=[])
    notify_on_success: Mapped[bool] = mapped_column(Boolean, default=False)
    notify_on_failure: Mapped[bool] = mapped_column(Boolean, default=True)
    smtp_configured: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_sr)
