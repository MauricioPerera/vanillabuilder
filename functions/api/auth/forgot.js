/**
 * POST /api/auth/forgot — Request password reset
 * Generates a reset token, stores in KV with 1h TTL.
 * When email service is configured, sends the link.
 * For now, returns the token in the response (dev mode).
 */
export async function onRequestPost({ request, env }) {
  const { email } = await request.json().catch(() => ({}));
  if (!email) return Response.json({ ok: false, error: 'Missing email' }, { status: 400 });

  const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase().trim()).first();
  // Always return ok (don't leak if email exists)
  if (!user) return Response.json({ ok: true, message: 'If the email exists, a reset link has been sent.' });

  // Generate reset token
  const token = crypto.randomUUID();
  await env.SESSIONS.put('vb_reset_' + token, JSON.stringify({ userId: user.id, email: email.toLowerCase().trim() }), { expirationTtl: 3600 });

  const origin = new URL(request.url).origin;
  const resetUrl = `${origin}/reset.html?token=${token}`;

  // Try to send email if configured
  if (env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: env.EMAIL_FROM || 'noreply@automators.work',
          to: email.toLowerCase().trim(),
          subject: 'VanillaBuilder — Password Reset',
          html: `<p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
        }),
      });
    } catch (e) {
      console.error('Email send failed:', e.message);
    }
  } else {
    // Dev mode: log the reset URL
    console.log('Reset URL (no email service):', resetUrl);
  }

  return Response.json({ ok: true, message: 'If the email exists, a reset link has been sent.' });
}
