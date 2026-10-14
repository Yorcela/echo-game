import { canvas } from '../core/canvas.js';
import { actions, gameState, input } from '../state/state.js';
import { loadSavedGame } from '../state/save.js';
import { loadRoom } from '../world/rooms.js';
import { rewindFrame } from './rewind.js';
import { step } from './step.js';
import { positionName } from '../ui/hud.js';
import { draw } from '../render/scene.js';
import { syncTouchPad } from '../input/input.js';
/* ---------- Boucle ---------- */
let lastFrameTime = 0,
  acc = 0;
export function frame(ts) {
  const dt = Math.min(0.05, (ts - lastFrameTime) / 1000 || 0);
  lastFrameTime = ts;
  gameState.time += dt;
  gameState.resetArmedTimer = Math.max(0, gameState.resetArmedTimer - dt);
  if (gameState.pressT > 0 && (gameState.pressT -= dt) <= 0) gameState.press = null;
  gameState.shake = Math.max(0, gameState.shake - dt);
  if (gameState.mode === 'play' || gameState.mode === 'rewind') {
    gameState.lt += dt;
    gameState.runTime += dt;
  }
  if (gameState.mode === 'play' && gameState.slideTimer > 0) {
    gameState.slideTimer = Math.max(0, gameState.slideTimer - dt);
    acc = 0;
    input.jp = 0;
    actions.cl = actions.hit = actions.cyc = actions.r5 = actions.r10 = actions.tir = 0;
  } else if (gameState.mode === 'play') {
    acc += dt;
    while (acc >= 1 / 60) {
      step(1 / 60);
      acc -= 1 / 60;
      if (gameState.mode !== 'play') {
        acc = 0;
        break;
      }
    }
  } else if (gameState.mode === 'rewind') {
    acc = 0;
    rewindFrame(dt);
  } else if (gameState.mode === 'gain') {
    gameState.gainTimer += dt;
  } else {
    acc = 0;
  }
  gameState.fade = Math.max(0, gameState.fade - dt);
  if (gameState.mode !== 'play') {
    actions.r5 = actions.r10 = actions.cl = actions.hit = actions.cyc = 0;
  }
  gameState.bedFadeTimer = Math.max(0, gameState.bedFadeTimer - dt);
  positionName();
  syncTouchPad();
  try {
    draw();
  } catch (err) {
    try {
      // réinitialise le canvas (efface l'état de dessin corrompu par l'erreur)
      // eslint-disable-next-line no-self-assign
      canvas.width = canvas.width;
    } catch (_) {}
  }
  requestAnimationFrame(frame);
}
loadSavedGame();
loadRoom(gameState.cur);
gameState.mode = 'title';
