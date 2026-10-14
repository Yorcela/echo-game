import { runtime } from '../state/runtime.ts';
import { PLAYER_H, GIANT_H, PLAYER_W, GIANT_W, TILE } from '../core/config.ts';
import { gameState, input, ownedEchoes, showMessage } from '../state/state.ts';
import { collide } from './physics.js';
import { playSfx } from '../audio/audio.js';
/* ---------- Échos (pouvoirs) ---------- */
export function setSize(b, w, h) {
  const cx = b.x + b.w / 2,
    by = b.y + b.h;
  b.w = w;
  b.h = h;
  b.x = cx - w / 2;
  b.y = by - h;
}
function spawn(t) {
  if (t === 1) {
    const idx = Math.max(0, gameState.history.length - 240),
      e = gameState.history[idx],
      p = {
        ...e.p,
      };
    if (p.w !== PLAYER_W) {
      setSize(p, PLAYER_W, PLAYER_H);
    }
    p.hit = 0;
    p.dash = 0;
    runtime.echoClone = {
      ...p,
      type: 1,
      ttl: 8,
      k: 0,
      inp: gameState.history.slice(idx).map((h) => h.i),
    };
    playSfx('clone');
    return;
  }
  const b = {
    x: t === 0 ? 2 * 480 - runtime.player.x - PLAYER_W : runtime.player.x + 96 * runtime.player.face,
    y: runtime.player.y + runtime.player.h - PLAYER_H,
    vx: 0,
    vy: 0,
    face: t === 0 ? -runtime.player.face : runtime.player.face,
    g: false,
    co: 0,
    jb: 0,
    type: t,
    ttl: Infinity,
    jumped: 0,
    w: PLAYER_W,
    h: PLAYER_H,
  };
  let n = 0;
  while (collide(b) && n < 6) {
    b.y -= TILE;
    n++;
  }
  if (collide(b)) {
    playSfx('fail');
    showMessage('Pas de place pour le clone ici');
    return;
  }
  runtime.echoClone = b;
  playSfx('clone');
}
export function useEcho() {
  const t = gameState.selectedEcho;
  if (!gameState.echoesOwned[t]) {
    showMessage("Tu n'as pas encore d'écho");
    return;
  }
  if (t <= 2) {
    if (runtime.echoClone) {
      runtime.echoClone = null;
      gameState.echoCooldown = 0.5;
      playSfx('off');
      return;
    }
    if (gameState.echoCooldown > 0) return;
    spawn(t);
    return;
  }
  if (t === 3) {
    if (runtime.player.big) {
      setSize(runtime.player, PLAYER_W, PLAYER_H);
      runtime.player.big = 0;
      gameState.echoCooldown = 0.6;
      playSfx('off');
      return;
    }
    if (gameState.echoCooldown > 0) return;
    const old = {
      x: runtime.player.x,
      y: runtime.player.y,
      w: runtime.player.w,
      h: runtime.player.h,
    };
    setSize(runtime.player, GIANT_W, GIANT_H);
    if (collide(runtime.player)) {
      runtime.player.x = old.x;
      runtime.player.y = old.y;
      runtime.player.w = old.w;
      runtime.player.h = old.h;
      playSfx('fail');
      showMessage('Pas la place pour grossir ici');
      return;
    }
    runtime.player.big = 1;
    runtime.player.bigT = 10;
    playSfx('clone');
    return;
  }
  if (t === 4) {
    if (runtime.player.dcd > 0) return;
    runtime.player.dd = input.l ? -1 : input.r ? 1 : runtime.player.face;
    runtime.player.dash = 0.16;
    runtime.player.dcd = 0.9;
    playSfx('dash');
  }
}
function liveSwap(t) {
  if (!gameState.echoesOwned[t] || t === runtime.echoClone.type || (t !== 0 && t !== 2)) return false;
  runtime.echoClone.type = t;
  if (gameState.selectedEcho <= 2) gameState.selectedEcho = t;
  playSfx('clone');
  return true;
}
// avec un clone actif : 1 / 3 = échanger Miroir <-> Jumeau (ou renvoyer le clone si c'est le même), 4 / 5 = choisir un autre pouvoir, utilisable en même temps
export function pick(t) {
  if (!gameState.echoesOwned[t]) return;
  if (runtime.echoClone) {
    if (t === 0 || t === 2) {
      if (runtime.echoClone.type === 1) return;
      if (t === runtime.echoClone.type) {
        runtime.echoClone = null;
        gameState.echoCooldown = 0.5;
        playSfx('off');
        return;
      }
      liveSwap(t);
      return;
    }
    if (t >= 3) {
      gameState.selectedEcho = t;
      playSfx('tick');
    }
    return;
  }
  gameState.selectedEcho = t;
  playSfx('tick');
}
export function cycle() {
  if (
    runtime.echoClone &&
    runtime.echoClone.type !== 1 &&
    gameState.echoesOwned[0] &&
    gameState.echoesOwned[2]
  ) {
    liveSwap(runtime.echoClone.type === 0 ? 2 : 0);
    return;
  }
  const o = ownedEchoes();
  if (!o.length) return;
  gameState.selectedEcho = o[(o.indexOf(gameState.selectedEcho) + 1) % o.length];
  playSfx('tick');
}

/* ---------- Coup de tête, ennemis, boss ---------- */
