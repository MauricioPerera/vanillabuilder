import { PageBuilder } from './_builder.js';

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { actions, sessionId } = body;

  if (!Array.isArray(actions)) return Response.json({ ok: false, error: 'Missing "actions" array' }, { status: 400 });

  const sid = sessionId || 'default';

  // Load session from KV
  const stored = await env.SESSIONS.get(sid, 'json').catch(() => null);
  const builder = new PageBuilder(stored);

  // Execute all actions
  const results = [];
  for (const action of actions) {
    const result = builder.execute(action.method, action.params || {});
    results.push({ method: action.method, ...result });
  }

  // Save session to KV
  await env.SESSIONS.put(sid, JSON.stringify(builder.toJSON()), { expirationTtl: 3600 });

  return Response.json({ ok: true, sessionId: sid, results });
}
