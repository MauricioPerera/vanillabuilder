import { verifyJWT, getCookie } from '../_auth.js';

export async function onRequestGet({ request, env }) {
  const token = getCookie(request, 'vb_token') || request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return Response.json({ ok: true, data: null });

  const claims = await verifyJWT(token, env.JWT_SECRET || 'vb-secret-change-me');
  if (!claims) return Response.json({ ok: true, data: null });

  return Response.json({ ok: true, data: { userId: claims.userId, email: claims.email, plan: claims.plan } });
}
