from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.db import get_db
from app.services.redis import RedisManager
from app.utils.responses import SuccessResponse

router = APIRouter()

@router.get("/health", response_model=SuccessResponse[dict])
async def health_check() -> SuccessResponse[dict]:
    """Basic health check endpoint."""
    return SuccessResponse(message="API is healthy", data={"status": "ok"})

@router.get("/health/live", response_model=SuccessResponse[dict])
async def liveness_check() -> SuccessResponse[dict]:
    """Liveness probe: process is up."""
    return SuccessResponse(message="API is alive", data={"status": "ok"})

@router.get("/health/readiness", response_model=SuccessResponse[dict])
async def readiness_check(db: AsyncSession = Depends(get_db)) -> SuccessResponse[dict]:
    """Readiness check including database and Redis connectivity."""
    db_status = "ok"
    redis_status = "ok"
    
    # Check Database
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"
        
    # Check Redis
    is_redis_up = await RedisManager.ping()
    if not is_redis_up:
        redis_status = "error"
        
    status = "ok" if db_status == "ok" and redis_status == "ok" else "error"
    
    return SuccessResponse(
        message="Readiness check completed",
        data={
            "status": status,
            "database": db_status,
            "redis": redis_status,
        }
    )
