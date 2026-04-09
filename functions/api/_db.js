/**
 * Session storage using Cloudflare KV
 *
 * Each session stores: { sections, cssRules, createdAt }
 * A session must be created first via /api/session before it can be used.
 */

const PREFIX = 'vb_session_';

export async function loadSession(env, sessionId) {
  const raw = await env.SESSIONS.get(PREFIX + sessionId, 'json');
  return raw || null;
}

export async function saveSession(env, sessionId, data) {
  await env.SESSIONS.put(PREFIX + sessionId, JSON.stringify(data), { expirationTtl: 86400 });
}

export async function sessionExists(env, sessionId) {
  const raw = await env.SESSIONS.get(PREFIX + sessionId);
  return raw !== null;
}

export async function createSession(env, sessionId) {
  await env.SESSIONS.put(PREFIX + sessionId, JSON.stringify({ sections: [], cssRules: [], createdAt: Date.now() }), { expirationTtl: 86400 });
}

export async function deleteSession(env, sessionId) {
  await env.SESSIONS.delete(PREFIX + sessionId);
}
