import { verifyJWT, getCookie } from './_auth.js';

// Routes that don't require auth
const PUBLIC_ROUTES = [
  '/api/health',
  '/api/schemas',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/auth/forgot',
  '/api/auth/reset',
  '/api/auth/plan',
  '/api/billing/webhook',
];

export async function onRequest(context) {
  const { request, env, data } = context;
  const url = new URL(request.url);

  // Allow public routes
  if (PUBLIC_ROUTES.includes(url.pathname)) {
    data.userId = null;
    data.plan = 'free';
    return context.next();
  }

  // Get token from cookie or Authorization header
  const token = getCookie(request, 'vb_token') || request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    // Allow anonymous access for backward compatibility (Phase 1)
    data.userId = null;
    data.plan = 'free';
    return context.next();
  }

  const claims = await verifyJWT(token, env.JWT_SECRET || 'vb-secret-change-me');

  if (!claims) {
    // Invalid/expired token — still allow anonymous for now
    data.userId = null;
    data.plan = 'free';
    return context.next();
  }

  // Authenticated
  data.userId = claims.userId;
  data.email = claims.email;
  data.plan = claims.plan || 'free';

  return context.next();
}
