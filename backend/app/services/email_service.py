import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import asyncio
from app.core.config import settings

def _send_email_sync(to_email: str, subject: str, html_content: str):
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"Skipping email to {to_email} (SMTP credentials not configured in .env)")
        return
        
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = to_email

    msg.attach(MIMEText(html_content, "html"))

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        print(f"Successfully sent email to {to_email}: {subject}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

async def send_ticket_confirmation(user_email: str, order_ref: str, tickets: list):
    subject = f"Your Tickets are Confirmed! Order {order_ref}"
    tickets_html = "".join([f"<li><b>{t.title}</b> ({t.item_type}) - Passenger: {t.passenger_name} - Ref: {t.ticket_ref}</li>" for t in tickets])
    html_content = f"<html><body><h2>Payment Successful</h2><p>Your order <strong>{order_ref}</strong> is confirmed.</p><p>Tickets:</p><ul>{tickets_html}</ul><p>Access your Unified QR Boarding Pass in the portal.</p></body></html>"
    await asyncio.to_thread(_send_email_sync, user_email, subject, html_content)

async def send_agent_approval_email(agent_email: str, agent_name: str):
    subject = "Agent Account Approved - Andaman Tourism"
    html_content = f"<html><body><h2>Congratulations, {agent_name}!</h2><p>Your B2B Agent account has been officially verified and approved by ANIIDCO.</p><p>You can now log in to the portal and start booking bulk tickets for your clients.</p></body></html>"
    await asyncio.to_thread(_send_email_sync, agent_email, subject, html_content)

async def send_admin_alert_email(admin_email: str, alert_title: str, alert_details: str):
    subject = f"URGENT SYSTEM ALERT: {alert_title}"
    html_content = f"<html><body><h2 style='color:red;'>System Alert</h2><p><strong>{alert_title}</strong></p><p>{alert_details}</p><p>Please log in to the Admin Dashboard to take action immediately.</p></body></html>"
    await asyncio.to_thread(_send_email_sync, admin_email, subject, html_content)

async def send_otp_email(user_email: str, otp_code: str):
    subject = "Your Andaman Tourism Verification Code"
    html_content = f"<html><body><h2>Your Verification Code</h2><p>Please use the following OTP to complete your registration:</p><h1 style='letter-spacing: 5px;'>{otp_code}</h1><p>This code will expire in 10 minutes. Do not share it with anyone.</p></body></html>"
    await asyncio.to_thread(_send_email_sync, user_email, subject, html_content)

async def send_revised_ticket_email(user_email: str, ticket_ref: str, new_slot: str):
    subject = f"Your Ticket Time Slot has been Revised: {ticket_ref}"
    html_content = f"<html><body><h2>Ticket Modification Approved</h2><p>ANIIDCO has approved your request to modify ticket <strong>{ticket_ref}</strong>.</p><p>Your new approved time slot is: <strong>{new_slot}</strong></p><p>Your Unified QR Boarding pass has been automatically updated.</p></body></html>"
    await asyncio.to_thread(_send_email_sync, user_email, subject, html_content)
