from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/eod_settlement"
    OUTPUT_DIR: str = "./generated_files"
    EOD_FILE_PREFIX: str = "NSI_SETTLEMENT"
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # JWT Auth
    SECRET_KEY: str = "change-me-to-a-random-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # SMTP for notifications
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "eod@settlement.local"
    NOTIFICATION_EMAILS: list[str] = []

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
