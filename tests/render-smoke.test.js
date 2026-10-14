// Le rendu est protégé par un try/catch dans la boucle de jeu : ici on l'appelle directement
// pour que toute référence manquante ou erreur de dessin fasse échouer le test.
import { describe, it, expect, beforeAll } from 'vitest';
import { installStubs, seedRandom } from './helpers/dom-stub.js';

describe('rendu', () => {
  let T;
  beforeAll(async () => {
    seedRandom(7);
    installStubs(globalThis);
    await import('../src/main.js');
    T = globalThis.__T;
    T.resetAll();
  });

  it('dessine chaque salle en jeu sans erreur', () => {
    for (let i = 0; i < T.LV.length; i++) {
      T.load(i);
      T.S.mode = 'play';
      for (let f = 0; f < 5; f++) T.step(1 / 60);
      T.S.mode = 'play';
      expect(() => T.draw(), `salle ${i}`).not.toThrow();
    }
  });

  it('dessine les écrans annexes', () => {
    T.load(0);
    for (const mode of ['title', 'map', 'pause', 'scores', 'over', 'sleep', 'gain', 'rewind']) {
      T.S.mode = mode;
      expect(() => T.draw(), `mode ${mode}`).not.toThrow();
    }
  });
});
