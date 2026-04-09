/**
 * Session & changelog storage using Cloudflare KV
 *
 * Session: vb_session_{id} → { sections, cssRules, createdAt }
 * Changelog: vb_log_{id} → [ { source, action, summary, timestamp }, ... ]
 */

const PREFIX = 'vb_session_';
const LOG_PREFIX = 'vb_log_';
const TTL = 86400; // 24h

// ── Session CRUD ──

export async function loadSession(env, sessionId) {
  const raw = await env.SESSIONS.get(PREFIX + sessionId, 'json');
  return raw || null;
}

export async function saveSession(env, sessionId, data) {
  await env.SESSIONS.put(PREFIX + sessionId, JSON.stringify(data), { expirationTtl: TTL });
}

export async function sessionExists(env, sessionId) {
  const raw = await env.SESSIONS.get(PREFIX + sessionId);
  return raw !== null;
}

export async function createSession(env, sessionId) {
  await env.SESSIONS.put(PREFIX + sessionId, JSON.stringify({ sections: [], cssRules: [], createdAt: Date.now() }), { expirationTtl: TTL });
  // Init empty changelog
  await env.SESSIONS.put(LOG_PREFIX + sessionId, JSON.stringify([]), { expirationTtl: TTL });
}

export async function deleteSession(env, sessionId) {
  await env.SESSIONS.delete(PREFIX + sessionId);
  await env.SESSIONS.delete(LOG_PREFIX + sessionId);
}

// ── Changelog ──

export async function addLogEntry(env, sessionId, entry) {
  const raw = await env.SESSIONS.get(LOG_PREFIX + sessionId, 'json');
  const log = Array.isArray(raw) ? raw : [];
  log.push({
    ...entry,
    timestamp: Date.now(),
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
  });
  // Keep last 100 entries
  if (log.length > 100) log.splice(0, log.length - 100);
  await env.SESSIONS.put(LOG_PREFIX + sessionId, JSON.stringify(log), { expirationTtl: TTL });
}

export async function getChangelog(env, sessionId) {
  const raw = await env.SESSIONS.get(LOG_PREFIX + sessionId, 'json');
  return Array.isArray(raw) ? raw : [];
}
