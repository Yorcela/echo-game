// Eau : sans la nage (gagnée sur la Pieuvre), entrer dans l'eau coûte 1 cœur et ramène au dernier sol sûr ; avec, on nage.
import { runtime } from '../state/runtime.ts';
import { gameState } from '../state/state.ts';
import { hurtPlayer } from './rewind.js';
import { inWater } from './physics.js';

let safe = null;
const bossFightOn = () =>
  runtime.level.boss &&
  runtime.level.boss.kind === 'octopus' &&
  runtime.entities.some((e) => e.k === 'b' && e.alive);

/** Autorise la nage pour le héros et son clone (appelé avant le déplacement). */
export function prepareWater() {
  runtime.player.swim = !!gameState.hasSwim;
  if (runtime.echoClone) runtime.echoClone.swim = !!gameState.hasSwim;
}
/** Après le déplacement : dernier sol sûr, chute à l'eau sans la nage. */
export function updateWater() {
  const P = runtime.player;
  const spawn = () => ({ x: runtime.spawnPoint.x, y: runtime.spawnPoint.y });
  if (!safe || safe.room !== gameState.loadedRoom)
    safe = { room: gameState.loadedRoom, ...(inWater(P) ? spawn() : { x: P.x, y: P.y }) };
  if (!inWater(P) && P.g) {
    safe.x = P.x;
    safe.y = P.y;
  }
  if (gameState.hasSwim || bossFightOn() || gameState.mode !== 'play') return;
  if (runtime.echoClone && inWater(runtime.echoClone)) runtime.echoClone = null;
  if (inWater(P)) {
    if (gameState.invulnerableTimer <= 0) hurtPlayer(1, false, P.x + P.w / 2);
    if (gameState.mode === 'play') {
      // retour au dernier sol sûr (ou, à défaut, au départ de la salle) : on ne reste jamais dans l'eau sans la nage
      const probe = { x: safe.x, y: safe.y, w: P.w, h: P.h };
      const to = inWater(probe) ? spawn() : safe;
      P.x = to.x;
      P.y = to.y;
      P.vx = 0;
      P.vy = 0;
      P.g = false;
    }
  }
}
