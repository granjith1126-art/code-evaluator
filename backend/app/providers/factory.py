import logging
from typing import Optional
from app.core.config import settings
from app.providers.base import BaseAIProvider
from app.providers.gemini_provider import GeminiAIProvider
from app.providers.openai_provider import OpenAIProvider
from app.providers.mock_provider import MockAIProvider

logger = logging.getLogger(__name__)

class AIProviderFactory:
    def __init__(self):
        self._mock = MockAIProvider()
        self._gemini = GeminiAIProvider(
            api_key=settings.GEMINI_API_KEY,
            model=settings.GEMINI_MODEL,
            timeout_seconds=settings.AI_TIMEOUT_SECONDS
        )
        self._openai = OpenAIProvider(
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_MODEL,
            timeout_seconds=settings.AI_TIMEOUT_SECONDS
        )

    def get_provider(self, provider_name: Optional[str] = None) -> BaseAIProvider:
        target = (provider_name or settings.DEFAULT_AI_PROVIDER).lower()

        if target == "gemini":
            if self._gemini.is_configured():
                return self._gemini
            logger.warning("Gemini requested but not configured, falling back to mock.")
            return self._mock

        if target == "openai":
            if self._openai.is_configured():
                return self._openai
            logger.warning("OpenAI requested but not configured, falling back to mock.")
            return self._mock

        return self._mock

    def get_provider_status(self):
        return [
            {
                "provider": "gemini",
                "configured": self._gemini.is_configured(),
                "default": settings.DEFAULT_AI_PROVIDER.lower() == "gemini",
                "model": settings.GEMINI_MODEL,
                "active": self._gemini.is_configured(),
                "status_message": "Active & Verified" if self._gemini.is_configured() else "Key Missing"
            },
            {
                "provider": "openai",
                "configured": self._openai.is_configured(),
                "default": settings.DEFAULT_AI_PROVIDER.lower() == "openai",
                "model": settings.OPENAI_MODEL,
                "active": self._openai.is_configured(),
                "status_message": "Configured (Check Quota)" if self._openai.is_configured() else "Key Missing"
            },
            {
                "provider": "mock",
                "configured": True,
                "default": settings.DEFAULT_AI_PROVIDER.lower() == "mock",
                "model": "mock-evaluator-v1",
                "active": True,
                "status_message": "Always Available (Deterministic Test Double)"
            }
        ]

ai_provider_factory = AIProviderFactory()
