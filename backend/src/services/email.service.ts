import { Resend } from 'resend';
import { RESEND_API_KEY, EMAIL_FROM, NODE_ENV } from '../config/env.js';

const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

interface SendOtpEmailOptions {
  email: string;
  otp: string;
  purpose: 'email_verification' | 'password_reset';
}

/**
 * Builds a prestigious Academy HTML email for OTP codes.
 */
const buildOtpEmailHtml = (otp: string, purpose: 'email_verification' | 'password_reset'): string => {
  const isVerification = purpose === 'email_verification';
  const heading = isVerification ? 'Verify Your Candidate Email' : 'Reset Your Classroom Password';
  const description = isVerification
    ? 'Welcome to Rajinder Law Academy. Please use the 6-digit verification code below to confirm your student email address and proceed to judicial classroom onboarding.'
    : 'A request was received to reset your Academy account password. Use the 6-digit security code below to complete your password reset.';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${heading}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #061120; color: #ffffff; margin: 0; padding: 24px; }
    .container { max-width: 540px; margin: 0 auto; background-color: #0a1c36; border: 1px solid #143564; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(180deg, #0e274c 0%, #0a1c36 100%); padding: 28px 24px; text-align: center; border-bottom: 1px solid #143564; }
    .title { font-size: 18px; font-weight: 700; color: #c19b48; letter-spacing: 1.5px; text-transform: uppercase; margin: 0; }
    .subtitle { font-size: 11px; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; margin-top: 6px; }
    .content { padding: 32px 28px; text-align: center; }
    .heading { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
    .text { font-size: 13px; line-height: 1.6; color: #cbd5e1; margin-bottom: 28px; }
    .otp-box { display: inline-block; background-color: #c19b48; color: #061120; font-size: 32px; font-weight: 800; font-family: 'Courier New', Courier, monospace; letter-spacing: 10px; padding: 14px 28px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(193, 155, 72, 0.3); }
    .notice { font-size: 11px; color: #94a3b8; line-height: 1.5; margin-top: 16px; }
    .footer { padding: 20px 24px; background-color: #061120; border-top: 1px solid #143564; text-align: center; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">RAJINDER LAW ACADEMY</h1>
      <div class="subtitle">Judicial Services &amp; Higher Judiciary Classroom</div>
    </div>
    <div class="content">
      <div class="heading">${heading}</div>
      <p class="text">${description}</p>
      <div class="otp-box">${otp}</div>
      <p class="notice">
        ⏱️ This security code is strictly confidential and valid for <strong>10 minutes</strong>.<br>
        If you did not initiate this action, you can safely disregard this message.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Rajinder Law Academy. All Rights Reserved.<br>
      Admissions &amp; Judicial Services Examination Cell
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Dispatches an OTP code via Resend, falling back to console logger in development.
 */
export const sendOtpEmail = async ({ email, otp, purpose }: SendOtpEmailOptions): Promise<void> => {
  const isVerification = purpose === 'email_verification';
  const subject = isVerification
    ? `${otp} is your Rajinder Law Academy verification code`
    : `${otp} is your Password Reset Code - Rajinder Law Academy`;

  const html = buildOtpEmailHtml(otp, purpose);

  if (resendClient) {
    try {
      const response = await resendClient.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject,
        html,
      });

      if (response.error) {
        console.error('[Resend Error]', response.error);
        // Do not crash in development if API key has restricted sandbox permissions
        if (NODE_ENV !== 'production') {
          console.warn(`[DEV-FALLBACK] OTP for ${email}: ${otp}`);
          return;
        }
        throw new Error(response.error.message || 'Failed to dispatch email via Resend');
      }

      console.log(`[Resend Email Dispatched] ID: ${response.data?.id} to ${email}`);
      return;
    } catch (err: any) {
      console.error('[Resend Exception]', err.message);
      if (NODE_ENV !== 'production') {
        console.warn(`[DEV-FALLBACK] OTP for ${email}: ${otp}`);
        return;
      }
      throw err;
    }
  }

  // Fallback for Local Development when no API Key is configured yet
  console.log(`\n======================================================`);
  console.log(`[RLA-RESEND-DEV] 📨 OTP Dispatched to ${email}`);
  console.log(`[RLA-RESEND-DEV] 🔑 Security Code: ${otp}`);
  console.log(`[RLA-RESEND-DEV] 🎯 Purpose: ${purpose}`);
  console.log(`[RLA-RESEND-DEV] ⏳ Validity: 10 Minutes`);
  console.log(`======================================================\n`);
};
