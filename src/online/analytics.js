// Mesure d'audience : Google Analytics 4 (flux de données Firebase « Echo (web) »), avec consentement.
// Aucun script Google ni cookie n'est chargé avant que le joueur ait cliqué sur « Accepter ».
// Le choix est mémorisé dans localStorage (`echo-consent`) et modifiable via le lien « Cookies ».
import { FIREBASE_CONFIG } from '../config/firebase.js';

const CONSENT_KEY = 'echo-consent';
const GTAG_URL = 'https://www.googletagmanager.com/gtag/js?id=';

let loaded = false;
let probe = null; // () => ({ mode, room, runTime, echoes }) fourni par le jeu pour l'événement de sortie
let exitSent = false;

/** Développement local ou fichier ouvert hors ligne : pas de mesure (sauf interrupteur de test). */
function isLocalEnvironment() {
  if (typeof location === 'undefined') return false;
  const local =
    ['localhost', '127.0.0.1', '[::1]', ''].includes(location.hostname) || location.protocol === 'file:';
  if (!local) return false;
  try {
    return localStorage.getItem('echo-analytics-dev') !== '1';
  } catch {
    return true;
  }
}

export const isAnalyticsConfigured = () => Boolean(FIREBASE_CONFIG.measurementId) && !isLocalEnvironment();

/** Choix enregistré : 'granted', 'denied' ou null (pas encore répondu). */
export function getConsent() {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

function storeConsent(value) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {}
}

function loadGtag() {
  if (loaded || !isAnalyticsConfigured() || typeof document === 'undefined') return;
  loaded = true;
  const id = FIREBASE_CONFIG.measurementId;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag('js', new Date());
  // pas de signaux publicitaires ni de personnalisation : mesure d'audience uniquement
  window.gtag('config', id, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const el = document.createElement('script');
  el.async = true;
  el.src = GTAG_URL + encodeURIComponent(id);
  document.head.appendChild(el);
}

/** Envoie un événement (ignoré sans consentement). */
export function trackEvent(name, params = {}) {
  if (!loaded || typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', name, params);
  } catch {}
}

/** Fournit au module un instantané de l'état du jeu, lu à la fermeture de la page. */
export function setSessionProbe(fn) {
  probe = fn;
}

function sendExit() {
  if (exitSent || !loaded || !probe) return;
  exitSent = true;
  try {
    const s = probe();
    window.gtag('event', 'game_exit', {
      last_mode: s.mode,
      room: s.room,
      run_time_s: Math.round(s.runTime || 0),
      echoes: s.echoes,
      transport_type: 'beacon',
    });
  } catch {}
}

/** Applique le choix de l'utilisateur et met à jour l'interface. */
export function setConsent(value) {
  storeConsent(value);
  hideBanner();
  if (value === 'granted') {
    loadGtag();
    trackEvent('consent_granted');
  } else if (loaded && typeof window.gtag === 'function') {
    // retrait du consentement : GA cesse d'écrire des cookies pour cette session
    window.gtag('consent', 'update', { analytics_storage: 'denied' });
    loaded = false;
  }
}

// ---- bandeau de consentement (HTML simple, hors canvas)
const BANNER_ID = 'echo-consent-banner';
const LINK_ID = 'echo-consent-link';

function hideBanner() {
  const b = typeof document !== 'undefined' && document.getElementById(BANNER_ID);
  if (b) b.remove();
}

function showBanner() {
  if (typeof document === 'undefined' || document.getElementById(BANNER_ID)) return;
  const bar = document.createElement('div');
  bar.id = BANNER_ID;
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-label', 'Mesure d’audience');
  bar.style.cssText =
    'position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:9999;max-width:min(560px,92vw);' +
    'background:#1B1612;color:#F6EBCB;border:3px solid #E2A93B;border-radius:12px;padding:12px 14px;' +
    'font:700 14px/1.35 Nunito,system-ui,sans-serif;box-shadow:0 6px 0 rgba(0,0,0,.5);text-align:left';
  const text = document.createElement('div');
  text.textContent =
    'Echo mesure son audience avec Google Analytics (visites, pays, parties jouées, sorties) pour s’améliorer. ' +
    'Aucune publicité. Tu peux refuser : le jeu fonctionne pareil.';
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:10px;margin-top:10px;justify-content:flex-end';
  const mk = (label, value, primary) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.cssText =
      'cursor:pointer;border-radius:8px;padding:6px 14px;font:800 14px Nunito,system-ui,sans-serif;' +
      (primary
        ? 'background:#F0A64B;color:#1B1612;border:2px solid #8A5419'
        : 'background:transparent;color:#F6EBCB;border:2px solid #F6EBCB');
    b.addEventListener('click', () => setConsent(value));
    return b;
  };
  row.append(mk('Refuser', 'denied', false), mk('Accepter', 'granted', true));
  bar.append(text, row);
  document.body.appendChild(bar);
}

function addReopenLink() {
  if (typeof document === 'undefined' || document.getElementById(LINK_ID)) return;
  const a = document.createElement('button');
  a.id = LINK_ID;
  a.type = 'button';
  a.textContent = 'Cookies';
  a.style.cssText =
    'position:fixed;left:8px;bottom:6px;z-index:9998;background:none;border:0;color:#F6EBCB;opacity:.45;' +
    'font:700 11px Nunito,system-ui,sans-serif;cursor:pointer;text-decoration:underline';
  a.addEventListener('click', showBanner);
  document.body.appendChild(a);
}

/** À appeler au démarrage : charge GA si déjà accepté, sinon affiche le bandeau. */
export function initAnalytics() {
  if (!isAnalyticsConfigured() || typeof document === 'undefined') return;
  addReopenLink();
  const consent = getConsent();
  if (consent === 'granted') loadGtag();
  else if (consent === null) showBanner();
  // fermeture / changement d'onglet : on note où le joueur s'est arrêté
  window.addEventListener('pagehide', sendExit);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendExit();
    else exitSent = false;
  });
}
