/**
 * Session & changelog storage using js-doc-store + Cloudflare KV
 *
 * Collections:
 *   sessions  → { sessionId, data: { sections, cssRules, theme, ... }, createdAt }
 *   changelog → { sessionId, source, action, summary, timestamp }
 *
 * Versioning: vb_ver_{id} → timestamp (cheap poll check)
 *
 * Preload files:
 *   sessions.docs.json, sessions.meta.json
 *   changelog.docs.json, changelog.meta.json
 */

import { DocStore, CloudflareKVAdapter } from './js-doc-store.js';

const VER_PREFIX = 'vb_ver_';
const TTL = 86400;

const PRELOAD_FILES = [
  'sessions.docs.json', 'sessions.meta.json',
  'changelog.docs.json', 'changelog.meta.json',
];

// ── Get DB instance (call once per request) ──

export async function getDB(env) {
  const adapter = new CloudflareKVAdapter(env.SESSIONS, 'vb_');
  await adapter.preload(PRELOAD_FILES);
  const db = new DocStore(adapter);

  // Create index on sessionId for fast lookups
  const sessions = db.collection('sessions');
  try { sessions.createIndex('sessionId', { unique: true }); } catch {}

  const changelog = db.collection('changelog');
  try { changelog.createIndex('sessionId'); } catch {}

  return { db, adapter, sessions, changelog };
}

export async function flushDB(db, adapter) {
  db.flush();
  await adapter.persist();
}

// ── Session CRUD ──

export async function loadSession(env, sessionId) {
  const { sessions } = await getDB(env);
  const doc = sessions.findOne({ sessionId });
  return doc?.data || null;
}

export async function saveSession(env, sessionId, data) {
  const { db, adapter, sessions } = await getDB(env);
  const existing = sessions.findOne({ sessionId });
  if (existing) {
    sessions.update({ sessionId }, { $set: { data, updatedAt: Date.now() } });
  } else {
    sessions.insert({ sessionId, data, createdAt: Date.now(), updatedAt: Date.now() });
  }
  await flushDB(db, adapter);

  // Update version
  const ver = String(Date.now());
  await env.SESSIONS.put(VER_PREFIX + sessionId, ver, { expirationTtl: TTL });
  return ver;
}

export async function sessionExists(env, sessionId) {
  // Use version key as source of truth (faster and survives KV eventual consistency)
  const ver = await env.SESSIONS.get(VER_PREFIX + sessionId);
  return ver !== null;
}

export async function createSession(env, sessionId) {
  const { db, adapter, sessions } = await getDB(env);
  const existing = sessions.findOne({ sessionId });
  if (!existing) {
    sessions.insert({ sessionId, data: { sections: [], cssRules: [] }, createdAt: Date.now(), updatedAt: Date.now() });
  }
  await flushDB(db, adapter);
  await env.SESSIONS.put(VER_PREFIX + sessionId, '0', { expirationTtl: TTL });
}

export async function deleteSession(env, sessionId) {
  const { db, adapter, sessions, changelog } = await getDB(env);

  // Remove session
  const docs = sessions.find({ sessionId }).toArray();
  for (const doc of docs) sessions.remove(doc._id);

  // Remove changelog entries
  const logs = changelog.find({ sessionId }).toArray();
  for (const log of logs) changelog.remove(log._id);

  await flushDB(db, adapter);
  await env.SESSIONS.delete(VER_PREFIX + sessionId);
}

// ── Version ──

export async function getVersion(env, sessionId) {
  const raw = await env.SESSIONS.get(VER_PREFIX + sessionId);
  return raw || '0';
}

// ── Changelog ──

export async function addLogEntry(env, sessionId, entry) {
  const { db, adapter, changelog } = await getDB(env);
  changelog.insert({
    sessionId,
    ...entry,
    timestamp: Date.now(),
  });

  // Keep max 100 per session
  const all = changelog.find({ sessionId }).sort({ timestamp: -1 }).toArray();
  if (all.length > 100) {
    for (const old of all.slice(100)) changelog.remove(old._id);
  }

  await flushDB(db, adapter);
}

export async function getChangelog(env, sessionId) {
  const { changelog } = await getDB(env);
  return changelog.find({ sessionId }).sort({ timestamp: 1 }).toArray().map(doc => ({
    source: doc.source,
    action: doc.action,
    summary: doc.summary,
    timestamp: doc.timestamp,
  }));
}
