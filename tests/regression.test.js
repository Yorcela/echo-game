// Non-régression : rejoue un scénario déterministe (génération du monde + physique) et le compare à des empreintes.
// Référence initiale = ancien code avant refactor ; régénérée volontairement lors du changement de design
// (dash en 3e pouvoir, monde sans portes verrouillées, nouveaux mécanismes). Pour la régénérer : voir README.
import { describe, it, expect, beforeAll } from 'vitest';
import { installStubs, runScenario } from './helpers/dom-stub.js';
import golden from './golden-scenario.json';

describe('scénario déterministe', () => {
  let result;
  beforeAll(async () => {
    let s = 1;
    Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    Date.now = () => 1700000000000;
    installStubs(globalThis);
    await import('../src/main.js');
    result = runScenario(globalThis.__T);
  });

  it('génère les mêmes mondes et trajectoires que la référence', () => {
    expect(result).toEqual(golden);
  });
});
