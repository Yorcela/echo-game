import { describe, it, expect, beforeEach, vi } from 'vitest';

function setupBrowser({ hostname = 'yorcela.github.io', consent = null } = {}) {
  const store = new Map(consent ? [['echo-consent', consent]] : []);
  const appended = [];
  const byId = new Map();
  const el = (tag) => ({
    tag,
    style: {},
    children: [],
    setAttribute() {},
    addEventListener(type, fn) {
      (this.listeners ||= {})[type] = fn;
    },
    append(...c) {
      this.children.push(...c);
    },
    appendChild(c) {
      this.children.push(c);
      if (c.id) byId.set(c.id, c);
      appended.push(c);
    },
    remove() {
      if (this.id) byId.delete(this.id);
    },
  });
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  globalThis.location = { hostname, protocol: 'https:' };
  globalThis.document = {
    body: el('body'),
    head: el('head'),
    visibilityState: 'visible',
    createElement: el,
    getElementById: (id) => byId.get(id) || null,
    addEventListener() {},
  };
  globalThis.window = { addEventListener() {}, dataLayer: undefined };
  return { store, appended, byId };
}

describe('analytics (consentement)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("n'affiche le bandeau et ne charge aucun script avant la réponse", async () => {
    const env = setupBrowser();
    const m = await import('../src/online/analytics.js');
    m.initAnalytics();
    expect(env.byId.has('echo-consent-banner')).toBe(true);
    expect(env.appended.some((n) => n.src && n.src.includes('googletagmanager'))).toBe(false);
    m.trackEvent('game_start'); // sans consentement : ignoré, ne lève pas
    expect(globalThis.window.dataLayer).toBeUndefined();
  });

  it('charge gtag.js uniquement après « Accepter » et mémorise le choix', async () => {
    const env = setupBrowser();
    const m = await import('../src/online/analytics.js');
    m.initAnalytics();
    m.setConsent('granted');
    expect(env.store.get('echo-consent')).toBe('granted');
    expect(env.appended.some((n) => n.src && n.src.includes('googletagmanager.com/gtag/js?id=G-'))).toBe(
      true,
    );
    m.trackEvent('boss_defeated', { boss: '3' });
    const events = globalThis.window.dataLayer.map((a) => a[0] + ':' + a[1]);
    expect(events).toContain('event:boss_defeated');
    // les signaux publicitaires restent désactivés
    const cfg = globalThis.window.dataLayer.find((a) => a[0] === 'config');
    expect(cfg[2].allow_google_signals).toBe(false);
  });

  it('« Refuser » ne charge rien', async () => {
    const env = setupBrowser();
    const m = await import('../src/online/analytics.js');
    m.initAnalytics();
    m.setConsent('denied');
    expect(env.store.get('echo-consent')).toBe('denied');
    expect(env.appended.some((n) => n.src)).toBe(false);
  });

  it('un consentement déjà donné recharge gtag.js sans bandeau', async () => {
    const env = setupBrowser({ consent: 'granted' });
    const m = await import('../src/online/analytics.js');
    m.initAnalytics();
    expect(env.byId.has('echo-consent-banner')).toBe(false);
    expect(env.appended.some((n) => n.src && n.src.includes('googletagmanager'))).toBe(true);
  });

  it('est désactivé en local (localhost) : ni bandeau ni script', async () => {
    const env = setupBrowser({ hostname: 'localhost', consent: 'granted' });
    const m = await import('../src/online/analytics.js');
    m.initAnalytics();
    expect(env.byId.size).toBe(0);
    expect(env.appended.length).toBe(0);
  });
});
