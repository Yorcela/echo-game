import { runtime } from '../state/runtime.js';
import { H, W } from '../core/config.js';
import { canvas } from '../core/canvas.js';
import { levels } from '../data/levels.js';
import { HUB, IDLE, gameState, input, say } from '../state/state.js';
import { clearSave, save } from '../state/save.js';
import { NF } from '../world/world.js';
import { load } from '../world/rooms.js';
import { updDoors } from './physics.js';
import { sfx } from '../audio/audio.js';
import { showNameInput } from '../ui/hud.js';
import { endTrial } from '../ui/screens.js';
export const snap = () => ({
  p: {
    ...runtime.player,
  },
  c: runtime.echoClone
    ? {
        ...runtime.echoClone,
      }
    : null,
  pt: runtime.plates.map((p) => p.t),
  en: runtime.ents.map((e) => ({
    ...e,
  })),
  br: runtime.brokenLog.length,
  ct: {
    ...runtime.ctm,
  },
  i: {
    ...(snap.inp || IDLE),
  },
});
export function restore(e) {
  runtime.shots = [];
  runtime.player = {
    ...e.p,
  };
  runtime.echoClone = e.c
    ? {
        ...e.c,
      }
    : null;
  runtime.plates.forEach((p, i) => {
    p.t = e.pt[i];
    p.was = p.t > 0 ? 1 : 0;
  });
  runtime.ents = e.en.map((x) => ({
    ...x,
  }));
  runtime.ctm = {
    ...e.ct,
  };
  while (runtime.brokenLog.length > e.br) {
    const [c, r, ch] = runtime.brokenLog.pop();
    runtime.grid[r][c] = ch;
  }
  updDoors();
}

/* ---------- Physique ---------- */
/* ---------- Temps : rembobinage et mort ---------- */
export function startRewind(sec, free) {
  if (gameState.mode !== 'play') return;
  if (!gameState.haveT) {
    say('Écho du Temps pas encore gagné');
    return;
  }
  if (!free && gameState.gauge < sec - 1e-6) {
    sfx('fail');
    gameState.flash = -1;
    return;
  }
  if (gameState.hist.length <= 2) return;
  if (!free) gameState.gauge -= sec;
  gameState.mode = 'rewind';
  gameState.free = free ? 1 : 0;
  gameState.rtarget = Math.max(1, gameState.hist.length - sec * 60);
  gameState.rwStart = gameState.time;
  gameState.rExt = 0;
  sfx('rewind');
}
export function extendRewind() {
  // 2e appui rapide sur R pendant le retour : 5 s de plus (10 s au total)
  if (
    gameState.mode !== 'rewind' ||
    gameState.free ||
    gameState.rExt ||
    gameState.time - gameState.rwStart > 0.8 ||
    gameState.gauge < 5 - 1e-6 ||
    gameState.rtarget <= 1
  )
    return;
  gameState.gauge -= 5;
  gameState.rtarget = Math.max(1, gameState.rtarget - 300);
  gameState.rExt = 1;
  sfx('rewind');
}
export function rewindFrame(dt) {
  const pops = Math.max(1, Math.round(dt * 60 * 5));
  for (let i = 0; i < pops && gameState.hist.length > gameState.rtarget; i++) {
    restore(gameState.hist.pop());
  }
  gameState.hist[gameState.hist.length - 1] && restore(gameState.hist[gameState.hist.length - 1]);
  if (gameState.hist.length <= gameState.rtarget) {
    gameState.mode = 'play';
    input.jp = 0;
    sfx('rewindEnd');
  }
}
function respawn() {
  const k = gameState.ck !== undefined && levels[gameState.ck] ? gameState.ck : HUB;
  gameState.deaths = (gameState.deaths | 0) + 1;
  gameState.hp = gameState.hpMax;
  gameState.sh = 0;
  gameState.gauge = 10;
  gameState.idle = 0;
  gameState.inv = 1.8;
  gameState.mode = 'play';
  input.l = input.r = input.jh = input.u = input.d = 0;
  input.jp = 0;
  gameState.fade = 0.8;
  load(k, 'p');
  gameState.inv = 1.8;
  save();
  say(
    'Tu es tombé : retour à la dernière statue. Le chrono, lui, continue (' +
      gameState.deaths +
      ' chute' +
      (gameState.deaths > 1 ? 's' : '') +
      ').',
    4,
  );
}
export function gameOver() {
  if (gameState.trial) {
    endTrial();
    say('Essai terminé : ta partie est intacte.', 2.5);
    return;
  }
  gameState.mode = 'over';
  gameState.ph = 0;
  gameState.name = '';
  gameState.lost = Object.keys(gameState.vis).length;
  gameState.lostRank = 0;
  gameState.victory = 0;
  clearSave();
  showNameInput(true);
}

