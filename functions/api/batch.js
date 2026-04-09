import { loadSession, saveSession, sessionExists } from './_db.js';
import { PageBuilder } from './_builder.js';

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { actions, sessionId } = body;

  if (!Array.isArray(actions)) return Response.json({ ok: false, error: 'Missing "actions" array' }, { status: 400 });
  if (!sessionId) return Response.json({ ok: false, error: 'Missing "sessionId"' }, { status: 400 });

  const exists = await sessionExists(env, sessionId);
  if (!exists) return Response.json({ ok: false, error: 'Session not found. Create one first via POST /api/session' }, { status: 403 });

  const stored = await loadSession(env, sessionId);
  const builder = new PageBuilder(stored);

  const results = [];
  for (const action of actions) {
    results.push({ method: action.method, ...builder.execute(action.method, action.params || {}) });
  }

  await saveSession(env, sessionId, builder.toJSON());

  return Response.json({ ok: true, sessionId, results });
}
