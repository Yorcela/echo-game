// Classement mondial : Firestore + authentification anonyme, via l'API REST (aucun SDK embarqué).
// Une entrée par joueur (document `scores/<uid>`), mise à jour seulement si le score s'améliore.
// Les règles de sécurité côté serveur sont dans /firestore.rules.
import { FIREBASE_CONFIG } from '../config/firebase.js';

const AUTH_STORAGE_KEY = 'echo-auth';
const BEST_STORAGE_KEY = 'echo-online-best';
const REQUEST_TIMEOUT_MS = 8000;
const TOKEN_MARGIN_MS = 60_000;

/** Le classement mondial est-il configuré ? */
export function isOnlineEnabled() {
  return Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
}

/**
 * Clé de tri (plus petite = meilleur). Une victoire passe avant toute partie perdue ;
 * ensuite : plus de salles explorées, puis meilleur temps. Doit rester identique à firestore.rules.
 */
export function computeRankKey({ v, l, t }) {
  return (v ? 0 : 1_000_000_000 + (1000 - l) * 100_000) + t;
}

const documentsUrl = () =>
  `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

async function request(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function readCachedSession() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function writeCachedSession(session) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {}
}

/** Session anonyme valide : réutilise le jeton en cache, le rafraîchit ou en crée une nouvelle. */
async function getSession() {
  const cached = readCachedSession();
  if (cached && cached.idToken && cached.expiresAt > Date.now() + TOKEN_MARGIN_MS) return cached;
  const key = encodeURIComponent(FIREBASE_CONFIG.apiKey);
  if (cached && cached.refreshToken) {
    const res = await request(`https://securetoken.googleapis.com/v1/token?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(cached.refreshToken)}`,
    });
    if (res.ok) {
      const d = await res.json();
      const session = {
        uid: d.user_id,
        idToken: d.id_token,
        refreshToken: d.refresh_token,
        expiresAt: Date.now() + Number(d.expires_in) * 1000,
      };
      writeCachedSession(session);
      return session;
    }
  }
  const res = await request(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  if (!res.ok) throw new Error('authentification refusée (' + res.status + ')');
  const d = await res.json();
  const session = {
    uid: d.localId,
    idToken: d.idToken,
    refreshToken: d.refreshToken,
    expiresAt: Date.now() + Number(d.expiresIn) * 1000,
  };
  writeCachedSession(session);
  return session;
}

function readBestRankKey() {
  try {
    const v = Number(localStorage.getItem(BEST_STORAGE_KEY));
    return Number.isFinite(v) && v > 0 ? v : Infinity;
  } catch {
    return Infinity;
  }
}

/** Corps d'un document Firestore (format REST typé) pour une entrée de classement. */
export function toFirestoreFields(entry) {
  return {
    n: { stringValue: String(entry.n).slice(0, 20) },
    l: { integerValue: String(Math.max(0, Math.min(100, entry.l | 0))) },
    t: { doubleValue: Number(entry.t) },
    v: { integerValue: entry.v ? '1' : '0' },
    rankKey: { doubleValue: computeRankKey(entry) },
  };
}

/** Entrée de classement lue depuis un document Firestore REST. */
export function fromFirestoreDocument(doc) {
  const f = doc.fields || {};
  const num = (x) => Number(x && (x.doubleValue ?? x.integerValue));
  return {
    n: (f.n && f.n.stringValue) || '?',
    l: num(f.l) | 0,
    t: num(f.t),
    v: num(f.v) ? 1 : 0,
  };
}

/**
 * Envoie un score au classement mondial (meilleur score par joueur).
 * Renvoie { ok: boolean, reason?: string } ; ne lève jamais d'exception.
 */
export async function submitScore(entry) {
  if (!isOnlineEnabled()) return { ok: false, reason: 'désactivé' };
  const rankKey = computeRankKey(entry);
  if (rankKey >= readBestRankKey()) return { ok: false, reason: 'pas un record' };
  try {
    const session = await getSession();
    const res = await request(`${documentsUrl()}/scores/${session.uid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.idToken },
      body: JSON.stringify({ fields: toFirestoreFields(entry) }),
    });
    if (!res.ok) return { ok: false, reason: 'refusé (' + res.status + ')' };
    try {
      localStorage.setItem(BEST_STORAGE_KEY, String(rankKey));
    } catch {}
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err && err.name === 'AbortError' ? 'délai dépassé' : 'réseau' };
  }
}

/** Récupère les meilleurs scores ({n, l, t, v}[]), du meilleur au moins bon. */
export async function fetchTopScores(limit = 10) {
  if (!isOnlineEnabled()) throw new Error('désactivé');
  const key = encodeURIComponent(FIREBASE_CONFIG.apiKey);
  const res = await request(`${documentsUrl()}:runQuery?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'scores' }],
        orderBy: [{ field: { fieldPath: 'rankKey' }, direction: 'ASCENDING' }],
        limit,
      },
    }),
  });
  if (!res.ok) throw new Error('lecture refusée (' + res.status + ')');
  const rows = await res.json();
  return rows.filter((r) => r.document).map((r) => fromFirestoreDocument(r.document));
}

// ---- état partagé avec l'interface (le rendu ne fait jamais de requête lui-même)
export const worldBoard = { status: 'idle', entries: [], error: '' };

/** Recharge le classement mondial (ignoré s'il est déjà en cours de chargement). */
export async function refreshWorldBoard() {
  if (!isOnlineEnabled() || worldBoard.status === 'loading') return;
  worldBoard.status = 'loading';
  try {
    worldBoard.entries = await fetchTopScores(10);
    worldBoard.status = 'ok';
    worldBoard.error = '';
  } catch (err) {
    worldBoard.status = 'error';
    worldBoard.error = err && err.name === 'AbortError' ? 'délai dépassé' : 'indisponible';
  }
}
