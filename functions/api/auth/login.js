import { verifyPassword, createJWT, setAuthCookie } from '../_auth.js';

export async function onRequestPost({ request, env }) {
  const { email, password } = await request.json().catch(() => ({}));

  if (!email || !password) return Response.json({ ok: false, error: 'Missing email or password' }, { status: 400 });

  const user = await env.DB.prepare('SELECT id, email, password_hash, plan FROM users WHERE email = ?')
    .bind(email.toLowerCase().trim()).first();

  if (!user) return Response.json({ ok: false, error: 'Invalid email or password' }, { status: 401 });

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return Response.json({ ok: false, error: 'Invalid email or password' }, { status: 401 });

  const token = await createJWT({ userId: user.id, email: user.email, plan: user.plan }, env.JWT_SECRET || 'vb-secret-change-me');

  return new Response(JSON.stringify({ ok: true, data: { userId: user.id, plan: user.plan } }), {
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': setAuthCookie(token) },
  });
}
