// Mode test : uniquement avec le serveur de développement lancé en mode « test » (vite --mode test, port 5174) sur localhost.
// La carte permet alors de se téléporter où l'on veut, avec les pouvoirs qu'il faut pour la salle visée.
// Le serveur de développement normal (port 5173) et le build publié jouent normalement.
import { BOSS_ORDER, levels } from '../data/levels.js';
import { HUB_ROOM, gameState } from '../state/state.ts';

export const TEST_MODE =
  import.meta.env.MODE === 'test' &&
  import.meta.env.DEV &&
  typeof location !== 'undefined' &&
  ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

/**
 * Donne les pouvoirs attendus à l'arrivée dans la salle `i` : pour l'arène d'un boss, ceux qu'on a gagnés avant lui
 * (dans l'ordre de progression) ; partout ailleurs, tous.
 */
export function grantTestPowers(i) {
  const l = levels[i];
  let upTo = BOSS_ORDER.length;
  if (l && l.boss && i !== HUB_ROOM) {
    const rank = BOSS_ORDER.indexOf(l.gain);
    if (rank >= 0) upTo = rank;
  }
  gameState.echoesOwned = [0, 0, 0, 0, 0, 0, 0];
  gameState.hasTimeEcho = 0;
  gameState.hasSwim = 0;
  for (let k = 0; k < upTo; k++) {
    const g = BOSS_ORDER[k];
    if (g === 't') gameState.hasTimeEcho = 1;
    else if (g === 7) gameState.hasSwim = 1;
    else gameState.echoesOwned[g] = 1;
  }
  const first = gameState.echoesOwned.findIndex(Boolean);
  gameState.selectedEcho = first >= 0 ? first : 0;
}
