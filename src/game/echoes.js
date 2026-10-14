import { runtime } from '../state/runtime.js';
import { PH0, PH1, PW0, PW1, T } from '../core/config.js';
import { gameState, input, owned, say } from '../state/state.js';
import { collide } from './physics.js';
import { sfx } from '../audio/audio.js';
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
    const idx = Math.max(0, gameState.hist.length - 240),
      e = gameState.hist[idx],
      p = {
        ...e.p,
      };
    if (p.w !== PW0) {
      setSize(p, PW0, PH0);
    }
    p.hit = 0;
    p.dash = 0;
    runtime.echoClone = {
      ...p,
      type: 1,
      ttl: 8,
      k: 0,
      inp: gameState.hist.slice(idx).map((h) => h.i),
    };
    sfx('clone');
    return;
  }
  const b = {
    x: t === 0 ? 2 * 480 - runtime.player.x - PW0 : runtime.player.x + 96 * runtime.player.face,
    y: runtime.player.y + runtime.player.h - PH0,
    vx: 0,
    vy: 0,
    face: t === 0 ? -runtime.player.face : runtime.player.face,
    g: false,
    co: 0,
    jb: 0,
    type: t,
    ttl: Infinity,
    jumped: 0,
    w: PW0,
    h: PH0,
  };
  let n = 0;
  while (collide(b) && n < 6) {
    b.y -= T;
    n++;
  }
  if (collide(b)) {
    sfx('fail');
    say('Pas de place pour le clone ici');
    return;
  }
  runtime.echoClone = b;
  sfx('clone');
}
export function useEcho() {
  const t = gameState.sel;
  if (!gameState.have[t]) {
    say("Tu n'as pas encore d'écho");
    return;
  }
  if (t <= 2) {
    if (runtime.echoClone) {
      runtime.echoClone = null;
      gameState.cd = 0.5;
      sfx('off');
      return;
    }
    if (gameState.cd > 0) return;
    spawn(t);
    return;
  }
  if (t === 3) {
    if (runtime.player.big) {
      setSize(runtime.player, PW0, PH0);
      runtime.player.big = 0;
      gameState.cd = 0.6;
      sfx('off');
      return;
    }
    if (gameState.cd > 0) return;
    const old = {
      x: runtime.player.x,
      y: runtime.player.y,
      w: runtime.player.w,
      h: runtime.player.h,
    };
    setSize(runtime.player, PW1, PH1);
    if (collide(runtime.player)) {
      runtime.player.x = old.x;
      runtime.player.y = old.y;
      runtime.player.w = old.w;
      runtime.player.h = old.h;
      sfx('fail');
      say('Pas la place pour grossir ici');
      return;
    }
    runtime.player.big = 1;
    runtime.player.bigT = 10;
    sfx('clone');
    return;
  }
  if (t === 4) {
    if (runtime.player.dcd > 0) return;
    runtime.player.dd = input.l ? -1 : input.r ? 1 : runtime.player.face;
    runtime.player.dash = 0.16;
    runtime.player.dcd = 0.9;
    sfx('dash');
  }
}
function liveSwap(t) {
  if (!gameState.have[t] || t === runtime.echoClone.type || (t !== 0 && t !== 2)) return false;
  runtime.echoClone.type = t;
  if (gameState.sel <= 2) gameState.sel = t;
  sfx('clone');
  return true;
}
// avec un clone actif : 1 / 3 = échanger Miroir <-> Jumeau (ou renvoyer le clone si c'est le même), 4 / 5 = choisir un autre pouvoir, utilisable en même temps
export function pick(t) {
  if (!gameState.have[t]) return;
  if (runtime.echoClone) {
    if (t === 0 || t === 2) {
      if (runtime.echoClone.type === 1) return;
      if (t === runtime.echoClone.type) {
        runtime.echoClone = null;
        gameState.cd = 0.5;
        sfx('off');
        return;
      }
      liveSwap(t);
      return;
    }
    if (t >= 3) {
      gameState.sel = t;
      sfx('tick');
    }
    return;
  }
  gameState.sel = t;
  sfx('tick');
}
export function cycle() {
  if (runtime.echoClone && runtime.echoClone.type !== 1 && gameState.have[0] && gameState.have[2]) {
    liveSwap(runtime.echoClone.type === 0 ? 2 : 0);
    return;
  }
  const o = owned();
  if (!o.length) return;
  gameState.sel = o[(o.indexOf(gameState.sel) + 1) % o.length];
  sfx('tick');
}

/* ---------- Coup de tête, ennemis, boss ---------- */
