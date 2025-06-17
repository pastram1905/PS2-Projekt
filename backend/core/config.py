from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "MattGantt"
    debug: bool = True
    db_url: str = "sqlite:///./app.db"
    secret_key: str = "YOUR_SECRET_KEY"
    fernet_key: str = "SODcAP4320y9IOf8_CRBFduON_NQrzTrHOqmMXkli8Y="
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 1

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
