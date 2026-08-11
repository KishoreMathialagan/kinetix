from typing import Any, cast

import structlog
from redis.asyncio import Redis

from app.config import settings

logger = structlog.get_logger(__name__)

class RedisManager:
    _client: Redis | None = None

    @classmethod
    async def get_client(cls) -> Redis:
        if cls._client is None:
            logger.info("Initializing Redis client")
            cls._client = Redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_timeout=5.0,
            )
        return cls._client

    @classmethod
    async def close(cls) -> None:
        if cls._client is not None:
            logger.info("Closing Redis client")
            await cls._client.aclose()
            cls._client = None

    @classmethod
    async def ping(cls) -> bool:
        """Check Redis connectivity."""
        try:
            client = await cls.get_client()
            return await client.ping()
        except Exception as e:
            logger.error("Redis ping failed", error=str(e))
            return False

    @classmethod
    async def set(cls, key: str, value: Any, ex: int | None = None) -> None:
        client = await cls.get_client()
        await client.set(name=key, value=value, ex=ex)

    @classmethod
    async def get(cls, key: str) -> str | None:
        client = await cls.get_client()
        return cast("str | None", await client.get(name=key))

    @classmethod
    async def delete(cls, key: str) -> None:
        client = await cls.get_client()
        await client.delete(key)
