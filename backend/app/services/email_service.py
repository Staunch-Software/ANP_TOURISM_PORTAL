import smtplib
import io
import qrcode
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
import asyncio
from app.core.config import settings
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader

def _send_email_sync(to_email: str, subject: str, html_content: str, attachments: list = None):
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"Skipping email to {to_email} (SMTP credentials not configured in .env)")
        return
        
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = to_email

    msg.attach(MIMEText(html_content, "html"))

    if attachments:
        for filename, file_data in attachments:
            part = MIMEApplication(file_data, Name=filename)
            part['Content-Disposition'] = f'attachment; filename="{filename}"'
            msg.attach(part)

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        print(f"Successfully sent email to {to_email}: {subject}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

def generate_unified_pdf(order_ref: str, tickets: list) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter
    
    # Draw Header
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width/2, height - 50, "ANDAMAN & NICOBAR TOURISM")
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width/2, height - 70, "UNIFIED QR BOARDING PASS")
    
    c.line(50, height - 80, width - 50, height - 80)
    
    # Booking Details
    head = tickets[0]
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 110, "BOOKING DETAILS")
    
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 130, f"Order Ref: {order_ref}")
    c.drawString(300, height - 130, f"Lead Passenger: {head.passenger_name}")
    c.drawString(50, height - 145, f"ID Verification: {head.id_type}")
    c.drawString(300, height - 145, f"Age/Gender: {head.passenger_age} | {head.passenger_gender}")
    
    c.line(50, height - 160, width - 50, height - 160)
    
    # QR Code
    qr_data = f"{head.qr_payload_json}|SIG:{head.qr_signature_b64}"
    qr_img = qrcode.make(qr_data).convert("RGB")
    qr_buf = io.BytesIO()
    qr_img.save(qr_buf, format="PNG")
    qr_buf.seek(0)
    
    qr_size = 2 * inch
    c.drawImage(ImageReader(qr_buf), (width - qr_size)/2, height - 380, width=qr_size, height=qr_size)
    
    c.setFont("Helvetica-Oblique", 9)
    c.drawCentredString(width/2, height - 395, "(Scan this single QR code at all entry gates)")
    
    c.line(50, height - 410, width - 50, height - 410)
    
    # Itinerary
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 435, "ITINERARY & ATTRACTIONS INCLUDED")
    
    c.setFont("Helvetica", 10)
    y_pos = height - 455
    for idx, t in enumerate(tickets, 1):
        if y_pos < 100:
            c.showPage()
            c.setFont("Helvetica", 10)
            y_pos = height - 50
            
        c.drawString(50, y_pos, f"{idx}. {t.item_type} - {t.title}")
        c.drawString(70, y_pos - 15, f"Time Slot: {t.slot_or_seat_info}")
        c.drawString(70, y_pos - 30, f"Passenger: {t.passenger_name}  |  Check-in Status: {t.check_in_status}")
        y_pos -= 50
        
    c.line(50, y_pos - 10, width - 50, y_pos - 10)
    
    # T&C
    y_pos -= 30
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, y_pos, "TERMS & CONDITIONS")
    c.setFont("Helvetica", 9)
    c.drawString(50, y_pos - 15, "1. Please carry a valid government ID (AADHAAR, PAN, Passport).")
    c.drawString(50, y_pos - 30, "2. Arrive at least 30 minutes prior to your scheduled time slot.")
    c.drawString(50, y_pos - 45, "3. This QR code is valid for single entry at each listed attraction.")
    
    c.save()
    return buf.getvalue()

async def send_ticket_confirmation(user_email: str, order_ref: str, tickets: list):
    if not tickets:
        return
        
    pdf_bytes = generate_unified_pdf(order_ref, tickets)
    filename = f"Boarding_Pass_{order_ref}.pdf"
    
    subject = f"Your Unified Boarding Pass - Order {order_ref}"
    tickets_html = "".join([f"<li><b>{t.title}</b> ({t.item_type}) - Passenger: {t.passenger_name}</li>" for t in tickets])
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Payment Successful!</h2>
        <p>Dear <strong>{tickets[0].passenger_name}</strong>,</p>
        <p>Thank you for booking with Andaman & Nicobar Tourism. Your payment has been successfully processed and your order <strong>{order_ref}</strong> is confirmed.</p>
        <p>We have attached your <strong>Unified QR Boarding Pass</strong> to this email as a PDF document. Please download the attachment and keep it handy on your phone or print it out. You can scan this single QR code for seamless entry at all the attractions and ferries included in your booking.</p>
        <p><strong>Included in your booking:</strong></p>
        <ul>
            {tickets_html}
        </ul>
        <p>Have a wonderful trip to the islands!</p>
        <br>
        <p>Thanks & Regards,<br><strong>The Andaman Tourism Team</strong></p>
    </body>
    </html>
    """
    
    attachments = [(filename, pdf_bytes)]
    await asyncio.to_thread(_send_email_sync, user_email, subject, html_content, attachments)

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

async def send_pre_visit_reminder(user_email: str, title: str, slot_or_seat_info: str, ticket_ref: str):
    subject = f"Reminder: Your visit to {title} is coming up"
    html_content = f"<html><body><h2>Upcoming Visit Reminder</h2><p>This is a reminder that your booking for <strong>{title}</strong> is scheduled soon:</p><p><strong>{slot_or_seat_info}</strong></p><p>Ticket Ref: {ticket_ref}</p><p>Please have your Unified QR Boarding Pass ready for entry. Access it anytime in the portal's Digital Pass Wallet.</p></body></html>"
    await asyncio.to_thread(_send_email_sync, user_email, subject, html_content)
