from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "TutorOnline API"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/tutoronline"
    SECRET_KEY: str = "your-secret-key-here" # TO DO: Move to environment variable in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    YANDEX_S3_BUCKET: str = "tutoronline-test"
    YANDEX_S3_ACCESS_KEY: str = ""
    YANDEX_S3_SECRET_KEY: str = ""
    YANDEX_S3_ENDPOINT_URL: str = "https://storage.yandexcloud.net"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
