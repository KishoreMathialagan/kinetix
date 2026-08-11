import structlog
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import AppException
from app.utils.responses import ErrorResponse

logger = structlog.get_logger(__name__)

def setup_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        response = ErrorResponse(
            code=exc.code,
            message=exc.message,
            errors=exc.errors
        )
        return JSONResponse(status_code=exc.status_code, content=response.model_dump())

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        errors = exc.errors()
        response = ErrorResponse(
            code="VALIDATION_ERROR",
            message="Input validation failed",
            errors=[{"loc": err["loc"], "msg": err["msg"], "type": err["type"]} for err in errors]
        )
        return JSONResponse(status_code=422, content=response.model_dump())

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        response = ErrorResponse(
            code="HTTP_ERROR",
            message=str(exc.detail),
        )
        return JSONResponse(status_code=exc.status_code, content=response.model_dump())

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception", error=str(exc))
        response = ErrorResponse(
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred",
        )
        return JSONResponse(status_code=500, content=response.model_dump())
