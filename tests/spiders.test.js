// Arachnides : elles courent sur le décor (sol, murs, plafond) à la poursuite du héros et font descendre une toile qui blesse.
import { describe, it, expect, beforeAll } from 'vitest';
import { installStubs, seedRandom } from './helpers/dom-stub.js';

const WALL = '#'.repeat(30);
const row = (mid) => '#' + mid.padEnd(28, '.') + '#';
// pièce close : plafond (rangée 0), murs, sol à la rangée 14 ; l'arachnide part en (13, 10)
const room = () => [WALL, ...Array.from({ length: 12 }, () => row('')), row('..........;'), WALL, WALL, WALL];

describe('arachnides', () => {
  let T;
  beforeAll(async () => {
    seedRandom(7);
    installStubs(globalThis);
    await import('../src/main.js');
    T = globalThis.__T;
    T.buildWorld(11);
  });
  const spider = () => T.ents.find((e) => e.k === 'w' && e.t === 'a');
  function start() {
    T.LV[1].rows = room();
    T.load(1);
    T.S.mode = 'play';
    return spider();
  }
  /** Garde le héros immobile en l'air à (col, rangée). */
  function hold(col, rowIdx) {
    T.P.x = col * 32;
    T.P.y = rowIdx * 32;
    T.P.vy = 0;
    T.P.vx = 0;
  }

  it('apparaît depuis le caractère ; et reste dans la salle', () => {
    const s = start();
    expect(s).toBeTruthy();
    for (let f = 0; f < 60 * 10; f++) {
      hold(25, 9);
      T.step(1 / 60);
      expect(s.sx).toBeGreaterThanOrEqual(0);
      expect(s.sx).toBeLessThanOrEqual(30 * 32);
      expect(s.sy).toBeGreaterThanOrEqual(0);
      expect(s.sy).toBeLessThanOrEqual(15 * 32);
    }
  });

  it('sans toile au sol elle reste au plafond et se place au-dessus du héros', () => {
    const s = start();
    for (let f = 0; f < 60 * 10; f++) {
      hold(25, 9);
      T.step(1 / 60);
      expect(s.wd).toBe(3);
    }
    expect(Math.abs(s.sx - (25 * 32 + 16))).toBeLessThan(48);
  });

  it('grimpe au plafond et descend sa toile quand le héros est dessous', () => {
    const s = start();
    let webbed = false;
    for (let f = 0; f < 60 * 20 && !webbed; f++) {
      hold(15, 3);
      T.step(1 / 60);
      if (s.wlen > 20) webbed = true;
    }
    expect(webbed).toBe(true);
  });

  it('sur une toile au sol elle reste au sol : ni mur ni plafond', () => {
    T.LV[1].rows = room().map((r, i) => (i === 13 ? '#' + ','.repeat(10) + ';' + ','.repeat(17) + '#' : r));
    T.load(1);
    T.S.mode = 'play';
    const s = spider();
    for (let f = 0; f < 60 * 12; f++) {
      hold(3, 3); // héros en hauteur : sans toile elle irait au plafond
      T.step(1 / 60);
      expect(s.wd).toBe(1);
    }
  });

  it('le fil descend jusqu’au sol', () => {
    const s = start();
    let max = 0;
    for (let f = 0; f < 60 * 20; f++) {
      hold(15, 3);
      T.step(1 / 60);
      max = Math.max(max, s.wlen);
    }
    // plafond (rangée 1) → sol (rangée 14) : plus de 10 cases
    expect(max).toBeGreaterThan(10 * 32);
  });

  it('la salle de la case (9,7) a un sol de toile et 1 à 3 araignées', () => {
    T.buildWorld(11);
    const l = T.LV.find((q) => q.pos + '' === '9,7');
    const n = l.rows.join('').split(';').length - 1;
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(3);
    expect(l.rows.join('')).toContain(',');
  });
});
