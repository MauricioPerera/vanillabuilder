import { getChangelog, sessionExists } from './_db.js';

/**
 * GET /api/changelog?sessionId=xxx — Returns the change history
 */
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) return Response.json({ ok: false, error: 'Missing "sessionId"' }, { status: 400 });

  const exists = await sessionExists(env, sessionId);
  if (!exists) return Response.json({ ok: false, error: 'Session not found' }, { status: 403 });

  const log = await getChangelog(env, sessionId);
  return Response.json({ ok: true, data: log });
}
