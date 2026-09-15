from redis import asyncio as aioredis

from app.core.config import settings

redis_pool = aioredis.from_url(settings.REDIS_URL, decode_responses=True)


async def get_redis():
    yield redis_pool
