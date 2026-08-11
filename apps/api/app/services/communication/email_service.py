import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger(__name__)


def smtp_enabled() -> bool:
    return bool(settings.SMTP_HOST)


def _send_sync(to_email: str, subject: str, body: str) -> None:
    if not smtp_enabled():
        logger.warning("SMTP not configured; email delivery skipped for %s", to_email)
        return
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = to_email
    msg.set_content(body)
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
        if settings.SMTP_TLS:
            server.starttls()
        if settings.SMTP_USER:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)


async def send_email(to_email: str, subject: str, body: str) -> bool:
    """Send an email via SMTP. Returns True when delivered or skipped."""
    try:
        await asyncio.to_thread(_send_sync, to_email, subject, body)
        return True
    except Exception as exc:  # pragma: no cover - SMTP errors are environment-specific
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False
