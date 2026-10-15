// Mode test : pouvoirs donnés selon la salle visée.
import { describe, it, expect, beforeAll } from 'vitest';
import { installStubs, seedRandom } from './helpers/dom-stub.js';

describe('mode test', () => {
  let T, grantTestPowers;
  beforeAll(async () => {
    seedRandom(7);
    installStubs(globalThis);
    await import('../src/main.js');
    ({ grantTestPowers } = await import('../src/game/test-mode.js'));
    T = globalThis.__T;
    T.buildWorld(11);
  });
  const roomOfGain = (g) => T.LV.findIndex((l) => l.boss && l.gain === g);

  it('arène de la Pieuvre : le Temps et le Jumeau seulement (pas la nage)', () => {
    grantTestPowers(roomOfGain(7));
    expect(T.S.hasTimeEcho).toBe(1);
    expect(T.S.hasSwim).toBe(0);
    expect(T.S.echoesOwned[2]).toBe(1);
    expect(T.S.echoesOwned.filter(Boolean)).toHaveLength(1);
  });

  it("arène du Gardien : aucun pouvoir ; arène de l'Éclair : Temps, Jumeau, Nage", () => {
    grantTestPowers(roomOfGain('t'));
    expect(T.S.hasTimeEcho).toBe(0);
    expect(T.S.echoesOwned.filter(Boolean)).toHaveLength(0);
    grantTestPowers(roomOfGain(4));
    expect(T.S.hasTimeEcho).toBe(1);
    expect(T.S.hasSwim).toBe(1);
    expect(T.S.echoesOwned[2]).toBe(1);
    expect(T.S.echoesOwned[4]).toBe(0);
  });

  it('salle ordinaire : tous les pouvoirs', () => {
    grantTestPowers(T.HUB);
    expect(T.S.hasTimeEcho).toBe(1);
    expect(T.S.hasSwim).toBe(1);
    expect(T.S.echoesOwned.every(Boolean)).toBe(true);
  });
});
