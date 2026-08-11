import time
from pathlib import Path

import structlog
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = structlog.get_logger("api.access")

REQUEST_LOG_FILE = Path(__file__).resolve().parents[2] / "requests.log"

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        request_id = getattr(request.state, "request_id", None)
        correlation_id = getattr(request.state, "correlation_id", None)
        
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            correlation_id=correlation_id,
            path=request.url.path,
            method=request.method,
            client_ip=request.client.host if request.client else None,
        )
        
        try:
            response = await call_next(request)
            
            process_time = time.time() - start_time
            response.headers["X-Process-Time"] = str(process_time)
            
            logger.info(
                "Request completed",
                status_code=response.status_code,
                process_time_ms=round(process_time * 1000, 2),
            )
            self._write_request_log(request, response, process_time)
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.exception(
                "Request failed",
                process_time_ms=round(process_time * 1000, 2),
            )
            raise
        finally:
            structlog.contextvars.clear_contextvars()

    def _write_request_log(self, request: Request, response, process_time: float) -> None:
        try:
            with REQUEST_LOG_FILE.open("a", encoding="utf-8") as f:
                f.write(
                    f"{time.strftime('%Y-%m-%d %H:%M:%S')} {request.method} "
                    f"{request.url.path} -> {response.status_code} ({process_time * 1000:.0f}ms)\n"
                )
        except Exception:
            pass
