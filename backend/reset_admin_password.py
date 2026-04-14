"""
One-time utility to reset the admin password.
Run from the backend directory:
  python reset_admin_password.py [new_password]
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
os.chdir(os.path.dirname(__file__))

from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

from app.config import settings

async def reset():
    password = sys.argv[1] if len(sys.argv) > 1 else "admin123"
    ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed = ctx.hash(password)

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        result = await conn.execute(
            text("UPDATE users SET password_hash = :h WHERE username = 'admin' RETURNING id, username"),
            {"h": hashed}
        )
        row = result.fetchone()
        if row:
            print(f"Password reset for user '{row.username}' (id={row.id})")
            print(f"New password: {password}")
        else:
            print("Admin user not found — inserting...")
            await conn.execute(
                text("INSERT INTO users (username, password_hash, email, role, is_active) VALUES ('admin', :h, 'admin@eod-settlement.local', 'ADMIN', TRUE)"),
                {"h": hashed}
            )
            print(f"Admin user created with password: {password}")

    await engine.dispose()

asyncio.run(reset())
