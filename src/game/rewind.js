import { runtime } from '../state/runtime.ts';
import { HEIGHT, WIDTH } from '../core/config.ts';
import { canvas } from '../core/canvas.ts';
import { levels } from '../data/levels.js';
import { HUB_ROOM, IDLE, gameState, input, showMessage } from '../state/state.ts';
import { clearSave, saveGame } from '../state/save.js';
import { NO_FLIP } from '../world/world.js';
import { loadRoom } from '../world/rooms.js';
import { updateDoors } from './physics.js';
import { playSfx } from '../audio/audio.js';
import { showNameInput } from '../ui/hud.js';
import { endTrial } from '../ui/screens.js';
export const takeSnapshot = () => ({
  p: {
    ...runtime.player,
  },
  c: runtime.echoClone
    ? {
        ...runtime.echoClone,
      }
    : null,
  pt: runtime.plates.map((p) => p.t),
  en: runtime.entities.map((entity) => ({
    ...entity,
  })),
  br: runtime.brokenTilesLog.length,
  ct: {
    ...runtime.crumbleTileTimers,
  },
  i: {
    ...(takeSnapshot.inp || IDLE),
  },
});
export function restoreSnapshot(snapshot) {
  runtime.shots = [];
  runtime.player = {
    ...snapshot.p,
  };
  runtime.echoClone = snapshot.c
    ? {
        ...snapshot.c,
      }
    : null;
  runtime.plates.forEach((p, i) => {
    p.t = snapshot.pt[i];
    p.was = p.t > 0 ? 1 : 0;
  });
  runtime.entities = snapshot.en.map((x) => ({
    ...x,
  }));
  runtime.crumbleTileTimers = {
    ...snapshot.ct,
  };
  while (runtime.brokenTilesLog.length > snapshot.br) {
    const [c, r, ch] = runtime.brokenTilesLog.pop();
    runtime.grid[r][c] = ch;
  }
  updateDoors();
}

/* ---------- Physique ---------- */
/* ---------- Temps : rembobinage et mort ---------- */
export function startRewind(sec, free) {
  if (gameState.mode !== 'play') return;
  if (!gameState.hasTimeEcho) {
    showMessage('Écho du Temps pas encore gagné');
    return;
  }
  if (!free && gameState.gauge < sec - 1e-6) {
    playSfx('fail');
    gameState.flash = -1;
    return;
  }
  if (gameState.history.length <= 2) return;
  if (!free) gameState.gauge -= sec;
  gameState.mode = 'rewind';
  gameState.freeRewind = free ? 1 : 0;
  gameState.rewindTargetFrame = Math.max(1, gameState.history.length - sec * 60);
  gameState.rewindStartTime = gameState.time;
  gameState.rewindExtended = 0;
  playSfx('rewind');
}
export function extendRewind() {
  // 2e appui rapide sur R pendant le retour : 5 s de plus (10 s au total)
  if (
    gameState.mode !== 'rewind' ||
    gameState.freeRewind ||
    gameState.rewindExtended ||
    gameState.time - gameState.rewindStartTime > 0.8 ||
    gameState.gauge < 5 - 1e-6 ||
    gameState.rewindTargetFrame <= 1
  )
    return;
  gameState.gauge -= 5;
  gameState.rewindTargetFrame = Math.max(1, gameState.rewindTargetFrame - 300);
  gameState.rewindExtended = 1;
  playSfx('rewind');
}
export function rewindFrame(dt) {
  const pops = Math.max(1, Math.round(dt * 60 * 5));
  for (let i = 0; i < pops && gameState.history.length > gameState.rewindTargetFrame; i++) {
    restoreSnapshot(gameState.history.pop());
  }
  gameState.history[gameState.history.length - 1] &&
    restoreSnapshot(gameState.history[gameState.history.length - 1]);
  if (gameState.history.length <= gameState.rewindTargetFrame) {
    gameState.mode = 'play';
    input.jp = 0;
    playSfx('rewindEnd');
  }
}
function respawn() {
  const k =
    gameState.checkpointRoom !== undefined && levels[gameState.checkpointRoom]
      ? gameState.checkpointRoom
      : HUB_ROOM;
  gameState.deaths = (gameState.deaths | 0) + 1;
  gameState.hp = gameState.hpMax;
  gameState.shieldHearts = 0;
  gameState.gauge = 10;
  gameState.idleTime = 0;
  gameState.invulnerableTimer = 1.8;
  gameState.mode = 'play';
  input.l = input.r = input.jh = input.u = input.d = 0;
  input.jp = 0;
  gameState.fade = 0.8;
  loadRoom(k, 'p');
  gameState.invulnerableTimer = 1.8;
  saveGame();
  showMessage(
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
    showMessage('Essai terminé : ta partie est intacte.', 2.5);
    return;
  }
  gameState.mode = 'over';
  gameState.overPhase = 0;
  gameState.name = '';
  gameState.exploredAtEnd = Object.keys(gameState.visitedRooms).length;
  gameState.leaderboardRank = 0;
  gameState.victory = 0;
  clearSave();
  showNameInput(true);
}

