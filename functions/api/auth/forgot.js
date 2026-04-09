/**
 * POST /api/auth/forgot — Request password reset
 * Generates a token in KV (1h TTL).
 *
 * Email sending:
 * - If RESEND_API_KEY is set → sends via Resend
 * - Otherwise → logs the reset URL (dev mode)
 *
 * To configure: add RESEND_API_KEY as env var in Cloudflare Pages settings.
 * Free tier: 100 emails/day. Sign up at resend.com (no credit card).
 */
export async function onRequestPost({ request, env }) {
  const { email } = await request.json().catch(() => ({}));
  if (!email) return Response.json({ ok: false, error: 'Missing email' }, { status: 400 });

  const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase().trim()).first();
  if (!user) return Response.json({ ok: true, message: 'If the email exists, a reset link has been sent.' });

  const token = crypto.randomUUID();
  await env.SESSIONS.put('vb_reset_' + token, JSON.stringify({ userId: user.id, email: email.toLowerCase().trim() }), { expirationTtl: 3600 });

  const origin = new URL(request.url).origin;
  const resetUrl = `${origin}/reset.html?token=${token}`;
  const sender = env.EMAIL_FROM || 'noreply@automators.work';

  if (env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: sender,
          to: email.toLowerCase().trim(),
          subject: 'Password Reset — VanillaBuilder',
          html: `<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:32px;"><h2 style="color:#7c3aed;">VanillaBuilder</h2><p>You requested a password reset. Click the link below:</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:white;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a></p><p style="color:#666;font-size:14px;">This link expires in 1 hour.</p><p style="color:#999;font-size:12px;">Or copy: ${resetUrl}</p></div>`,
        }),
      });
    } catch (e) {
      console.error('Email error:', e.message);
    }
  } else {
    console.log('RESET URL (no email service configured):', resetUrl);
  }

  return Response.json({ ok: true, message: 'If the email exists, a reset link has been sent.' });
}
