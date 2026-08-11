from fastapi import Request


async def get_request_context(request: Request) -> dict:
    """Dependency to extract context from request."""
    return {
        "request_id": request.state.request_id if hasattr(request.state, "request_id") else None,
        "correlation_id": request.state.correlation_id if hasattr(request.state, "correlation_id") else None,
        "client_ip": request.client.host if request.client else None,
    }
