import { PageBuilder } from './_builder.js';

const sessions = new Map();

export async function onRequestPost({ request }) {
  const body = await request.json().catch(() => ({}));
  const { actions, sessionId } = body;

  if (!Array.isArray(actions)) {
    return Response.json({ ok: false, error: 'Missing "actions" array' }, { status: 400 });
  }

  const sid = sessionId || 'default';
  if (!sessions.has(sid)) sessions.set(sid, new PageBuilder());
  const builder = sessions.get(sid);

  const results = [];
  for (const action of actions) {
    const result = builder.execute(action.method, action.params || {});
    results.push({ method: action.method, ...result });
  }

  return Response.json({ ok: true, sessionId: sid, results });
}
