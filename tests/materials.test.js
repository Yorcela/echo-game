// Matières du sol : la colle ralentit, la glace accélère et fait glisser (héros comme ennemis).
import { describe, it, expect, beforeAll } from 'vitest';
import { installStubs, seedRandom } from './helpers/dom-stub.js';

const FLOOR = '#'.repeat(30);
const EMPTY = '.'.repeat(30);
// salle plate : 14 rangées vides, sol plein à la rangée 14 ; la rangée 13 reçoit la matière testée
const flatRoom = (row13) => [...Array(13).fill(EMPTY), row13, FLOOR, FLOOR, FLOOR];

describe('matières du sol', () => {
  let T;
  beforeAll(async () => {
    seedRandom(7);
    installStubs(globalThis);
    await import('../src/main.js');
    T = globalThis.__T;
    T.buildWorld(11);
  });

  /** Fait courir le héros à droite pendant `frames` images depuis la colonne 1 ; renvoie x parcouru. */
  function run(row13, frames) {
    T.LV[1].rows = flatRoom(row13);
    T.load(1);
    T.S.mode = 'play';
    const x0 = T.P.x;
    T.I.r = 1;
    T.I.l = 0;
    for (let f = 0; f < frames; f++) {
      T.I.jp = 0;
      T.I.jh = 0;
      T.step(1 / 60);
    }
    T.I.r = 0;
    return T.P.x - x0;
  }
  const prefix = (ch, n) => '.'.repeat(1) + ch.repeat(n) + '.'.repeat(30 - 1 - n);

  it('la colle ralentit nettement la marche', () => {
    const normal = run(EMPTY, 40);
    const glue = run(prefix(',', 25), 40);
    expect(glue).toBeLessThan(normal * 0.6);
  });

  it('la glace fait aller plus vite et glisser après le relâchement', () => {
    const normal = run(EMPTY, 40);
    const ice = run(prefix('_', 28), 40);
    expect(ice).toBeGreaterThan(normal);
    const before = T.P.x;
    for (let f = 0; f < 20; f++) T.step(1 / 60); // plus d'entrée : le héros continue de glisser
    expect(T.P.x - before).toBeGreaterThan(20);
  });

  /** Distance horizontale d'un saut pris après `runFrames` images de course sur la matière. */
  function jumpDistance(row13, runFrames) {
    T.LV[1].rows = flatRoom(row13);
    T.load(1);
    T.S.mode = 'play';
    T.I.r = 1;
    for (let f = 0; f < runFrames; f++) {
      T.I.jp = 0;
      T.I.jh = 0;
      T.step(1 / 60);
    }
    const x0 = T.P.x;
    T.I.jp = 1;
    T.I.jh = 1;
    T.step(1 / 60);
    T.I.jp = 0;
    for (let f = 0; f < 120 && !T.P.g; f++) T.step(1 / 60);
    for (let f = 0; f < 60 && !T.P.g; f++) T.step(1 / 60);
    const d = T.P.x - x0;
    T.I.r = 0;
    T.I.jh = 0;
    return d;
  }

  it("l'élan pris sur la glace allonge le saut (de quoi franchir un fossé plus large avec le dash)", () => {
    const flat = jumpDistance(EMPTY, 36);
    const ice = jumpDistance(prefix('_', 28), 36);
    expect(ice).toBeGreaterThan(flat * 1.1);
  });
});
