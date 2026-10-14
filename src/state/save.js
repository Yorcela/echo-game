import { levels } from '../data/levels.js';
import { HUB_ROOM, SAVEKEY, gameState } from './state.js';
import { buildWorld } from '../world/build.js';
import { loadRoom, pickBlueHeartSpots } from '../world/rooms.js';
import { showNameInput } from '../ui/hud.js';
export const scores = {
  best: {},
  runs: [],
  over: [],
};
export function saveScores() {
  try {
    localStorage.setItem('echo-scores', JSON.stringify(scores));
  } catch (entity) {}
}
function loadScores() {
  try {
    const d = JSON.parse(localStorage.getItem('echo-scores') || 'null');
    if (d) {
      scores.best = d.best || {};
      scores.runs = d.runs || [];
      scores.over = d.over || [];
    }
  } catch (entity) {}
}
export function saveGame() {
  if (gameState.trial) return;
  try {
    localStorage.setItem(
      SAVEKEY,
      JSON.stringify({
        h: gameState.echoesOwned,
        t: gameState.hasTimeEcho,
        r: gameState.runTime,
        hp: gameState.hp,
        sh: gameState.shieldHearts,
        g: gameState.gauge,
        v: gameState.visitedRooms,
        cl: gameState.clearedBossRooms,
        aa: gameState.anchorsByRoom,
        so: gameState.solvedRooms,
        bu: gameState.usedBeds,
        bl: gameState.blueHeartSpots,
        sd: gameState.seed,
        hc: gameState.collectedHearts,
        cur: gameState.currentRoom,
        ck: gameState.checkpointRoom,
        dh: gameState.deaths,
      }),
    );
  } catch (entity) {}
}
function newGame() {
  gameState.seed = ((Date.now() % 1e9) ^ Math.floor(Math.random() * 1e9)) | 0;
  buildWorld(gameState.seed);
  gameState.blueHeartSpots = pickBlueHeartSpots(gameState.seed);
}
export function loadSavedGame() {
  let ok = false;
  try {
    const d = JSON.parse(localStorage.getItem(SAVEKEY) || 'null');
    if (d && d.bl) {
      ok = true;
      gameState.echoesOwned = (d.h || gameState.echoesOwned).concat([0, 0, 0, 0, 0, 0, 0]).slice(0, 7);
      gameState.hasTimeEcho = d.t | 0;
      gameState.runTime = +d.r || 0;
      gameState.hpMax = 3;
      gameState.hp = d.hp > 0 ? Math.min(gameState.hpMax, +d.hp) : gameState.hpMax;
      gameState.shieldHearts = Math.max(0, Math.min(6, +d.sh || 0));
      gameState.gauge = Math.max(0, Math.min(10, d.g === undefined ? 10 : +d.g));
      gameState.visitedRooms = d.v || {};
      gameState.clearedBossRooms = d.cl || {};
      gameState.anchorsByRoom = d.aa || {};
      gameState.solvedRooms = d.so || {};
      gameState.usedBeds = d.bu || {};
      gameState.blueHeartSpots = d.bl || {};
      gameState.seed = d.sd | 0;
      gameState.collectedHearts = d.hc || {};
      gameState.checkpointRoom = d.ck === undefined ? undefined : d.ck | 0;
      gameState.deaths = d.dh | 0;
      buildWorld(gameState.seed);
      gameState.currentRoom = Math.min(levels.length - 1, Math.max(0, d.cur | 0));
    }
  } catch (entity) {
    ok = false;
  }
  if (!ok) newGame();
  loadScores();
}
export function clearSave() {
  try {
    localStorage.removeItem(SAVEKEY);
  } catch (entity) {}
}
export function resetAll() {
  clearSave();
  gameState.victory = 0;
  gameState.overPhase = 0;
  showNameInput(false);
  gameState.exploredAtEnd = 0;
  gameState.roomTime = 0;
  gameState.runTime = 0;
  gameState.hpMax = 3;
  gameState.hp = 3;
  gameState.shieldHearts = 0;
  gameState.idleTime = 0;
  gameState.gauge = 10;
  gameState.collectedHearts = {};
  gameState.visitedRooms = {};
  gameState.clearedBossRooms = {};
  gameState.anchorsByRoom = {};
  gameState.solvedRooms = {};
  gameState.usedBeds = {};
  gameState.checkpointRoom = undefined;
  gameState.deaths = 0;
  gameState.currentRoom = HUB_ROOM;
  gameState.echoesOwned = [0, 0, 0, 0, 0, 0, 0];
  gameState.hasTimeEcho = 0;
  gameState.selectedEcho = 0;
  gameState.resetArmedTimer = 0;
  gameState.name = '';
  newGame();
  loadRoom(HUB_ROOM);
  gameState.mode = 'title';
}
