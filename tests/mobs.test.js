// Ennemis marcheurs : demi-tour devant un obstacle (à toute hauteur) ; règles du dash.
import { describe, it, expect, beforeAll } from 'vitest';
import { installStubs, seedRandom } from './helpers/dom-stub.js';

const FLOOR = '#'.repeat(30);
const EMPTY = '.'.repeat(30);
const row = (cells) => {
  const a = EMPTY.split('');
  for (const [c, ch] of Object.entries(cells)) a[+c] = ch;
  return a.join('');
};

describe('mobs', () => {
  let T;
  beforeAll(async () => {
    seedRandom(7);
    installStubs(globalThis);
    await import('../src/main.js');
    T = globalThis.__T;
    T.buildWorld(11);
  });
  const load = (rows13, extra = {}) => {
    const rows = [...Array(13).fill(EMPTY), rows13, FLOOR, FLOOR, FLOOR];
    for (const [r, cells] of Object.entries(extra)) rows[+r] = row(cells);
    T.LV[1].rows = rows;
    T.load(0); // on arrive de l'extérieur : les ennemis tués d'un test précédent reviennent
    T.load(1);
    T.S.mode = 'play';
    T.S.hp = 3;
    T.S.invulnerableTimer = 0;
  };
  const park = () => {
    T.P.x = 28 * 32;
    T.P.y = 2 * 32;
    T.P.vy = 0;
  };

  it('un colosse bloqué par un obstacle en hauteur fait demi-tour', () => {
    // le sol est libre devant lui, mais un bloc est à hauteur de tête
    load(row({ 10: '!' }), { 12: { 15: '#', 16: '#' } });
    const r = T.ents.find((e) => e.t === 'r');
    let turned = false;
    for (let f = 0; f < 60 * 8 && !turned; f++) {
      park();
      T.step(1 / 60);
      if (r.dir < 0) turned = true;
      expect(r.x).toBeLessThan(15 * 32);
    }
    expect(turned).toBe(true);
  });

  it("un dash qui traverse un crabe l'écrase sans blesser le héros", () => {
    load(row({ 10: '+' }));
    const c = T.ents.find((e) => e.t === 'c');
    T.P.x = c.x - 6;
    T.P.y = c.y;
    T.P.dash = 0.3;
    T.P.dd = 1;
    const hp0 = T.S.hp;
    T.step(1 / 60);
    expect(c.alive).toBe(0);
    expect(T.S.hp).toBe(hp0);
  });

  it('un dash dans un autre mob (colosse) blesse le héros', () => {
    load(row({ 10: '!' }));
    const r = T.ents.find((e) => e.t === 'r');
    T.P.x = r.x - 6;
    T.P.y = r.y;
    T.P.dash = 0.3;
    T.P.dd = 1;
    const hp0 = T.S.hp;
    T.step(1 / 60);
    expect(T.S.hp).toBeLessThan(hp0);
    expect(r.alive).toBe(1);
  });

  it('un ennemi tué ne revient pas tant qu’on ne quitte pas la salle', () => {
    load(row({ 10: '+', 20: '+' }));
    const [a] = T.ents.filter((e) => e.t === 'c');
    a.alive = 0;
    T.step(1 / 60);
    T.load(1, 'p'); // rechargement dans la même salle (piège, retour arrière)
    expect(T.ents.filter((e) => e.t === 'c')).toHaveLength(1);
    T.load(0);
    T.load(1, 'p'); // on est sorti puis revenu
    expect(T.ents.filter((e) => e.t === 'c')).toHaveLength(2);
  });

  it('les piques font perdre de la vie et font rebondir, sans redémarrer la salle', () => {
    load(row({ 20: '^' }));
    const x0 = 18 * 32;
    T.P.x = 20 * 32;
    T.P.y = 14 * 32 - T.P.h - 2;
    T.P.vx = 0;
    T.P.face = 1;
    const hp0 = T.S.hp;
    T.step(1 / 60);
    expect(T.S.hp).toBeLessThan(hp0);
    expect(T.S.mode).toBe('play');
    expect(T.P.vy).toBeLessThan(0); // rebond
    expect(T.P.x).toBeGreaterThan(x0); // pas ramené au départ de la salle
  });
});
