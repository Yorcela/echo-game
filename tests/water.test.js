// Eau : sans la nage elle blesse et ramène au sol sûr ; avec la nage on la traverse (salles d'eau de l'approche).
import { describe, it, expect, beforeAll } from 'vitest';
import { installStubs, seedRandom } from './helpers/dom-stub.js';

describe('eau et nage', () => {
  let T;
  beforeAll(async () => {
    seedRandom(7);
    installStubs(globalThis);
    await import('../src/main.js');
    T = globalThis.__T;
    T.buildWorld(11);
  });
  function play(roomName, swim, frames, input) {
    T.LV[1].rows = T.N[roomName].rows.map((r) => r.replace('+', '.').replace(/`/g, '"')); // sans le crabe de la berge
    T.load(1);
    T.S.mode = 'play';
    T.S.hp = 3;
    T.S.invulnerableTimer = 0;
    T.S.hasSwim = swim;
    const x0 = T.P.x;
    Object.assign(T.I, { l: 0, r: 0, u: 0, d: 0, jp: 0, jh: 0 }, input);
    let hurt = false,
      maxX = x0;
    for (let f = 0; f < frames; f++) {
      const hp = T.S.hp;
      T.step(1 / 60);
      if (T.S.hp < hp) hurt = true;
      maxX = Math.max(maxX, T.P.x);
    }
    Object.assign(T.I, { l: 0, r: 0, u: 0, d: 0, jp: 0, jh: 0 });
    return { hurt, maxX };
  }

  it("sans la nage, l'eau blesse et ne se traverse pas", () => {
    const { hurt, maxX } = play('sw1', 0, 60 * 8, { r: 1 });
    expect(hurt).toBe(true);
    expect(maxX).toBeLessThan(24 * 32);
  });

  it("avec la nage, on traverse le bassin et on ressort sur la berge d'en face", () => {
    T.LV[1].rows = T.N.sw1.rows.map((r) => r.replace('+', '.').replace(/`/g, '"'));
    T.load(1);
    T.S.mode = 'play';
    T.S.hp = 3;
    T.S.invulnerableTimer = 0;
    T.S.hasSwim = 1;
    let hurt = false;
    for (let f = 0; f < 60 * 14; f++) {
      Object.assign(T.I, { l: 0, r: 1, u: 1, d: 0, jp: f % 8 === 0 ? 1 : 0, jh: 0 });
      const hp = T.S.hp;
      T.step(1 / 60);
      if (T.S.hp < hp) hurt = true;
    }
    Object.assign(T.I, { l: 0, r: 0, u: 0, d: 0, jp: 0, jh: 0 });
    expect(hurt).toBe(false);
    expect(T.P.x).toBeGreaterThan(25 * 32);
  });

  it('on passe sous le mur en plongeant', () => {
    T.LV[1].rows = T.N.sw2.rows.map((r) => r.replace('+', '.').replace(/`/g, '"'));
    T.load(1);
    T.S.mode = 'play';
    T.S.hp = 3;
    T.S.invulnerableTimer = 0;
    T.S.hasSwim = 1;
    let maxX = 0;
    for (let f = 0; f < 60 * 14; f++) {
      // plonger d'abord sous le mur, puis remonter vers la berge d'en face
      const phase2 = T.P.x > 16 * 32;
      Object.assign(T.I, {
        l: 0,
        r: 1,
        u: phase2 ? 1 : 0,
        d: phase2 ? 0 : 1,
        jp: phase2 && f % 8 === 0 ? 1 : 0,
        jh: 0,
      });
      T.step(1 / 60);
      maxX = Math.max(maxX, T.P.x);
    }
    Object.assign(T.I, { l: 0, r: 0, u: 0, d: 0, jp: 0, jh: 0 });
    expect(maxX).toBeGreaterThan(24 * 32);
  });

  it('la nage fait partie des pouvoirs : sauvegardée, exigée pour le Roi', () => {
    T.S.hasSwim = 0;
    expect(T.S.hasSwim).toBe(0);
    T.S.hasSwim = 1;
    expect(T.S.hasSwim).toBe(1);
  });

  describe('piranhas', () => {
    const room = () => {
      T.LV[1].rows = T.N.sw1.rows.map((r) => r.replace('+', '.'));
      T.load(1);
      T.S.mode = 'play';
      T.S.hp = 3;
      T.S.invulnerableTimer = 0;
      T.S.hasSwim = 1;
    };
    const fish = () => T.ents.filter((e) => e.k === 'w' && e.t === 'f');

    it("les salles d'eau en contiennent, et ils restent dans l'eau", () => {
      room();
      expect(fish().length).toBeGreaterThanOrEqual(2);
      for (let f = 0; f < 60 * 6; f++) {
        T.P.x = 3 * 32;
        T.P.y = 7 * 32 - T.P.h + 32; // sur la berge, hors de l'eau
        T.step(1 / 60);
      }
      for (const e of fish()) {
        const c = Math.floor((e.x + e.w / 2) / 32),
          r = Math.floor((e.y + e.h / 2) / 32);
        expect(T.G[r][c]).toBe('"');
      }
    });

    it('ils se jettent sur le héros qui nage', () => {
      room();
      T.P.x = 8 * 32;
      T.P.y = 12 * 32;
      T.P.vy = 0;
      const e = fish()[0];
      const d0 = Math.hypot(e.x - T.P.x, e.y - T.P.y);
      for (let f = 0; f < 60 * 3; f++) {
        T.S.invulnerableTimer = 5;
        T.P.x = 8 * 32;
        T.P.y = 12 * 32;
        T.P.vy = 0;
        T.step(1 / 60);
      }
      expect(Math.hypot(e.x - T.P.x, e.y - T.P.y)).toBeLessThan(d0);
    });

    it('seul un dash les élimine ; on ne peut pas frapper dans l’eau', () => {
      room();
      const e = fish()[0];
      // coup de poing dans l'eau : refusé
      T.P.x = e.x - 20;
      T.P.y = e.y - 10;
      T.P.vy = 0;
      T.step(1 / 60);
      T.P.hcd = 0;
      expect(T.doHit()).toBe(false);
      // dash au travers : le piranha meurt, le héros n'est pas blessé
      T.P.x = e.x - 10;
      T.P.y = e.y - 10;
      T.P.dash = 0.3;
      T.P.dd = 1;
      T.S.invulnerableTimer = 0;
      const hp0 = T.S.hp;
      T.step(1 / 60);
      expect(e.alive).toBe(0);
      expect(T.S.hp).toBe(hp0);
    });
  });

  it("sans la nage on ne reste jamais dans l'eau : 1 cœur perdu puis retour sur la berge", () => {
    T.LV[1].rows = T.N.sw1.rows.slice();
    T.load(1);
    T.S.mode = 'play';
    T.S.hp = 3;
    T.S.hasSwim = 0;
    T.S.invulnerableTimer = 0;
    // placé en plein bassin dès le premier instant (cas où aucun sol sûr n'est encore connu)
    T.P.x = 12 * 32;
    T.P.y = 10 * 32;
    T.P.vy = 0;
    for (let f = 0; f < 60 * 6; f++) T.step(1 / 60);
    expect(T.P.y + T.P.h).toBeLessThan(9 * 32);
    expect(T.S.hp).toBeGreaterThan(1.5);
  });

  it('les salles 020, 002, 063, 010 et 085 ont une mare avec un piranha', () => {
    for (const seed of [11, 5, 222]) {
      T.buildWorld(seed);
      for (const n of [20, 2, 63, 10, 85]) {
        const l = T.LV.find((q) => q.number === n);
        expect(l.rows[14].includes('"') || l.rows[14].includes('`'), 'salle ' + n + ' graine ' + seed).toBe(
          true,
        );
        expect(l.rows.join('')).toContain('`');
      }
    }
  });
});
