import { canvas } from '../core/canvas.js';
import { actions, gameState, input } from '../state/state.js';
import { loadSave } from '../state/save.js';
import { load } from '../world/rooms.js';
import { rewindFrame } from './rewind.js';
import { step } from './step.js';
import { positionName } from '../ui/hud.js';
import { draw } from '../render/scene.js';
import { syncPad } from '../input/input.js';
/* ---------- Boucle ---------- */
let last = 0,
  acc = 0;
export function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0);
  last = ts;
  gameState.time += dt;
  gameState.rst = Math.max(0, gameState.rst - dt);
  if (gameState.pressT > 0 && (gameState.pressT -= dt) <= 0) gameState.press = null;
  gameState.shake = Math.max(0, gameState.shake - dt);
  if (gameState.mode === 'play' || gameState.mode === 'rewind') {
    gameState.lt += dt;
    gameState.run += dt;
  }
  if (gameState.mode === 'play' && gameState.slide > 0) {
    gameState.slide = Math.max(0, gameState.slide - dt);
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
    gameState.gainT += dt;
  } else {
    acc = 0;
  }
  gameState.fade = Math.max(0, gameState.fade - dt);
  if (gameState.mode !== 'play') {
    actions.r5 = actions.r10 = actions.cl = actions.hit = actions.cyc = 0;
  }
  gameState.bedT = Math.max(0, gameState.bedT - dt);
  positionName();
  syncPad();
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
loadSave();
load(gameState.cur);
gameState.mode = 'title';
