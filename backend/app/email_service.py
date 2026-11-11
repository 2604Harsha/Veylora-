
import os
import smtplib
import ssl
import html

from email.message import EmailMessage
from email.utils import formataddr
from dotenv import load_dotenv

load_dotenv()


def send_email(to_email: str, subject: str, html_body: str):

    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))

    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")

    from_email = os.getenv("SMTP_FROM_EMAIL")
    from_name = os.getenv("SMTP_FROM_NAME", "Veylora")

    if not all([host, username, password, from_email]):
        raise RuntimeError(
            "Email SMTP configuration is incomplete. Check .env"
        )

    message = EmailMessage()

    message["Subject"] = subject
    message["From"] = formataddr((from_name, from_email))
    message["To"] = to_email

    message.set_content(
        "Please view this email in an HTML-compatible email client."
    )

    message.add_alternative(html_body, subtype="html")

    context = ssl.create_default_context()

    try:
        if port == 465:

            with smtplib.SMTP_SSL(
                host,
                port,
                context=context,
                timeout=30
            ) as server:

                server.login(username, password)
                server.send_message(message)

        else:

            with smtplib.SMTP(
                host,
                port,
                timeout=30
            ) as server:

                server.ehlo()
                server.starttls(context=context)
                server.ehlo()

                server.login(username, password)
                server.send_message(message)

        print(f"Email successfully sent to {to_email}")

    except smtplib.SMTPAuthenticationError as e:
        raise RuntimeError(
            "SMTP authentication failed. Check username and App Password."
        ) from e

    except smtplib.SMTPServerDisconnected as e:
        raise RuntimeError(
            "SMTP server disconnected. Check SMTP host, port and TLS settings."
        ) from e

    except Exception as e:
        raise RuntimeError(
            f"Email delivery failed: {str(e)}"
        ) from e


def send_welcome_email(name: str, email: str):

    safe_name = html.escape(name)

    body = f"""
    <html>
      <body style="font-family:Arial;background:#101b2d;padding:30px;color:#eaf2f5">
        <div style="max-width:550px;margin:auto;background:#1b2b40;padding:30px;border-radius:15px">
          <h1 style="color:#20c997">Welcome to Veylora!</h1>
          <p>Hello {safe_name},</p>
          <p>Your Veylora account has been created successfully.</p>
          <p>You can now sign in and access your personal dashboard.</p>
          <p style="color:#20c997">Your Identity. Your Access. Your Space.</p>
        </div>
      </body>
    </html>
    """

    send_email(email, "Welcome to Veylora!", body)


def send_reset_email(name: str, email: str, reset_link: str):

    safe_name = html.escape(name)
    safe_link = html.escape(reset_link, quote=True)

    body = f"""
    <html>
      <body style="font-family:Arial;background:#101b2d;padding:30px;color:#eaf2f5">
        <div style="max-width:550px;margin:auto;background:#1b2b40;padding:30px;border-radius:15px">
          <h1 style="color:#20c997">Reset your password</h1>

          <p>Hello {safe_name},</p>

          <p>We received a request to reset your Veylora password.</p>

          <p>This link expires in 15 minutes and can only be used once.</p>

          <a href="{safe_link}"
             style="display:inline-block;background:#20c997;color:#101b2d;
             padding:14px 22px;text-decoration:none;border-radius:8px;font-weight:bold">
             Create New Password
          </a>

          <p style="margin-top:25px;font-size:12px;color:#a5b3c6">
            If you did not request this, you can ignore this email.
          </p>
        </div>
      </body>
    </html>
    """

    send_email(email, "Veylora Password Reset", body)
