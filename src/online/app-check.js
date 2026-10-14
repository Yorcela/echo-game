// Firebase App Check (reCAPTCHA Enterprise) via l'API REST, sans SDK.
// Prouve à Firebase que les requêtes viennent bien du jeu hébergé sur un domaine autorisé :
// le jeton est envoyé dans l'en-tête `X-Firebase-AppCheck` des appels Firestore et Authentication.
// Le script reCAPTCHA n'est chargé qu'au premier appel réseau du classement mondial.
import { FIREBASE_CONFIG } from '../config/firebase.js';

const RECAPTCHA_SCRIPT = 'https://www.google.com/recaptcha/enterprise.js?render=';
const LOAD_TIMEOUT_MS = 6000;
const TOKEN_MARGIN_MS = 60_000;

let scriptPromise = null;
let cached = null; // { token, expiresAt }
let pending = null;

/** App Check est-il configuré (clé de site reCAPTCHA + identifiant d'application) ? */
export function isAppCheckEnabled() {
  return Boolean(FIREBASE_CONFIG.recaptchaSiteKey && FIREBASE_CONFIG.appId && FIREBASE_CONFIG.apiKey);
}

function loadRecaptcha() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return reject(new Error('pas de navigateur'));
    if (window.grecaptcha && window.grecaptcha.enterprise) return resolve(window.grecaptcha.enterprise);
    const el = document.createElement('script');
    const timer = setTimeout(() => reject(new Error('reCAPTCHA : délai dépassé')), LOAD_TIMEOUT_MS);
    el.src = RECAPTCHA_SCRIPT + encodeURIComponent(FIREBASE_CONFIG.recaptchaSiteKey);
    el.async = true;
    el.onload = () => {
      clearTimeout(timer);
      const enterprise = window.grecaptcha && window.grecaptcha.enterprise;
      if (enterprise) enterprise.ready(() => resolve(enterprise));
      else reject(new Error('reCAPTCHA indisponible'));
    };
    el.onerror = () => {
      clearTimeout(timer);
      reject(new Error('reCAPTCHA bloqué'));
    };
    document.head.appendChild(el);
  });
  // en cas d'échec on pourra réessayer plus tard
  scriptPromise.catch(() => {
    scriptPromise = null;
  });
  return scriptPromise;
}

async function fetchToken() {
  const enterprise = await loadRecaptcha();
  const recaptchaToken = await enterprise.execute(FIREBASE_CONFIG.recaptchaSiteKey, { action: 'echo_api' });
  const url =
    `https://firebaseappcheck.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}` +
    `/apps/${encodeURIComponent(FIREBASE_CONFIG.appId)}:exchangeRecaptchaEnterpriseToken` +
    `?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recaptcha_enterprise_token: recaptchaToken }),
  });
  if (!res.ok) throw new Error('App Check refusé (' + res.status + ')');
  const d = await res.json();
  const ttlSeconds = parseFloat(String(d.ttl || '3600s'));
  return { token: d.token, expiresAt: Date.now() + ttlSeconds * 1000 };
}

/**
 * Jeton App Check valide, ou `null` si indisponible (script bloqué, hors ligne…).
 * Ne lève jamais : sans jeton, la requête part simplement sans l'en-tête.
 */
export async function getAppCheckToken() {
  if (!isAppCheckEnabled()) return null;
  if (cached && cached.expiresAt > Date.now() + TOKEN_MARGIN_MS) return cached.token;
  if (!pending) {
    pending = fetchToken()
      .then((t) => {
        cached = t;
        return t.token;
      })
      .catch(() => null)
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}
