from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.routers import api_router
from app.config import settings
from app.core.logger import setup_logging
from app.middleware.error_handlers import setup_exception_handlers
from app.middleware.logging import LoggingMiddleware
from app.middleware.request_context import RequestContextMiddleware
from app.services.redis import RedisManager
from app.utils.responses import SuccessResponse

# Setup structured logging early
setup_logging()
logger = structlog.get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up application...")
    
    # Pre-init redis so it's ready
    await RedisManager.get_client()
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    await RedisManager.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for Kinetix Home Care Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Exception handlers
setup_exception_handlers(app)

# Middlewares (Order matters: outer to inner)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
# Depending on environment, you might configure TrustedHostMiddleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"]) # Default open for dev

# Routers
app.include_router(api_router, prefix="/api/v1")

@app.get("/", response_model=SuccessResponse[dict])
async def root() -> SuccessResponse[dict]:
    """Root endpoint with basic API info."""
    return SuccessResponse(
        message="Welcome to Kinetix Home Care API",
        data={
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "docs": "/docs",
            "health": "/api/v1/system/health",
        },
    )

@app.get("/favicon.ico", include_in_schema=False)
async def favicon() -> JSONResponse:
    return JSONResponse(status_code=204, content=None)
