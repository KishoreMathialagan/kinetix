from redis.asyncio import Redis

from app.services.redis import RedisManager


async def get_redis() -> Redis:
    """Dependency to get the Redis client."""
    return await RedisManager.get_client()
