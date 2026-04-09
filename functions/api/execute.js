import { PageBuilder } from './_builder.js';

const sessions = new Map();

export async function onRequestPost({ request }) {
  const body = await request.json().catch(() => ({}));
  const { method, params, sessionId } = body;

  if (!method) {
    return Response.json({ ok: false, error: 'Missing "method"' }, { status: 400 });
  }

  const sid = sessionId || 'default';
  if (!sessions.has(sid)) sessions.set(sid, new PageBuilder());
  const builder = sessions.get(sid);

  const result = builder.execute(method, params || {});
  return Response.json({ ...result, sessionId: sid });
}
