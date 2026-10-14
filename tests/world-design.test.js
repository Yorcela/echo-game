// Garde-fous de level design : ordre des pouvoirs, verrous, densité de mécanismes, franchissabilité des salles libres.
import { describe, it, expect, beforeAll } from 'vitest';
import { installStubs, seedRandom } from './helpers/dom-stub.js';

const SEEDS = [11, 222, 3333, 4444, 5555, 6666, 7777, 8888];

// ---- modèle de déplacement volontairement simple : marche, chute, saut de 3 cases en hauteur / 4 en largeur
const SOLID = (ch, doorsOpen) =>
  ch === '#' ||
  ch === '%' ||
  ch === '&' ||
  ch === '~' ||
  (ch >= 'A' && ch <= 'Z' && ch !== 'E' && ch !== 'P' && !doorsOpen.has(ch));
const PASSABLE = (rows, c, r, open) => r >= 0 && r < 17 && c >= 0 && c < 30 && !SOLID(rows[r][c], open);
const STANDABLE = (rows, c, r, open) =>
  r >= 1 && r <= 13 && PASSABLE(rows, c, r, open) && rows[r][c] !== '^' && SOLID(rows[r + 1][c], open);

function reachableCells(rows, start, open) {
  const key = (c, r) => r * 30 + c;
  const seen = new Set([key(...start)]);
  const queue = [start];
  const push = (c, r) => {
    if (c < 0 || c > 29 || !STANDABLE(rows, c, r, open) || seen.has(key(c, r))) return;
    seen.add(key(c, r));
    queue.push([c, r]);
  };
  const landDown = (c, r) => {
    for (let rr = r; rr <= 13; rr++) {
      if (!PASSABLE(rows, c, rr, open)) return;
      if (STANDABLE(rows, c, rr, open)) return push(c, rr);
      if (rows[rr][c] === '^') return;
    }
  };
  while (queue.length) {
    const [c, r] = queue.shift();
    for (const dc of [-1, 1]) {
      if (PASSABLE(rows, c + dc, r, open)) landDown(c + dc, r);
      for (let dx = 2; dx <= 5; dx++) {
        const tc = c + dc * dx;
        for (let up = 0; up <= 3; up++) {
          // portée du saut : 5 cases à plat, 4 en montée de 1 à 2 cases, 3 en montée de 3 cases
          if (dx > (up === 0 ? 5 : up < 3 ? 4 : 3)) continue;
          const tr = r - up;
          if (!STANDABLE(rows, tc, tr, open)) continue;
          // tête libre au-dessus du point de départ pendant la montée
          let clear = true;
          for (let rr = r - 1; rr >= tr - 1; rr--) if (!PASSABLE(rows, c, rr, open)) clear = false;
          if (clear) push(tc, tr);
        }
        landDown(tc, r + 1);
      }
    }
    // saut vertical sur place / en montée immédiate
    for (const dc of [-1, 1])
      for (let up = 1; up <= 3; up++) if (PASSABLE(rows, c, r - up, open)) push(c + dc, r - up);
  }
  return seen;
}

/** Les deux extrémités du couloir sont-elles reliées (portes à interrupteur comprises) ? */
function corridorTraversable(rows) {
  const open = new Set();
  const key = (c, r) => r * 30 + c;
  const start = (() => {
    for (let r = 13; r >= 1; r--) for (let c of [1, 28]) if (STANDABLE(rows, c, r, open)) return [c, r];
    return null;
  })();
  if (!start) return false;
  for (let pass = 0; pass < 3; pass++) {
    const seen = reachableCells(rows, start, open);
    // un bouton atteint ouvre la porte X (définitivement)
    for (let r = 0; r < 17; r++)
      for (let c = 0; c < 30; c++)
        // une ancre scellée dans un pilier (rangée 12) est atteinte par le clone, apparu à 3 cases devant le héros
        if (
          rows[r][c] === '1' &&
          [...seen].some((k) => {
            const kc = k % 30,
              kr = Math.floor(k / 30);
            return kr >= r && (kc === c || (r === 12 && Math.abs(kc - c) <= 5 && kr === 13));
          })
        )
          open.add('X');
  }
  const seen = reachableCells(rows, start, open);
  const ends = [1, 28].map((c) => [13, 12, 11].some((r) => seen.has(key(c, r))));
  return ends.every(Boolean);
}

