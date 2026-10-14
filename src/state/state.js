import { runtime } from './runtime.js';
/* ---------- État ---------- */
export const MAP_COLS = 13,
  MAP_ROWS = 10,
  HUB_ROOM = 43,
  SAVEKEY = 'echo-4';
export const gameState = {
  slideTimer: 0,
  slideDirX: 1,
  slideDirY: 0,
  entryRoom: -1,
  entryRow: 13,
  visitedRooms: {},
  clearedBossRooms: {},
  anchorsByRoom: {},
  solvedRooms: {},
  usedBeds: {},
  blue: {},
  seed: 0,
  name: '',
  called: 0,
  cur: HUB_ROOM,
  entry: 'p',
  fade: 0,
  stA: 1,
  exA: 1,
  bkA: 0,
  bkT: 0,
  wonRoom: -1,
  mapOpenedFrom: 'pause',
  hp: 3,
  hpMax: 3,
  bonusHearts: 0,
  idleTime: 0,
  invulnerableTimer: 0,
  collectedHearts: {},
  ic: 0,
  overPhase: 0,
  exploredAtEnd: 0,
  leaderboardRank: 0,
  lt: 0,
  runTime: 0,
  newRecordKind: 0,
  bossMaxHp: 0,
  page: 0,
  endResult: null,
  roomAnchors: {},
  resetArmedTimer: 0,
  mode: 'title',
  lvl: HUB_ROOM,
  echoesOwned: [0, 0, 0, 0, 0, 0, 0],
  hasTimeEcho: 0,
  history: [],
  gauge: 10,
  echoCooldown: 0,
  selectedEcho: 0,
  time: 0,
  hintTimer: 0,
  flash: 0,
  shake: 0,
  winT: 0,
  rewindTargetFrame: 1,
  free: 0,
  message: '',
  messageTimer: 0,
  gainTimer: 0,
  gainedEcho: null,
  bedFadeTimer: 0,
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
runtime.crumbleTiles = [];
runtime.crumbleTimer = 0;
runtime.statue = null;
runtime.bed = null;
runtime.hearts = [];
runtime.level = undefined;
runtime.grid = undefined;
runtime.plates = undefined;
runtime.anchors = [];
runtime.crumbleTileTimers = {};
runtime.entities = undefined;
runtime.brokenTilesLog = undefined;
runtime.openDoors = {};
runtime.player = undefined;
runtime.echoClone = null;
runtime.spawnPoint = undefined;
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
export let infoEnabled = true;
try {
  infoEnabled = localStorage.getItem('echo-info') !== '0';
} catch (e) {}
export const showMessage = (t, d = 1.8) => {
  if (!infoEnabled && !showMessage.force) return;
  gameState.message = t;
  gameState.messageTimer = d;
};
showMessage.force = 0;
export function setInfoEnabled(v) {
  infoEnabled = !!v;
  try {
    localStorage.setItem('echo-info', infoEnabled ? '1' : '0');
  } catch (e) {}
  if (infoEnabled) {
    gameState.hintTimer = 0;
  } else {
    gameState.messageTimer = 0;
  }
  showMessage.force = 1;
  showMessage(
    infoEnabled ? 'Infos activées (I pour les couper)' : 'Infos désactivées (I pour les remettre)',
    2.2,
  );
  showMessage.force = 0;
}
export const formatTime = (t) => {
  t = Math.max(0, t);
  const m = Math.floor(t / 60),
    s = t - m * 60;
  return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1);
};
export const ownedEchoes = () => [0, 1, 2, 3, 4].filter((i) => gameState.echoesOwned[i]);
export const isBossAlive = () => runtime.entities.some((e) => e.k === 'b' && e.alive);
