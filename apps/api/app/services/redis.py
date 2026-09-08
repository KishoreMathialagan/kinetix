from typing import Any

import structlog
from redis.asyncio import Redis

from app.config import settings

logger = structlog.get_logger(__name__)

class RedisManager:
    _client: Redis | None = None
    _unavailable: bool = False

    @classmethod
    async def get_client(cls) -> Redis | None:
        if cls._unavailable:
            return None
        if cls._client is None:
            try:
                logger.info("Initializing Redis client")
                cls._client = Redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_timeout=2.0,
                    socket_connect_timeout=2.0,
                )
                await cls._client.ping()
            except Exception as e:
                logger.warning("Redis not available, disabling cache", error=str(e))
                cls._unavailable = True
                cls._client = None
                return None
        return cls._client

    @classmethod
    async def close(cls) -> None:
        if cls._client is not None:
            logger.info("Closing Redis client")
            await cls._client.aclose()
            cls._client = None

    @classmethod
    async def ping(cls) -> bool:
        client = await cls.get_client()
        if client is None:
            return False
        try:
            return await client.ping()
        except Exception:
            return False

    @classmethod
    async def set(cls, key: str, value: Any, ex: int | None = None) -> None:
        client = await cls.get_client()
        if client is None:
            return
        await client.set(name=key, value=value, ex=ex)

    @classmethod
    async def get(cls, key: str) -> str | None:
        client = await cls.get_client()
        if client is None:
            return None
        return await client.get(name=key)

    @classmethod
    async def delete(cls, key: str) -> None:
        client = await cls.get_client()
        if client is None:
            return
        await client.delete(key)
