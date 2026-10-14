import { levels } from '../data/levels.js';
import { HUB, SAVEKEY, gameState } from './state.js';
import { buildWorld } from '../world/world.js';
import { load, pickBlue } from '../world/rooms.js';
import { showNameInput } from '../ui/hud.js';
export const scores = {
  best: {},
  runs: [],
  over: [],
};
export function saveScores() {
  try {
    localStorage.setItem('echo-scores', JSON.stringify(scores));
  } catch (e) {}
}
function loadScores() {
  try {
    const d = JSON.parse(localStorage.getItem('echo-scores') || 'null');
    if (d) {
      scores.best = d.best || {};
      scores.runs = d.runs || [];
      scores.over = d.over || [];
    }
  } catch (e) {}
}
export function save() {
  if (gameState.trial) return;
  try {
    localStorage.setItem(
      SAVEKEY,
      JSON.stringify({
        h: gameState.have,
        t: gameState.haveT,
        r: gameState.run,
        hp: gameState.hp,
        sh: gameState.sh,
        g: gameState.gauge,
        v: gameState.vis,
        cl: gameState.cl,
        aa: gameState.anchAll,
        so: gameState.sol,
        bu: gameState.bu,
        bl: gameState.blue,
        sd: gameState.seed,
        hc: gameState.hcol,
        cur: gameState.cur,
        ca: gameState.called,
        ck: gameState.ck,
        dh: gameState.deaths,
      }),
    );
  } catch (e) {}
}
function newGame() {
  gameState.seed = ((Date.now() % 1e9) ^ Math.floor(Math.random() * 1e9)) | 0;
  buildWorld(gameState.seed);
  gameState.blue = pickBlue(gameState.seed);
}
export function loadSave() {
  let ok = false;
  try {
    const d = JSON.parse(localStorage.getItem(SAVEKEY) || 'null');
    if (d && d.bl) {
      ok = true;
      gameState.have = (d.h || gameState.have).concat([0, 0, 0, 0, 0, 0, 0]).slice(0, 7);
      gameState.haveT = d.t | 0;
      gameState.run = +d.r || 0;
      gameState.hpMax = 3;
      gameState.hp = d.hp > 0 ? Math.min(gameState.hpMax, +d.hp) : gameState.hpMax;
      gameState.sh = Math.max(0, Math.min(6, +d.sh || 0));
      gameState.gauge = Math.max(0, Math.min(10, d.g === undefined ? 10 : +d.g));
      gameState.vis = d.v || {};
      gameState.cl = d.cl || {};
      gameState.anchAll = d.aa || {};
      gameState.sol = d.so || {};
      gameState.bu = d.bu || {};
      gameState.blue = d.bl || {};
      gameState.seed = d.sd | 0;
      gameState.hcol = d.hc || {};
      gameState.called = d.ca | 0;
      gameState.ck = d.ck === undefined ? undefined : d.ck | 0;
      gameState.deaths = d.dh | 0;
      buildWorld(gameState.seed);
      gameState.cur = Math.min(levels.length - 1, Math.max(0, d.cur | 0));
    }
  } catch (e) {
    ok = false;
  }
  if (!ok) newGame();
  loadScores();
}
export function clearSave() {
  try {
    localStorage.removeItem(SAVEKEY);
  } catch (e) {}
}
export function resetAll() {
  clearSave();
  gameState.victory = 0;
  gameState.ph = 0;
  showNameInput(false);
  gameState.lost = 0;
  gameState.lt = 0;
  gameState.run = 0;
  gameState.hpMax = 3;
  gameState.hp = 3;
  gameState.sh = 0;
  gameState.idle = 0;
  gameState.gauge = 10;
  gameState.hcol = {};
  gameState.vis = {};
  gameState.cl = {};
  gameState.anchAll = {};
  gameState.sol = {};
  gameState.bu = {};
  gameState.called = 0;
  gameState.ck = undefined;
  gameState.deaths = 0;
  gameState.cur = HUB;
  gameState.have = [0, 0, 0, 0, 0, 0, 0];
  gameState.haveT = 0;
  gameState.sel = 0;
  gameState.rst = 0;
  gameState.name = '';
  newGame();
  load(HUB);
  gameState.mode = 'title';
}
