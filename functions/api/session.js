import { sessionExists, createSession, deleteSession } from './_db.js';

// POST /api/session — create a new session
export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { sessionId } = body;

  if (!sessionId) return Response.json({ ok: false, error: 'Missing "sessionId"' }, { status: 400 });

  await createSession(env, sessionId);
  return Response.json({ ok: true, sessionId });
}

// DELETE /api/session — delete a session
export async function onRequestDelete({ request, env }) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) return Response.json({ ok: false, error: 'Missing "sessionId"' }, { status: 400 });

  await deleteSession(env, sessionId);
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
