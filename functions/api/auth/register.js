import { hashPassword, createJWT, setAuthCookie } from '../_auth.js';

export async function onRequestPost({ request, env }) {
  const { email, password } = await request.json().catch(() => ({}));

  if (!email || !password) return Response.json({ ok: false, error: 'Missing email or password' }, { status: 400 });
  if (password.length < 6) return Response.json({ ok: false, error: 'Password must be at least 6 characters' }, { status: 400 });

  // Check if email exists
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase().trim()).first();
  if (existing) return Response.json({ ok: false, error: 'Email already registered' }, { status: 409 });

  // Create user
  const passwordHash = await hashPassword(password);
  const result = await env.DB.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id, plan')
    .bind(email.toLowerCase().trim(), passwordHash).first();

  // Create JWT
  const token = await createJWT({ userId: result.id, email: email.toLowerCase().trim(), plan: result.plan }, env.JWT_SECRET || 'vb-secret-change-me');

  return new Response(JSON.stringify({ ok: true, data: { userId: result.id, plan: result.plan } }), {
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': setAuthCookie(token) },
  });
}
