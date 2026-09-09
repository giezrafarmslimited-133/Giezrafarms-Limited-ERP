/**
 * GIEZRA ERP - Email Dispatcher Service
 * Integrates directly with Google Gmail API (v1) and backend verification APIs
 */

import { getGoogleAccessToken } from './googleAuth';

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  method: 'GMAIL_API' | 'SERVER_SIMULATION';
  error?: string;
}

/**
 * Builds RFC 2822 base64url encoded email string
 */
function createRawEmail({
  to,
  from,
  subject,
  htmlBody
}: {
  to: string;
  from?: string;
  subject: string;
  htmlBody: string;
}): string {
  const fromHeader = from ? `From: ${from}` : 'From: GIEZRA ERP Security <giezrafarmslimited@gmail.com>';
  const toHeader = `To: ${to}`;
  const subjectHeader = `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const mimeHeaders = [
    fromHeader,
    toHeader,
    'Content-Type: text/html; charset=UTF-8',
    'MIME-Version: 1.0',
    subjectHeader
  ];

  const fullMessage = `${mimeHeaders.join('\r\n')}\r\n\r\n${htmlBody}`;
  
  // Base64url encode for Gmail API
  return btoa(unescape(encodeURIComponent(fullMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sends an email using Google Gmail API
 */
export async function sendEmailViaGmailApi({
  to,
  subject,
  htmlBody,
  token
}: {
  to: string;
  subject: string;
  htmlBody: string;
  token?: string;
}): Promise<EmailDispatchResult> {
  const accessToken = token || getGoogleAccessToken();

  if (!accessToken) {
    return {
      success: false,
      method: 'SERVER_SIMULATION',
      error: 'No Google OAuth access token available'
    };
  }

  try {
    const raw = createRawEmail({
      to,
      subject,
      htmlBody
    });

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Gmail API error ${response.status}`);
    }

    const data = await response.json();
    
    // Log to ERP server audit trail
    try {
      await fetch('/api/auth/log-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          status: 'SENT_VIA_GMAIL_API',
          messageId: data.id,
          type: subject.includes('OTP') ? 'otp_verification' : 'login_alert'
        })
      });
    } catch {
      // Ignore background log error
    }

    return {
      success: true,
      messageId: data.id,
      method: 'GMAIL_API'
    };
  } catch (err: any) {
    console.warn('Direct Gmail API send failed, falling back to server dispatch:', err);
    return {
      success: false,
      method: 'GMAIL_API',
      error: err.message || 'Failed to dispatch via Gmail API'
    };
  }
}

/**
 * Generate standard branded HTML template for OTP verification
 */
export function buildOtpEmailHtml({
  recipientName,
  otpCode,
  purpose,
  expiresInMinutes = 10
}: {
  recipientName: string;
  otpCode: string;
  purpose: string;
  expiresInMinutes?: number;
}): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d1b1e; margin: 0; padding: 24px; color: #f8fafc; }
      .card { max-width: 540px; margin: 0 auto; background: #132a24; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
      .header { display: flex; align-items: center; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; }
      .logo-title { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; }
      .gold { color: #d4af37; }
      .subtitle { font-size: 11px; color: #52b788; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-top: 2px; }
      .greeting { font-size: 16px; margin-bottom: 16px; color: #e2e8f0; }
      .message { font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px; }
      .otp-box { background: #0b1d16; border: 2px solid #d4af37; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0; }
      .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #d4af37; font-family: monospace; }
      .otp-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; }
      .warning { font-size: 12px; color: #94a3b8; line-height: 1.5; border-left: 3px solid #d4af37; padding-left: 12px; margin-top: 24px; }
      .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; color: #64748b; text-align: center; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <div>
          <div class="logo-title">GIEZRA <span class="gold">ERP</span></div>
          <div class="subtitle">GIEZRA FARMS LIMITED • SECURITY DESK</div>
        </div>
      </div>
      
      <div class="greeting">Hello, <strong>${recipientName || 'Team Member'}</strong>!</div>
      <div class="message">
        You requested a verification passcode to authorize your <strong>${purpose}</strong> on the GIEZRA Smart Poultry Business System. Use the official 6-digit One-Time Passcode (OTP) below to complete your verification:
      </div>

      <div class="otp-box">
        <div class="otp-code">${otpCode}</div>
        <div class="otp-label">One-Time Verification Passcode (Expires in ${expiresInMinutes} mins)</div>
      </div>

      <div class="warning">
        <strong>Security Notice:</strong> Never share this OTP passcode with anyone. GIEZRA Operations and IT staff will never ask for your verification code over the phone, SMS, or WhatsApp.
      </div>

      <div class="footer">
        © ${new Date().getFullYear()} GIEZRA FARMS LIMITED • Kibaha, Coast Region, Tanzania<br/>
        Automated Security Dispatch via Google Workspace & Gmail API
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Generate HTML template for new login notification
 */
export function buildLoginAlertEmailHtml({
  recipientName,
  device,
  location,
  timestamp
}: {
  recipientName: string;
  device?: string;
  location?: string;
  timestamp?: string;
}): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
      .card { max-width: 520px; margin: 0 auto; background: #1e293b; border: 1px solid rgba(82, 183, 136, 0.3); border-radius: 20px; padding: 28px; }
      .title { font-size: 20px; font-weight: 800; color: #ffffff; }
      .gold { color: #d4af37; }
      .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 13px; }
      .label { color: #94a3b8; }
      .val { color: #f1f5f9; font-weight: 600; }
      .footer { font-size: 11px; color: #64748b; margin-top: 24px; text-align: center; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="title">GIEZRA <span class="gold">SECURITY</span> • New Login Alert</div>
      <p style="font-size: 14px; color: #cbd5e1; margin-top: 12px;">
        A successful login to your GIEZRA ERP account was recorded for <strong>${recipientName}</strong>.
      </p>
      
      <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 12px 16px; margin: 16px 0;">
        <div class="info-row">
          <span class="label">Date & Time:</span>
          <span class="val">${timestamp || new Date().toUTCString()}</span>
        </div>
        <div class="info-row">
          <span class="label">Device:</span>
          <span class="val">${device || 'Web Browser (SSL Verified)'}</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="label">Access Point:</span>
          <span class="val">${location || 'Kibaha / Dar es Salaam, Tanzania'}</span>
        </div>
      </div>

      <p style="font-size: 12px; color: #94a3b8;">
        If this was you, no action is required. If you did not perform this login, immediately notify the System Administrator or CEO.
      </p>
      
      <div class="footer">
        © ${new Date().getFullYear()} GIEZRA FARMS LIMITED • Dar es Salaam & Coast Region
      </div>
    </div>
  </body>
  </html>
  `;
}