// dégâts : amt en cœurs (¼ crabe, ½ colosse/rebelle/pics/chute, ¾ fantôme, 1 boss). haz = pics ou chute : on repart en arrière.
const PN = ['Miroir', 'Rémanence', 'Jumeau', 'Colosse', 'Éclair', 'Double saut', 'Tir'];
export function gateMsg(k) {
  const g = k.gate;
  if (g.cl !== undefined) return "Scellé : il faut d'abord vaincre « " + levels[g.cl].name + ' ».';
  if (g.t) return "Scellé : il te faut l'Écho du Temps.";
  if (g.pw !== undefined) return 'Scellé : il te faut « ' + PN[g.pw] + ' ».';
  if (g.all) return 'Scellé : il faut ' + g.all.map((p) => PN[p]).join(' ET ') + '.';
  if (g.any) return 'Scellé : il faut ' + g.any.map((p) => PN[p]).join(' ou ') + '.';
  return 'Scellé.';
}
export function hurtP(amt, haz, sx) {
  sfx('death');
  gameState.shake = 0.35;
  gameState.idle = 0;
  const fatal = amt >= gameState.hp + gameState.sh - 1e-6;
  if (fatal) {
    if (gameState.haveT && gameState.gauge >= 5 - 1e-6 && gameState.hist.length > 2) {
      gameState.gauge = Math.max(0, gameState.gauge - 5);
      gameState.inv = 1.8;
      gameState.mode = 'rewind';
      gameState.free = 1;
      gameState.rtarget = Math.max(1, gameState.hist.length - 300);
      save();
      say('Le Temps te sauve ! Coup mortel annulé : 5 s de retour arrière consommées pour de bon', 3.4);
      return;
    }
    if (gameState.trial) {
      gameState.hp = 0;
      gameState.sh = 0;
      gameOver();
      return;
    }
    respawn();
    return;
  }
  let a = amt;
  if (gameState.sh > 0) {
    const t = Math.min(gameState.sh, a);
    gameState.sh -= t;
    a -= t;
  }
  gameState.hp = Math.max(0.01, gameState.hp - a);
  save();
  gameState.inv = 1.4;
  if (haz) {
    const n = gameState.hist.length;
    if (!gameState.haveT || n <= 40) {
      load(gameState.lvl, gameState.entry, gameState.entryRoom, gameState.entryRow);
      gameState.inv = 1.4;
      return;
    }
    gameState.mode = 'rewind';
    gameState.free = 1;
    gameState.rtarget = Math.max(1, n - 150);
    say('Aïe ! Le temps repart 2 secondes avant', 2);
  } else {
    const d = runtime.player.x + runtime.player.w / 2 < sx ? -1 : 1;
    runtime.player.vx = d * 300;
    runtime.player.vy = -300;
    runtime.player.g = false;
    runtime.player.lock = 0.2;
  }
}
export function doSleep() {
  gameState.ck = gameState.lvl;
  gameState.hp = gameState.hpMax;
  gameState.gauge = 10;
  gameState.idle = 0;
  gameState.run += 20;
  gameState.bedT = 2.4;
  gameState.fade = 0.55;
  gameState.mode = 'play';
  input.jp = 0;
  sfx('win');
  save();
  say('Tu as dormi : cœurs et Temps rechargés (+20 s au chrono).', 3.5);
}
function win0() {
  gameState.won = gameState.lvl;
  sfx('win');
  save();
}
export function win() {
  win0();
  gameState.victory = 1;
  gameState.mode = 'over';
  gameState.ph = 0;
  gameState.lost = Object.keys(gameState.vis).length;
  gameState.lostRank = 0;
  clearSave();
  showNameInput(true);
}
export const snapCv = document.createElement('canvas');
snapCv.width = W;
snapCv.height = H;
export function go(k, row) {
  if (k.fwd) {
    gameState.sol[gameState.lvl] = 1;
    if (NF) win0();
  }
  snapCv.getContext('2d').drawImage(canvas, 0, 0);
  const from = gameState.lvl;
  load(k.to, 'X', from, row);
  gameState.slide = 0.4;
  gameState.sdir = k.s === 'r' ? 1 : k.s === 'l' ? -1 : 0;
  gameState.sv = k.s === 'b' ? 1 : k.s === 't' ? -1 : 0;
  save();
}

/* ---------- Pas de simulation (60 Hz fixe) ---------- */
