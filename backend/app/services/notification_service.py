import logging
from datetime import date
from decimal import Decimal

from app.config import settings

logger = logging.getLogger(__name__)


class NotificationService:
    @staticmethod
    async def send_eod_notification(
        eod_date: date,
        status: str,
        total_transactions: int,
        total_debit: Decimal,
        total_credit: Decimal,
    ) -> bool:
        """Send EOD completion notification via email. Returns True if sent successfully."""
        if not settings.SMTP_HOST or not settings.NOTIFICATION_EMAILS:
            logger.info("SMTP not configured or no recipients — skipping notification")
            return False

        subject = f"EOD Settlement {status} - {eod_date}"
        body = (
            f"EOD Settlement Report\n"
            f"{'=' * 40}\n"
            f"Date: {eod_date}\n"
            f"Status: {status}\n"
            f"Total Transactions: {total_transactions}\n"
            f"Total Debit: {total_debit:.2f}\n"
            f"Total Credit: {total_credit:.2f}\n"
            f"Balance: {'OK' if total_debit == total_credit else 'MISMATCH'}\n"
        )

        try:
            import aiosmtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            msg = MIMEMultipart()
            msg["From"] = settings.SMTP_FROM
            msg["To"] = ", ".join(settings.NOTIFICATION_EMAILS)
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))

            await aiosmtplib.send(
                msg,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER or None,
                password=settings.SMTP_PASSWORD or None,
                start_tls=True,
            )
            logger.info(f"Notification sent to {settings.NOTIFICATION_EMAILS}")
            return True

        except Exception as e:
            logger.error(f"Failed to send notification: {e}")
            return False
