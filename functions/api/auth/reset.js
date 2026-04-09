import { hashPassword, createJWT, setAuthCookie } from '../_auth.js';

/**
 * POST /api/auth/reset — Reset password with token
 */
export async function onRequestPost({ request, env }) {
  const { token, password } = await request.json().catch(() => ({}));

  if (!token || !password) return Response.json({ ok: false, error: 'Missing token or password' }, { status: 400 });
  if (password.length < 6) return Response.json({ ok: false, error: 'Password must be at least 6 characters' }, { status: 400 });

  // Verify token
  const raw = await env.SESSIONS.get('vb_reset_' + token, 'json');
  if (!raw) return Response.json({ ok: false, error: 'Invalid or expired reset link' }, { status: 400 });

  // Update password
  const passwordHash = await hashPassword(password);
  await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(passwordHash, raw.userId).run();

  // Delete token (one-time use)
  await env.SESSIONS.delete('vb_reset_' + token);

  // Auto-login
  const user = await env.DB.prepare('SELECT id, email, plan FROM users WHERE id = ?').bind(raw.userId).first();
  const jwt = await createJWT({ userId: user.id, email: user.email, plan: user.plan }, env.JWT_SECRET || 'vb-secret-change-me');

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': setAuthCookie(jwt) },
  });
}
