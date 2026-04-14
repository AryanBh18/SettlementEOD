from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.settings import MappingRule, NotificationSetting


class MappingRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, active_only: bool = True) -> list[MappingRule]:
        stmt = select(MappingRule).order_by(MappingRule.id)
        if active_only:
            stmt = stmt.where(MappingRule.is_active == True)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, rule: MappingRule) -> MappingRule:
        self.db.add(rule)
        await self.db.flush()
        await self.db.refresh(rule)
        return rule

    async def update(self, rule_id: int, **kwargs) -> MappingRule | None:
        stmt = select(MappingRule).where(MappingRule.id == rule_id)
        result = await self.db.execute(stmt)
        rule = result.scalar_one_or_none()
        if not rule:
            return None
        for key, value in kwargs.items():
            if hasattr(rule, key):
                setattr(rule, key, value)
        await self.db.flush()
        return rule

    async def delete(self, rule_id: int) -> bool:
        stmt = select(MappingRule).where(MappingRule.id == rule_id)
        result = await self.db.execute(stmt)
        rule = result.scalar_one_or_none()
        if not rule:
            return False
        await self.db.delete(rule)
        await self.db.flush()
        return True


class NotificationSettingsRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self) -> NotificationSetting | None:
        stmt = select(NotificationSetting).limit(1)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update(self, **kwargs) -> NotificationSetting:
        setting = await self.get()
        if not setting:
            setting = NotificationSetting()
            self.db.add(setting)
        for key, value in kwargs.items():
            if hasattr(setting, key):
                setattr(setting, key, value)
        await self.db.flush()
        return setting
