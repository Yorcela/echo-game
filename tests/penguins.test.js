// Pingouin : se propulse (accélération vive) puis glisse sur la glace en ralentissant, et fait demi-tour devant un mur.
import { describe, it, expect, beforeAll } from 'vitest';
import { installStubs, seedRandom } from './helpers/dom-stub.js';

const WALL = '#'.repeat(30);
const EMPTY = '.'.repeat(30);
// salle plate : sol plein rangée 14, glace sur toute la rangée 13 ; le pingouin part de la colonne 5
const room = () => {
  const ice = '.' + '_'.repeat(28) + '.';
  const spawn = ice.slice(0, 5) + ':' + ice.slice(6);
  return [...Array(13).fill(EMPTY), spawn, WALL, WALL, WALL];
};

describe('pingouin', () => {
  let T;
  beforeAll(async () => {
    seedRandom(7);
    installStubs(globalThis);
    await import('../src/main.js');
    T = globalThis.__T;
    T.buildWorld(11);
  });

  it('part à 3× la vitesse du héros et ralentit jusqu\u2019à 0,7× sur la distance de glace, sans s\u2019arrêter en route', () => {
    T.LV[1].rows = room();
    T.load(1);
    T.S.mode = 'play';
    const p = T.ents.find((e) => e.k === 'w' && e.t === 'p');
    expect(p).toBeTruthy();
    // course sur toute la salle : on relève la vitesse et le sens de chaque image
    let peak = 0,
      slowest = Infinity,
      turns = 0,
      lastDir = p.dir;
    for (let f = 0; f < 60 * 14; f++) {
      T.P.x = 28 * 32; // héros loin, hors de portée
      T.P.y = 4 * 32;
      T.step(1 / 60);
      const v = Math.abs(p.vx);
      peak = Math.max(peak, v);
      // vitesse en glissade franche (entre le début de la poussée et la fin de course)
      if (p.pst === 'glide' && v > 0) slowest = Math.min(slowest, v);
      if (p.dir !== lastDir) {
        turns++;
        lastDir = p.dir;
      }
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(30 * 32);
    }
    expect(peak).toBeGreaterThan(3 * 225 * 0.95);
    expect(peak).toBeLessThanOrEqual(3 * 225 + 1);
    // en fin de piste il tourne autour de 0,7× (157 px/s), jamais sous cette valeur en glissant
    expect(slowest).toBeGreaterThan(0.7 * 225 * 0.9);
    expect(slowest).toBeLessThan(0.7 * 225 * 1.5);
    expect(turns).toBeGreaterThanOrEqual(2);
  });

  it('une salle de glace ne contient que des pingouins comme ennemis', () => {
    T.buildWorld(11);
    for (const l of T.LV) {
      if (!l.rows || l.boss || !l.rows[13].includes('_')) continue;
      const all = l.rows.join('');
      expect(all, 'salle ' + l.number).not.toMatch(/[*+!?;]/);
      expect(all).toContain(':');
    }
  });
});
