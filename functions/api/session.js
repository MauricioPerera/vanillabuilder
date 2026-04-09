import { sessionExists, createSession, deleteSession } from './_db.js';

const PLAN_LIMITS = { free: 3, pro: -1 }; // -1 = unlimited

// POST /api/session — create a new session
export async function onRequestPost({ request, env, data }) {
  const body = await request.json().catch(() => ({}));
  const { sessionId } = body;
  if (!sessionId) return Response.json({ ok: false, error: 'Missing "sessionId"' }, { status: 400 });

  const userId = data.userId;
  const plan = data.plan || 'free';

  // Check plan limits if authenticated
  if (userId) {
    const limit = PLAN_LIMITS[plan] ?? 3;
    if (limit > 0) {
      const { count } = await env.DB.prepare('SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ?').bind(userId).first();
      if (count >= limit) {
        return Response.json({ ok: false, error: `Plan limit reached (${limit} pages). Upgrade to Pro for unlimited.` }, { status: 403 });
      }
    }
  }

  // Create session in KV
  await createSession(env, sessionId);

  // Record ownership in D1 if authenticated
  if (userId) {
    await env.DB.prepare('INSERT OR IGNORE INTO user_sessions (session_id, user_id) VALUES (?, ?)').bind(sessionId, userId).run();
  }

  return Response.json({ ok: true, sessionId });
}

// DELETE /api/session — delete a session
export async function onRequestDelete({ request, env, data }) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');
  if (!sessionId) return Response.json({ ok: false, error: 'Missing "sessionId"' }, { status: 400 });

  // Check ownership if authenticated
  if (data.userId) {
    const owner = await env.DB.prepare('SELECT user_id FROM user_sessions WHERE session_id = ?').bind(sessionId).first();
    if (owner && owner.user_id !== data.userId) {
      return Response.json({ ok: false, error: 'Not your session' }, { status: 403 });
    }
  }

  await deleteSession(env, sessionId);
  await env.DB.prepare('DELETE FROM user_sessions WHERE session_id = ?').bind(sessionId).run();
  return Response.json({ ok: true });
}

// GET /api/session — check if session exists
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');
  if (!sessionId) return Response.json({ ok: false, error: 'Missing "sessionId"' }, { status: 400 });

  const exists = await sessionExists(env, sessionId);
  return Response.json({ ok: true, exists });
}