// dégâts : amt en cœurs (¼ crabe, ½ colosse/rebelle/pics/chute, ¾ fantôme, 1 boss). haz = pics ou chute : on repart en arrière.
const ECHO_NAMES = ['Miroir', 'Rémanence', 'Jumeau', 'Colosse', 'Éclair', 'Double saut', 'Tir'];
export function gateMessage(k) {
  const g = k.gate;
  if (g.cl !== undefined) return "Scellé : il faut d'abord vaincre « " + levels[g.cl].name + ' ».';
  if (g.t) return "Scellé : il te faut l'Écho du Temps.";
  if (g.pw !== undefined) return 'Scellé : il te faut « ' + ECHO_NAMES[g.pw] + ' ».';
  if (g.all) return 'Scellé : il faut ' + g.all.map((p) => ECHO_NAMES[p]).join(' ET ') + '.';
  if (g.any) return 'Scellé : il faut ' + g.any.map((p) => ECHO_NAMES[p]).join(' ou ') + '.';
  return 'Scellé.';
}
export function hurtPlayer(amt, haz, sx) {
  playSfx('death');
  gameState.shake = 0.35;
  gameState.idleTime = 0;
  const fatal = amt >= gameState.hp + gameState.shieldHearts - 1e-6;
  if (fatal) {
    if (gameState.hasTimeEcho && gameState.gauge >= 5 - 1e-6 && gameState.history.length > 2) {
      gameState.gauge = Math.max(0, gameState.gauge - 5);
      gameState.invulnerableTimer = 1.8;
      gameState.mode = 'rewind';
      gameState.freeRewind = 1;
      gameState.rewindTargetFrame = Math.max(1, gameState.history.length - 300);
      saveGame();
      showMessage(
        'Le Temps te sauve ! Coup mortel annulé : 5 s de retour arrière consommées pour de bon',
        3.4,
      );
      return;
    }
    if (gameState.trial) {
      gameState.hp = 0;
      gameState.shieldHearts = 0;
      gameOver();
      return;
    }
    respawn();
    return;
  }
  let a = amt;
  if (gameState.shieldHearts > 0) {
    const t = Math.min(gameState.shieldHearts, a);
    gameState.shieldHearts -= t;
    a -= t;
  }
  gameState.hp = Math.max(0.01, gameState.hp - a);
  saveGame();
  gameState.invulnerableTimer = 1.4;
  if (haz) {
    const n = gameState.history.length;
    if (!gameState.hasTimeEcho || n <= 40) {
      loadRoom(gameState.loadedRoom, gameState.entry, gameState.entryRoom, gameState.entryRow);
      gameState.invulnerableTimer = 1.4;
      return;
    }
    gameState.mode = 'rewind';
    gameState.freeRewind = 1;
    gameState.rewindTargetFrame = Math.max(1, n - 150);
    showMessage('Aïe ! Le temps repart 2 secondes avant', 2);
  } else {
    const d = runtime.player.x + runtime.player.w / 2 < sx ? -1 : 1;
    runtime.player.vx = d * 300;
    runtime.player.vy = -300;
    runtime.player.g = false;
    runtime.player.lock = 0.2;
  }
}
export function sleepInBed() {
  gameState.checkpointRoom = gameState.loadedRoom;
  gameState.hp = gameState.hpMax;
  gameState.gauge = 10;
  gameState.idleTime = 0;
  gameState.runTime += 20;
  gameState.bedFadeTimer = 2.4;
  gameState.fade = 0.55;
  gameState.mode = 'play';
  input.jp = 0;
  playSfx('win');
  saveGame();
  showMessage('Tu as dormi : cœurs et Temps rechargés (+20 s au chrono).', 3.5);
}
function markRoomWon() {
  gameState.wonRoom = gameState.loadedRoom;
  playSfx('win');
  saveGame();
}
export function winRoom() {
  markRoomWon();
  gameState.victory = 1;
  gameState.mode = 'over';
  gameState.overPhase = 0;
  gameState.exploredAtEnd = Object.keys(gameState.visitedRooms).length;
  gameState.leaderboardRank = 0;
  clearSave();
  showNameInput(true);
}
export const snapCv = document.createElement('canvas');
snapCv.width = WIDTH;
snapCv.height = HEIGHT;
export function goThroughLink(k, row) {
  if (k.fwd) {
    gameState.solvedRooms[gameState.loadedRoom] = 1;
    if (NO_FLIP) markRoomWon();
  }
  snapCv.getContext('2d').drawImage(canvas, 0, 0);
  const from = gameState.loadedRoom;
  loadRoom(k.to, 'X', from, row);
  gameState.slideTimer = 0.4;
  gameState.slideDirX = k.s === 'r' ? 1 : k.s === 'l' ? -1 : 0;
  gameState.slideDirY = k.s === 'b' ? 1 : k.s === 't' ? -1 : 0;
  saveGame();
}

/* ---------- Pas de simulation (60 Hz fixe) ---------- */
