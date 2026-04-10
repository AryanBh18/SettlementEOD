from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/eod_settlement"
    OUTPUT_DIR: str = "./generated_files"
    EOD_FILE_PREFIX: str = "NSI_SETTLEMENT"
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
