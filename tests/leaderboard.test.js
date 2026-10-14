import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  computeRankKey,
  fetchTopScores,
  fromFirestoreDocument,
  submitScore,
  toFirestoreFields,
} from '../src/online/leaderboard.js';

function installLocalStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
}

const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

describe('clé de classement', () => {
  it('une victoire passe avant toute défaite, puis plus de salles, puis meilleur temps', () => {
    const victoire = computeRankKey({ v: 1, l: 10, t: 900 });
    const defaiteLongue = computeRankKey({ v: 0, l: 80, t: 100 });
    const defaiteCourte = computeRankKey({ v: 0, l: 20, t: 100 });
    const defaiteRapide = computeRankKey({ v: 0, l: 20, t: 50 });
    expect(victoire).toBeLessThan(defaiteLongue);
    expect(defaiteLongue).toBeLessThan(defaiteCourte);
    expect(defaiteRapide).toBeLessThan(defaiteCourte);
  });

  it('correspond à la formule des règles Firestore', () => {
    expect(computeRankKey({ v: 1, l: 42, t: 61.5 })).toBe(61.5);
    expect(computeRankKey({ v: 0, l: 5, t: 60 })).toBe(1000000000 + (1000 - 5) * 100000 + 60);
  });
});

describe('conversion Firestore', () => {
  it('encode une entrée au format REST typé', () => {
    const f = toFirestoreFields({ n: 'Alec', l: 12, t: 77.25, v: 0 });
    expect(f.n).toEqual({ stringValue: 'Alec' });
    expect(f.l).toEqual({ integerValue: '12' });
    expect(f.t).toEqual({ doubleValue: 77.25 });
    expect(f.v).toEqual({ integerValue: '0' });
    expect(f.rankKey.doubleValue).toBe(computeRankKey({ v: 0, l: 12, t: 77.25 }));
  });

  it('tronque le nom à 20 caractères et borne les salles', () => {
    const f = toFirestoreFields({ n: 'x'.repeat(40), l: 999, t: 60, v: 0 });
    expect(f.n.stringValue).toHaveLength(20);
    expect(f.l.integerValue).toBe('100');
  });

  it('décode un document (entiers renvoyés en chaînes)', () => {
    const doc = {
      fields: {
        n: { stringValue: 'Zoé' },
        l: { integerValue: '33' },
        t: { doubleValue: 120.5 },
        v: { integerValue: '1' },
      },
    };
    expect(fromFirestoreDocument(doc)).toEqual({ n: 'Zoé', l: 33, t: 120.5, v: 1 });
  });
});

describe('réseau (fetch simulé)', () => {
  beforeEach(() => {
    installLocalStorage();
    vi.restoreAllMocks();
  });

  it("s'authentifie en anonyme puis écrit le score sous scores/<uid>", async () => {
    const calls = [];
    globalThis.fetch = vi.fn(async (url, opts) => {
      calls.push({ url, method: opts && opts.method });
      if (String(url).includes('accounts:signUp')) {
        return json({ localId: 'uid-1', idToken: 'tok', refreshToken: 'ref', expiresIn: '3600' });
      }
      return json({});
    });
    const res = await submitScore({ n: 'Alec', l: 12, t: 99.5, v: 0 });
    expect(res.ok).toBe(true);
    const write = calls.find((c) => c.method === 'PATCH');
    expect(write.url).toContain('/documents/scores/uid-1');
  });

  it("n'envoie pas un score qui n'améliore pas le précédent", async () => {
    globalThis.fetch = vi.fn(async (url) =>
      String(url).includes('accounts:signUp')
        ? json({ localId: 'uid-1', idToken: 'tok', refreshToken: 'ref', expiresIn: '3600' })
        : json({}),
    );
    expect((await submitScore({ n: 'A', l: 12, t: 90, v: 0 })).ok).toBe(true);
    const pire = await submitScore({ n: 'A', l: 12, t: 120, v: 0 });
    expect(pire).toEqual({ ok: false, reason: 'pas un record' });
  });

  it('ne lève jamais : un refus serveur ou une panne réseau renvoient { ok: false }', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('hors ligne');
    });
    const res = await submitScore({ n: 'A', l: 1, t: 60, v: 0 });
    expect(res.ok).toBe(false);
  });

  it('lit le classement trié et ignore la ligne vide de readTime', async () => {
    globalThis.fetch = vi.fn(async () =>
      json([
        {
          document: {
            fields: {
              n: { stringValue: 'A' },
              l: { integerValue: '9' },
              t: { doubleValue: 70 },
              v: { integerValue: '0' },
            },
          },
        },
        { readTime: '2026-01-01T00:00:00Z' },
      ]),
    );
    const top = await fetchTopScores(10);
    expect(top).toEqual([{ n: 'A', l: 9, t: 70, v: 0 }]);
    const sent = JSON.parse(globalThis.fetch.mock.calls[0][1].body);
    expect(sent.structuredQuery.orderBy[0].field.fieldPath).toBe('rankKey');
    expect(sent.structuredQuery.limit).toBe(10);
  });
});
