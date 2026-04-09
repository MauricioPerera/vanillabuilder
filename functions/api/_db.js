/**
 * Session & changelog storage using Cloudflare KV
 *
 * Optimized with versioning:
 *   vb_session_{id} → { sections, cssRules, theme, ... }  (heavy, read only when needed)
 *   vb_ver_{id}     → number                               (tiny, read on every poll)
 *   vb_log_{id}     → [ entries... ]                        (changelog)
 *
 * Poll reads only the version (1 cheap KV read).
 * If version changed, reads the full session (1 more read).
 * If version same, returns cached/empty — 0 extra reads.
 */

const PREFIX = 'vb_session_';
const VER_PREFIX = 'vb_ver_';
const LOG_PREFIX = 'vb_log_';
const TTL = 86400; // 24h

// ── Session CRUD ──

export async function loadSession(env, sessionId) {
  const raw = await env.SESSIONS.get(PREFIX + sessionId, 'json');
  return raw || null;
}

export async function saveSession(env, sessionId, data) {
  // Increment version on every save
  const ver = Date.now();
  await Promise.all([
    env.SESSIONS.put(PREFIX + sessionId, JSON.stringify(data), { expirationTtl: TTL }),
    env.SESSIONS.put(VER_PREFIX + sessionId, String(ver), { expirationTtl: TTL }),
  ]);
  return ver;
}

export async function sessionExists(env, sessionId) {
  const raw = await env.SESSIONS.get(PREFIX + sessionId);
  return raw !== null;
}

export async function createSession(env, sessionId) {
  await Promise.all([
    env.SESSIONS.put(PREFIX + sessionId, JSON.stringify({ sections: [], cssRules: [], createdAt: Date.now() }), { expirationTtl: TTL }),
    env.SESSIONS.put(VER_PREFIX + sessionId, '0', { expirationTtl: TTL }),
    env.SESSIONS.put(LOG_PREFIX + sessionId, JSON.stringify([]), { expirationTtl: TTL }),
  ]);
}

export async function deleteSession(env, sessionId) {
  await Promise.all([
    env.SESSIONS.delete(PREFIX + sessionId),
    env.SESSIONS.delete(VER_PREFIX + sessionId),
    env.SESSIONS.delete(LOG_PREFIX + sessionId),
  ]);
}

// ── Version (cheap check for poll) ──

export async function getVersion(env, sessionId) {
  const raw = await env.SESSIONS.get(VER_PREFIX + sessionId);
  return raw || '0';
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
  if (log.length > 100) log.splice(0, log.length - 100);
  await env.SESSIONS.put(LOG_PREFIX + sessionId, JSON.stringify(log), { expirationTtl: TTL });
}

export async function getChangelog(env, sessionId) {
  const raw = await env.SESSIONS.get(LOG_PREFIX + sessionId, 'json');
  return Array.isArray(raw) ? raw : [];
}
