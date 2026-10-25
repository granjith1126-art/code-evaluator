import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "AI Code Evaluator"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8001
    HOST: str = "0.0.0.0"
    SECRET_KEY: str = "dev-secret-key-evaluator-2026-secure-random-token-xyz"
    
    # Database
    DATABASE_URL: str = "sqlite:///./app.db"
    
    # AI Providers
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.8-flash"
    DEFAULT_AI_PROVIDER: str = "gemini"
    AI_TIMEOUT_SECONDS: int = 45
    MAX_AI_RETRIES: int = 2
    
    # Execution Sandbox
    SANDBOX_MODE: str = "auto"  # 'auto', 'docker', 'subprocess'
    SANDBOX_TIMEOUT_SECONDS: int = 5
    SANDBOX_MAX_MEMORY_MB: int = 128
    SANDBOX_MAX_OUTPUT_BYTES: int = 65536
    DOCKER_IMAGE_NAME: str = "code-evaluator-sandbox:latest"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5174,http://localhost:5173,http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
