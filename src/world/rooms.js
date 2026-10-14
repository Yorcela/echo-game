import { runtime } from '../state/runtime.js';
import { HEIGHT, PLAYER_H, PLAYER_W, MOVE_SPEED, TILE, WIDTH } from '../core/config.js';
import { levels } from '../data/levels.js';
import { seededRandom } from './generator.js';
import { HUB_ROOM, enemyTypes, gameState, ownedEchoes, showMessage } from '../state/state.js';
import { kingArenaLevel, isKingReady } from './world.js';
import { takeSnapshot } from '../game/rewind.js';
import { collide, syncHoles, updateDoors } from '../game/physics.js';
/* ---------- cœurs ---------- */
const HEART_SPOTS = {
  'Alcôve du Colosse': [[24, 7]],
  "Alcôve de l'Éclair": [[24, 7]],
  'Les petites bêtes': [[20, 13]],
  'Le long chemin': [[25, 13]],
  'Ouvre-moi': [[17, 13]],
  "Deux pour le prix d'un": [[14, 13]],
  'Rempart et miroir': [[17, 13]],
  'Le long couloir': [[12, 13]],
  'Le poids du monde': [[11, 13]],
  'Géant et miroir': [[21, 13]],
  'Le grand saut': [[23, 13]],
  'Éclair, géant, jumeau': [[22, 13]],
};
// emplacements des cœurs bleus des salles écrites à la main (le reste vient des salles générées)
const BED_SPOT_BY_ROOM = {
  'Alcôve du Colosse': [24, 7],
  "Alcôve de l'Éclair": [24, 7],
  'Les petites bêtes': [6, 8],
  'Deux balcons': [12, 9],
  'Double plaque et mur': [9, 11],
};
// 10 % des salles contiennent un cœur bleu, tirées au hasard à chaque nouvelle partie
export function pickBlue(seed) {
  const rnd = seededRandom(seed),
    pool = [];
  for (const [nm, sp] of Object.entries(BED_SPOT_BY_ROOM)) {
    const i = levels.findIndex((l) => l.name === nm);
    if (i >= 0) pool.push([i, sp]);
  }
  levels.forEach((l, i) => {
    if (i > HUB_ROOM && l.hs && l.hs.length) pool.push([i, l.hs[Math.floor(rnd() * l.hs.length)]]);
  });
  for (let k = pool.length - 1; k > 0; k--) {
    const j = Math.floor(rnd() * (k + 1));
    [pool[k], pool[j]] = [pool[j], pool[k]];
  }
  const out = {};
  for (const [i, sp] of pool.slice(0, Math.round(levels.length / 10))) out[i] = sp;
  return out;
}
export const hasBed = (i) => !!levels[i].bench;
export function loadRoom(i, from = 'p', fromRoom = -1, frow = 13) {
  const seen = !!gameState.visitedRooms[i];
  gameState.visitedRooms[i] = 1;
  gameState.cur = i;
  gameState.entry = from;
  gameState.entryRoom = fromRoom;
  gameState.entryRow = frow;
  runtime.level = i === HUB_ROOM && isKingReady() ? kingArenaLevel() : levels[i];
  gameState.lvl = i;
  runtime.grid = runtime.level.rows.map((r) => r.split(''));
  runtime.plates = [];
  runtime.anchors = [];
  runtime.crumbleTileTimers = {};
  gameState.roomAnchors = gameState.anchorsByRoom[i] || (gameState.anchorsByRoom[i] = {});
  runtime.entities = [];
  runtime.brokenTilesLog = [];
  runtime.bed = null;
  if (gameState.solvedRooms[i] && !runtime.level.king && !runtime.level.gen) {
    // salle déjà résolue : portes, plaques et murs fissurés ne gênent plus
    const pl = new Set((runtime.level.plug ? runtime.level.plug.cells : []).map(([r, c]) => r * 30 + c));
    for (let r = 0; r < 17; r++)
      for (let c = 0; c < 30; c++) {
        const ch = runtime.grid[r][c];
        if (pl.has(r * 30 + c)) continue;
        if (
          (ch >= 'A' && ch <= 'Z' && ch !== 'E' && ch !== 'P') ||
          (ch >= 'a' && ch <= 'z') ||
          ch === '%' ||
          ch === '&' ||
          ch === '1' ||
          ch === '2' ||
          ch === '3'
        )
          runtime.grid[r][c] = '.';
      }
  }
  for (let r = 0; r < 17; r++)
    for (let c = 0; c < 30; c++) {
      const ch = runtime.grid[r][c];
      if (ch === 'P') {
        runtime.spawnPoint = {
          x: c * TILE + (TILE - PLAYER_W) / 2,
          y: (r + 1) * TILE - PLAYER_H,
        };
        runtime.grid[r][c] = '.';
      } else if (ch === '=') {
        runtime.bed = {
          x: c * TILE + TILE / 2,
          y: (r + 1) * TILE,
          c,
          r,
        };
        runtime.grid[r][c] = '.';
      } else if (ch === '1' || ch === '2' || ch === '3') {
        runtime.anchors.push({
          c,
          r,
          id: ch,
        });
      } else if (ch >= 'a' && ch <= 'z') {
        runtime.plates.push({
          c,
          r,
          id: ch,
          t: 0,
          was: 0,
        });
      } else if (ch === '*' || ch === '+' || ch === '!' || ch === '?') {
        const t = ch === '!' ? 'r' : ch === '?' ? 'g' : 'c',
          D = enemyTypes[t];
        runtime.entities.push({
          k: 'w',
          t,
          x: c * TILE + (TILE - D.w) / 2,
          y: (r + 1) * TILE - D.h - (t === 'g' ? 8 : 0),
          x0: c * TILE + (TILE - D.w) / 2,
          y0: (r + 1) * TILE - D.h - 8,
          vx: 0,
          vy: 0,
          face: 1,
          g: false,
          co: 0,
          jb: 0,
          w: D.w,
          h: D.h,
          spd: D.spd,
          hp: D.hp,
          inv: 0,
          alive: 1,
          dir: 1,
          ph: c * 1.7,
        });
        runtime.grid[r][c] = '.';
      } else if (ch === '@' || ch === '$') {
        const B = runtime.level.boss,
          bw = B.w || 42,
          bh = B.h || 50,
          wing = B.kind === 'wing',
          tw = B.kind === 'twin';
        if (!gameState.clearedBossRooms[i] && !(tw && ch === '$'))
          runtime.entities.push({
            k: 'b',
            join: tw ? 1 : 0,
            spr: 'twin-b',
            x: tw ? 23 * TILE - bw / 2 : c * TILE + TILE / 2 - bw / 2,
            y: (r + 1) * TILE - bh,
            vx: 0,
            vy: 0,
            face: -1,
            g: false,
            co: 0,
            jb: 0,
            w: bw,
            h: bh,
            alive: 1,
            id: ch === '$' ? 1 : 0,
            hp: B.hp,
            st: wing ? 'hover' : 'idle',
            fly: wing ? 1 : 0,
            ph: 0,
            t: ch === '$' ? 2.6 : 1.4,
            inv: 0,
            n: ch === '$' ? 1 : 0,
            dirc: 1,
            combo: 0,
            dn: 0,
          });
        runtime.grid[r][c] = '.';
      }
    }
  runtime.crumbleTiles = [];
  runtime.crumbleTimer = 0;
  for (let r = 0; r < 17; r++)
    for (let c = 0; c < 30; c++) if (runtime.grid[r][c] === '~') runtime.crumbleTiles.push([c, r]);
  runtime.shots = [];
  runtime.player = {
    x: runtime.spawnPoint.x,
    y: runtime.spawnPoint.y,
    vx: 0,
    vy: 0,
    face: 1,
    g: false,
    co: 0,
    jb: 0,
    jumped: 0,
    w: PLAYER_W,
    h: PLAYER_H,
    big: 0,
    bigT: 0,
    hit: 0,
    hcd: 0,
    dash: 0,
    dcd: 0,
    dd: 1,
    fly: gameState.echoesOwned[5] ? 1 : 0,
    flyT: 0,
    dj: 1,
    lad: 0,
    ladCd: 0,
  };
  runtime.echoClone = null;
  gameState.stA = 1;
  gameState.sealed = 0;
  runtime.sealedTiles = [];
  gameState.gateUpAt = -9;
  gameState.perch = 0;
  runtime.colossusFloor = {
    cnt: [],
    rise: [],
    last: -1,
    fx: [],
  };
  runtime.knockbackTimer = 0;
  runtime.nukeCount = 0;
  if (runtime.level.plug && gameState.visitedRooms[runtime.level.plug.to])
    for (const [r, c] of runtime.level.plug.cells) runtime.grid[r][c] = '.';
  if (from === 'X') {
    const lk = runtime.level.links.find((k) => k.to === fromRoom) || runtime.level.links[0];
    if (lk.s === 'l' || lk.s === 'r') {
      const row = Math.max(lk.r0, Math.min(lk.r1, frow));
      runtime.player.x = lk.s === 'l' ? 6 : WIDTH - PLAYER_W - 6;
      runtime.player.y = (row + 1) * TILE - PLAYER_H;
      runtime.player.face = lk.s === 'l' ? 1 : -1;
      runtime.player.vx = (lk.s === 'l' ? 1 : -1) * MOVE_SPEED * 0.45;
      let t = 0;
      while (collide(runtime.player) && t < 17) {
        runtime.player.y -= TILE;
        t++;
      }
      if (t >= 17) {
        runtime.player.x = runtime.spawnPoint.x;
        runtime.player.y = runtime.spawnPoint.y;
      }
    } else if (lk.lad) {
      runtime.player.x = lk.c0 * TILE + (TILE - PLAYER_W) / 2;
      runtime.player.vx = 0;
      runtime.player.vy = 0;
      runtime.player.lad = 1;
      if (lk.s === 't') {
        runtime.player.y = -2;
      } else {
        runtime.player.y = HEIGHT - PLAYER_H - 2;
        runtime.player.g = false;
      }
    } else {
      runtime.player.x = Math.max(lk.c0 * TILE + 3, Math.min((lk.c1 + 1) * TILE - PLAYER_W - 3, frow));
      runtime.player.vx = 0;
      if (lk.s === 't') {
        runtime.player.y = 0;
        runtime.player.vy = 0;
      } else {
        runtime.player.y = HEIGHT - PLAYER_H;
        runtime.player.vy = -960;
        runtime.player.g = false;
        runtime.player.noVar = 1;
      }
    }
  }
  runtime.statue = null;
  if (hasBed(i) && !runtime.level.king) {
    const rP = Math.round((runtime.spawnPoint.y + PLAYER_H) / TILE) - 1,
      cP = Math.floor((runtime.spawnPoint.x + PLAYER_W / 2) / TILE);
    for (const d of [2, 3, -2, -3, 4, -4]) {
      const c = cP + d;
      if (
        runtime.grid[rP] &&
        runtime.grid[rP][c] === '.' &&
        runtime.grid[rP + 1] &&
        runtime.grid[rP + 1][c] === '#'
      ) {
        runtime.statue = {
          x: c * TILE + TILE / 2,
          y: (rP + 1) * TILE,
        };
        break;
      }
    }
    if (!runtime.statue)
      runtime.statue = {
        x: runtime.spawnPoint.x + PLAYER_W / 2,
        y: runtime.spawnPoint.y + PLAYER_H,
      };
  }
  gameState.bossMaxHp = runtime.level.boss
    ? runtime.level.boss.kind === 'twin'
      ? 7
      : runtime.level.boss.kind === 'mirror'
        ? runtime.level.boss.hp
        : runtime.entities.filter((e) => e.k === 'b').length * runtime.level.boss.hp
    : 0;
  gameState.lt = 0;
  gameState.newRecordKind = 0;
  gameState.history = [takeSnapshot()];
  gameState.echoCooldown = 0;
  gameState.hintTimer = seen ? 99 : 0;
  gameState.mode = 'play';
  gameState.messageTimer = 0;
  gameState.bedFadeTimer = 0;
  const o = ownedEchoes();
  if (o.length && !gameState.echoesOwned[gameState.selectedEcho]) gameState.selectedEcho = o[0];
  {
    const hl = [],
      bl = gameState.blue && gameState.blue[i];
    for (const [c, r, t] of HEART_SPOTS[runtime.level.name] || []) {
      if (bl && bl[0] === c && bl[1] === r) continue;
      hl.push([c, r, t]);
    }
    if (bl && !runtime.level.king) hl.push([bl[0], bl[1], 'm']);
    runtime.hearts = hl.map(([c, r, t], k) => ({
      x: (runtime.level.flip ? 29 - c : c) * TILE + TILE / 2,
      y: r * TILE + TILE / 2,
      t,
      id: i + ':' + k,
      got: !!gameState.collectedHearts[i + ':' + k],
    }));
  }
  if (runtime.level.king) showMessage("Le Roi des Échos t'attend. Pas de retraite !", 3);
  syncHoles();
  updateDoors();
}
