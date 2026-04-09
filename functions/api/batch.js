import { loadSession, saveSession, sessionExists, addLogEntry } from './_db.js';
import { PageBuilder } from './_builder.js';

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { actions, sessionId, source } = body;

  if (!Array.isArray(actions)) return Response.json({ ok: false, error: 'Missing "actions" array' }, { status: 400 });
  if (!sessionId) return Response.json({ ok: false, error: 'Missing "sessionId"' }, { status: 400 });

  const exists = await sessionExists(env, sessionId);
  if (!exists) return Response.json({ ok: false, error: 'Session not found. Create one first via POST /api/session' }, { status: 403 });

  const stored = await loadSession(env, sessionId);
  const builder = new PageBuilder(stored);

  const results = [];
  const changes = [];
  for (const action of actions) {
    const result = builder.execute(action.method, action.params || {});
    results.push({ method: action.method, ...result });
    if (!['getHTML', 'getCSS', 'getFullPage', 'getPageInfo', 'getAvailableSections'].includes(action.method)) {
      changes.push(action.method + (action.params?.type ? `:${action.params.type}` : ''));
    }
  }

  await saveSession(env, sessionId, builder.toJSON());

  if (changes.length > 0) {
    await addLogEntry(env, sessionId, {
      source: source || 'api',
      action: 'batch',
      summary: changes.join(', '),
    });
  }

  return Response.json({ ok: true, sessionId, results });
}
