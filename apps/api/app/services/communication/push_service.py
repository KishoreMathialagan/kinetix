import logging
import uuid

logger = logging.getLogger(__name__)


async def send_push(
    user_id: uuid.UUID, title: str, body: str, device_tokens: list[str] | None = None
) -> None:
    """Push notification delivery scaffold.

    Device tokens are registered via ``POST /notifications/device-tokens``.
    A real push provider (e.g. FCM/APNs) can be wired in here later; the
    scaffold intentionally only logs so the rest of the system is safe to
    call in development.
    """
    logger.info(
        "Push delivery scaffold: would notify user %s with %d device token(s): %s",
        user_id,
        len(device_tokens or []),
        title,
    )
