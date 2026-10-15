// La Pieuvre : tentacules qui s'abattent sur les plateformes, coups à rendre, plateformes qui s'effondrent, chute à l'eau.
import { describe, it, expect, beforeAll } from 'vitest';
import { installStubs, seedRandom } from './helpers/dom-stub.js';

describe('la Pieuvre', () => {
  let T, idx, tentaclesFor;
  beforeAll(async () => {
    seedRandom(7);
    installStubs(globalThis);
    await import('../src/main.js');
    ({ tentaclesFor } = await import('../src/game/octopus.js'));
    T = globalThis.__T;
    T.buildWorld(11);
    idx = T.LV.findIndex((l) => l.boss && l.boss.kind === 'octopus');
  });
  const start = () => {
    T.load(idx);
    T.S.mode = 'play';
    T.S.hp = 3;
    T.S.invulnerableTimer = 0;
    return T.ents.find((e) => e.k === 'b');
  };

  it("l'arène a 9 plateformes et la pieuvre au centre", () => {
    const e = start();
    expect(T.LV[idx].platforms).toHaveLength(9);
    expect(T.LV[idx].gain).toBe(7);
    expect(e.hp).toBe(10);
    expect(e.x + e.w / 2).toBeGreaterThan(14 * 32);
    expect(e.x + e.w / 2).toBeLessThan(16 * 32);
  });

  it('abat 1 tentacule, puis 2 à 60 % de vie, puis 3 à 30 %', () => {
    expect(tentaclesFor(10, 10)).toBe(1);
    expect(tentaclesFor(7, 10)).toBe(1);
    expect(tentaclesFor(6, 10)).toBe(2);
    expect(tentaclesFor(4, 10)).toBe(2);
    expect(tentaclesFor(3, 10)).toBe(3);
    expect(tentaclesFor(1, 10)).toBe(3);
  });

  it("annonce l'impact 1 s avant, puis blesse le héros resté sur la plateforme", () => {
    const e = start();
    const hp0 = T.S.hp;
    let sawTele = false;
    for (let f = 0; f < 60 * 4; f++) {
      T.step(1 / 60);
      if (e.oct && e.oct.tents.some((t) => t.st === 'tele')) sawTele = true;
    }
    expect(sawTele).toBe(true);
    expect(T.S.hp).toBeLessThan(hp0);
  });

  it('une tentacule plantée se frappe : la pieuvre perd 1 point de vie', () => {
    const e = start();
    let done = false;
    for (let f = 0; f < 60 * 6 && !done; f++) {
      const t = e.oct && e.oct.tents.find((q) => q.st === 'stuck');
      if (t) {
        const p = e.oct.plats[t.p];
        // à gauche de la tentacule, tourné vers elle
        T.P.x = (p.c0 + (p.c1 - p.c0 + 1) / 2) * 32 - 40;
        T.P.y = p.r * 32 - T.P.h;
        T.P.face = 1;
        T.P.hcd = 0;
        T.doHit();
        const hp = e.hp;
        T.step(1 / 60);
        for (let k = 0; k < 6; k++) T.step(1 / 60);
        expect(e.hp).toBe(hp - 1);
        done = true;
      } else {
        // hors de portée du premier impact
        T.P.x = 14 * 32;
        T.P.y = 1 * 32;
        T.P.vy = 0;
        T.step(1 / 60);
      }
    }
    expect(done).toBe(true);
  });

  it('une plateforme touchée 3 fois s’effondre', () => {
    const e = start();
    for (let f = 0; f < 60 * 25; f++) {
      T.P.x = 14 * 32; // héros en l'air au centre : la plus proche (haute, centrale) est visée à chaque fois
      T.P.y = 1 * 32;
      T.P.vy = 0;
      T.step(1 / 60);
    }
    const dead = e.oct.plats.filter((p) => !p.alive);
    expect(dead.length).toBeGreaterThanOrEqual(1);
    const p = dead[0];
    for (let c = p.c0; c <= p.c1; c++) expect(T.G[p.r][c]).toBe('.');
  });

  it("tomber à l'eau coûte 1 cœur et ramène sur une plateforme", () => {
    const e = start();
    for (let f = 0; f < 30; f++) T.step(1 / 60); // se pose sur la plateforme d'entrée
    T.S.invulnerableTimer = 0;
    const hp0 = T.S.hp;
    T.P.x = 13 * 32;
    T.P.y = 14 * 32 + 20;
    T.P.vy = 0;
    T.step(1 / 60);
    expect(T.S.hp).toBeCloseTo(hp0 - 1);
    expect(T.P.y + T.P.h).toBeLessThan(14 * 32);
    expect(e.alive).toBe(1);
  });

  it("une fois vaincue, l'eau reste et on peut y nager", () => {
    start();
    T.S.clearedBossRooms[idx] = 1;
    T.S.hasSwim = 1;
    T.load(idx);
    expect(T.ents.find((q) => q.k === 'b')).toBeUndefined();
    for (const r of [14, 15]) for (let c = 1; c <= 28; c++) expect(T.G[r][c]).toBe('"');
    // à l'eau avec la nage : pas de dégât, on reste dans l'eau
    T.S.invulnerableTimer = 0;
    const hp0 = T.S.hp;
    T.P.x = 13 * 32;
    T.P.y = 14 * 32;
    T.P.vy = 0;
    for (let f = 0; f < 30; f++) T.step(1 / 60);
    expect(T.S.hp).toBe(hp0);
    expect(T.P.y).toBeGreaterThan(13 * 32);
  });
});
