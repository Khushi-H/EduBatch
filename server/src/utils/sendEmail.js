const nodemailer = require('nodemailer');

/**
 * Sends an email. Priority order:
 *
 *   1. Brevo (HTTP API) - RECOMMENDED. Free (300 emails/day), delivers to
 *      ANY recipient, and needs only a single verified sender EMAIL
 *      ADDRESS (not a domain with DNS records). It's a plain HTTPS call,
 *      so it is never affected by SMTP port blocking - which matters
 *      because Render's free web services block outbound SMTP ports
 *      25/465/587 entirely (since Sept 2025), so option 2 below silently
 *      stops working the moment you deploy there even though it works
 *      fine locally.
 *
 *   2. SMTP via Nodemailer (Gmail App Password, etc.) - free and works
 *      locally / on hosts that allow outbound SMTP (e.g. Railway), but
 *      NOT on Render's free plan (see above). Kept as a fallback for
 *      local development or non-Render hosts.
 *
 *   3. Resend (HTTP API) - only reaches recipients other than your own
 *      account email once you verify a domain in Resend. Keep this unset
 *      if you don't own a domain.
 *
 *   4. Console log fallback (dev only), so local testing never breaks
 *      just because no email provider is configured yet.
 *
 * IMPORTANT: This function NEVER throws. Email is a side-effect (receipts,
 * password reset links) and must never be allowed to fail a core business
 * action like "payment verified" or "password reset requested". Any error
 * is caught, logged, and reported back via the return value instead.
 */
async function sendEmail({ to, subject, html }) {
  try {
    // Option 1: Brevo (HTTP API) - the recommended, deployment-safe, no-domain-required option
    if (process.env.BREVO_API_KEY) {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: {
            email: process.env.BREVO_SENDER_EMAIL,
            name: process.env.BREVO_SENDER_NAME || 'EduBatch',
          },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error('Brevo email error (non-fatal):', response.status, errText);
        return { sent: false, provider: 'brevo', error: errText || `HTTP ${response.status}` };
      }
      return { sent: true, provider: 'brevo' };
    }

    // Option 2: SMTP (Gmail App Password, etc.) - works locally, NOT on Render free tier
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465, // true only for the legacy SSL port
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
      });
      return { sent: true, provider: 'smtp' };
    }

    // Option 3: Resend (HTTP API) - only reaches any recipient once a domain is verified
    if (process.env.RESEND_API_KEY) {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'EduBatch <onboarding@resend.dev>',
        to,
        subject,
        html,
      });
      if (error) {
        console.error('Resend email error (non-fatal):', error);
        return { sent: false, provider: 'resend', error: error.message || 'Resend error' };
      }
      return { sent: true, provider: 'resend' };
    }

    // Option 4: dev fallback - log instead of failing
    console.log('--- EMAIL (dev mode, no email provider configured) ---');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Body:', html);
    console.log('-------------------------------------------------------');
    return { sent: true, provider: 'console', simulated: true };
  } catch (err) {
    // Never let an email failure break the calling business logic
    console.error('sendEmail failed (non-fatal):', err.message);
    return { sent: false, provider: 'unknown', error: err.message };
  }
}

module.exports = sendEmail;