describe('design du monde', () => {
  let T;
  const worlds = {};
  beforeAll(async () => {
    seedRandom(7);
    installStubs(globalThis);
    await import('../src/main.js');
    T = globalThis.__T;
    for (const seed of SEEDS) {
      T.S.seed = seed;
      T.buildWorld(seed);
      worlds[seed] = {
        levels: T.LV.map((l) => ({
          ...l,
          rows: (l.rows || []).slice(),
          links: (l.links || []).map((k) => ({ ...k })),
        })),
        ranks: T.WORLD.ranks.map((r) => ({ ...r })),
      };
    }
  });

  describe('numéros de salles', () => {
    it('chaque salle a un numéro, et les numéros sont uniques dans un même monde', () => {
      for (const seed of SEEDS) {
        const numbers = worlds[seed].levels.map((l, i) => ({ i, name: l.name, n: l.number }));
        for (const r of numbers)
          expect(r.n, `salle ${r.i} « ${r.name} » (graine ${seed}) sans numéro`).toBeTypeOf('number');
        const seen = new Map();
        for (const r of numbers) {
          expect(seen.has(r.n), `numéro ${r.n} en double : « ${r.name} » et « ${seen.get(r.n)} »`).toBe(
            false,
          );
          seen.set(r.n, r.name);
        }
      }
    });

    it('un numéro suit la salle, pas sa place : le même nom donne le même numéro sur toutes les graines', () => {
      const byName = new Map();
      for (const seed of SEEDS) {
        for (const l of worlds[seed].levels) {
          if (l.gen || l.hub) continue;
          const key = (l.boss ? 'arène ' : '') + l.name;
          if (byName.has(key))
            expect(l.number, `« ${key} » change de numéro selon la graine`).toBe(byName.get(key));
          else byName.set(key, l.number);
        }
      }
      expect(byName.size).toBeGreaterThan(20);
      // repères figés : ne doivent jamais bouger
      expect(byName.get('Premiers pas')).toBe(1);
      expect(byName.get('Derrière la porte')).toBe(10);
      expect(byName.get('Le fossé')).toBe(20);
      expect(byName.get('arène Le Gardien du Temps')).toBe(90);
    });

    it('les salles générées sont numérotées par leur case (200 + 13 × ligne + colonne), le Hall est 0', () => {
      const w = worlds[SEEDS[0]].levels;
      expect(w[T.HUB].number).toBe(0);
      for (const l of w) {
        if (!l.gen) continue;
        expect(l.number).toBe(200 + l.pos[1] * 13 + l.pos[0]);
      }
    });
  });

  it('le dash (Éclair, écho 4) est le 3e pouvoir à obtenir', () => {
    expect(T.ORDER.slice(0, 3)).toEqual(['t', 2, 4]);
    expect(T.ORDER.indexOf(5)).toBeGreaterThan(T.ORDER.indexOf(4));
  });

  it("n'a presque aucune porte verrouillée : la 1re aile (écho du Temps) et les échelles de boss", () => {
    for (const seed of SEEDS) {
      const gates = worlds[seed].levels.flatMap((l) => l.links.filter((k) => k.gate).map((k) => k.gate));
      for (const g of gates)
        expect('t' in g || 'cl' in g, `verrou inattendu ${JSON.stringify(g)} (graine ${seed})`).toBe(true);
      expect(gates.filter((g) => 't' in g)).toHaveLength(1);
      worlds[seed].ranks.forEach((r) => {
        if (r.r > 1) expect(r.gate, `aile ${r.r} ne doit pas être verrouillée`).toBeFalsy();
      });
    }
  });

  it("chaque aile n'exige que des pouvoirs déjà gagnés et bloque physiquement sur le dernier obtenu", () => {
    for (const seed of SEEDS) {
      worlds[seed].ranks.forEach((rk) => {
        if (rk.r === 1) return;
        const owned = new Set(T.ORDER.slice(1, rk.r)); // pouvoirs gagnés avant cette aile
        const newest = T.ORDER[rk.r - 1];
        const needs = rk.ap.map((i) => worlds[seed].levels[i].need || []);
        for (const need of needs)
          for (const p of need)
            expect(owned.has(p), `aile ${rk.r}: pouvoir ${p} pas encore gagné`).toBe(true);
        expect(
          needs.some((n) => n.includes(newest)),
          `aile ${rk.r} (graine ${seed}) ne bloque pas sans ${newest}`,
        ).toBe(true);
      });
    }
  });

  it('au moins 7 salles sur 10 ont des ennemis, des pièges ou une énigme', () => {
    for (const seed of SEEDS) {
      const R = worlds[seed].levels.filter((l) => !l.boss && !l.king && !l.rest && !l.hub);
      const has = (l) =>
        /[+?!*^~123]/.test(l.rows.join('')) ||
        /[a-dfg-oq-zA-DF-OQ-Z]/.test(l.rows.join('').replace(/[EP]/g, ''));
      const ratio = R.filter(has).length / R.length;
      expect(ratio, `graine ${seed}`).toBeGreaterThanOrEqual(0.7);
    }
  });

  it('les salles libres (palier F) restent traversables sans aucun pouvoir, interrupteurs compris', () => {
    let checked = 0;
    for (const seed of SEEDS) {
      for (const l of worlds[seed].levels) {
        const horizontal = l.links.filter((k) => k.s === 'l' || k.s === 'r');
        const vertical = l.links.filter((k) => k.s === 't' || k.s === 'b');
        if (!l.gen || l.tier !== 'F' || l.rest || vertical.length || horizontal.length < 2) continue;
        checked++;
        expect(corridorTraversable(l.rows), `salle « ${l.name} » (graine ${seed}) infranchissable`).toBe(
          true,
        );
      }
    }
    expect(checked).toBeGreaterThan(20);
  });
});
