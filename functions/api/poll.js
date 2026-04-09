import { loadSession, sessionExists, getVersion } from './_db.js';
import { PageBuilder } from './_builder.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const sid = url.searchParams.get('sessionId');
  const clientVersion = url.searchParams.get('v') || '0';

  if (!sid) return Response.json({ ok: false, error: 'Missing "sessionId"' }, { status: 400 });

  const exists = await sessionExists(env, sid);
  if (!exists) return Response.json({ ok: true, data: { html: '', sectionCount: 0, version: '0', changed: false } });

  // Cheap check: only read version (tiny KV read)
  const serverVersion = await getVersion(env, sid);

  // If client already has this version, skip the heavy read
  if (clientVersion === serverVersion) {
    return Response.json({ ok: true, data: { changed: false, version: serverVersion } });
  }

  // Version changed — read full session (1 more KV read)
  const stored = await loadSession(env, sid);
  if (!stored) return Response.json({ ok: true, data: { html: '', sectionCount: 0, version: serverVersion, changed: true } });

  const builder = new PageBuilder(stored);
  const { data: html } = builder.getHTML();
  const { data: info } = builder.getPageInfo();

  return Response.json({ ok: true, data: { html, ...info, version: serverVersion, changed: true } });
}
