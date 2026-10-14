import { runtime } from './runtime.js';
/* ---------- État ---------- */
export const GW = 13,
  GH = 10,
  HUB = 43,
  SAVEKEY = 'echo-4';
export const gameState = {
  slide: 0,
  sdir: 1,
  sv: 0,
  entryRoom: -1,
  entryRow: 13,
  vis: {},
  cl: {},
  anchAll: {},
  sol: {},
  bu: {},
  blue: {},
  seed: 0,
  name: '',
  called: 0,
  cur: HUB,
  entry: 'p',
  fade: 0,
  stA: 1,
  exA: 1,
  bkA: 0,
  bkT: 0,
  won: -1,
  mapFrom: 'pause',
  hp: 3,
  hpMax: 3,
  sh: 0,
  idle: 0,
  inv: 0,
  hcol: {},
  ic: 0,
  ph: 0,
  lost: 0,
  lostRank: 0,
  lt: 0,
  run: 0,
  newRec: 0,
  bmax: 0,
  page: 0,
  endInfo: null,
  anch: {},
  rst: 0,
  mode: 'title',
  lvl: HUB,
  have: [0, 0, 0, 0, 0, 0, 0],
  haveT: 0,
  hist: [],
  gauge: 10,
  cd: 0,
  sel: 0,
  time: 0,
  hintT: 0,
  flash: 0,
  shake: 0,
  winT: 0,
  rtarget: 1,
  free: 0,
  msg: '',
  msgT: 0,
  gainT: 0,
  gain: null,
  bedT: 0,
  victory: 0,
};
export const enemyTypes = {
  c: {
    w: 32,
    h: 24,
    spd: 70 * 2.5,
    hp: 1,
  },
  r: {
    w: 30,
    h: 46,
    spd: 70 * 0.8,
    hp: 5,
  },
  g: {
    w: 24,
    h: 34,
    spd: 70 * 1.5,
    hp: 99,
  },
};
runtime.CR = [];
runtime.crT = 0;
runtime.statue = null;
runtime.bed = null;
runtime.hearts = [];
runtime.level = undefined;
runtime.grid = undefined;
runtime.plates = undefined;
runtime.anchors = [];
runtime.ctm = {};
runtime.ents = undefined;
runtime.brokenLog = undefined;
runtime.open = {};
runtime.player = undefined;
runtime.echoClone = null;
runtime.spawnPt = undefined;
export const input = {
    l: 0,
    r: 0,
    u: 0,
    d: 0,
    jh: 0,
    jp: 0,
    js: 0,
  },
  actions = {
    r5: 0,
    r10: 0,
    cl: 0,
    cyc: 0,
    hit: 0,
    tir: 0,
  },
  IDLE = {
    l: 0,
    r: 0,
    u: 0,
    d: 0,
    jp: 0,
    jh: 0,
  };
export let INFO = true;
try {
  INFO = localStorage.getItem('echo-info') !== '0';
} catch (e) {}
export const say = (t, d = 1.8) => {
  if (!INFO && !say.force) return;
  gameState.msg = t;
  gameState.msgT = d;
};
say.force = 0;
export function setInfo(v) {
  INFO = !!v;
  try {
    localStorage.setItem('echo-info', INFO ? '1' : '0');
  } catch (e) {}
  if (INFO) {
    gameState.hintT = 0;
  } else {
    gameState.msgT = 0;
  }
  say.force = 1;
  say(INFO ? 'Infos activées (I pour les couper)' : 'Infos désactivées (I pour les remettre)', 2.2);
  say.force = 0;
}
export const fmt = (t) => {
  t = Math.max(0, t);
  const m = Math.floor(t / 60),
    s = t - m * 60;
  return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1);
};
export const owned = () => [0, 1, 2, 3, 4].filter((i) => gameState.have[i]);
export const bossAlive = () => runtime.ents.some((e) => e.k === 'b' && e.alive);
