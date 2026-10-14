import { runtime } from '../state/runtime.js';
import { H, PH0, PW0, SPD, T, W } from '../core/config.js';
import { levels } from '../data/levels.js';
import { rngf } from './generator.js';
import { HUB, enemyTypes, gameState, owned, say } from '../state/state.js';
import { kingLv, kingReady } from './world.js';
import { snap } from '../game/rewind.js';
import { collide, syncHoles, updDoors } from '../game/physics.js';
/* ---------- cœurs ---------- */
const HEARTS = {
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
const BSPOT = {
  'Alcôve du Colosse': [24, 7],
  "Alcôve de l'Éclair": [24, 7],
  'Les petites bêtes': [6, 8],
  'Deux balcons': [12, 9],
  'Double plaque et mur': [9, 11],
};
// 10 % des salles contiennent un cœur bleu, tirées au hasard à chaque nouvelle partie
export function pickBlue(seed) {
  const rnd = rngf(seed),
    pool = [];
  for (const [nm, sp] of Object.entries(BSPOT)) {
    const i = levels.findIndex((l) => l.name === nm);
    if (i >= 0) pool.push([i, sp]);
  }
  levels.forEach((l, i) => {
    if (i > HUB && l.hs && l.hs.length) pool.push([i, l.hs[Math.floor(rnd() * l.hs.length)]]);
  });
  for (let k = pool.length - 1; k > 0; k--) {
    const j = Math.floor(rnd() * (k + 1));
    [pool[k], pool[j]] = [pool[j], pool[k]];
  }
  const out = {};
  for (const [i, sp] of pool.slice(0, Math.round(levels.length / 10))) out[i] = sp;
  return out;
}
export const isBench = (i) => !!levels[i].bench;
export function load(i, from = 'p', fromRoom = -1, frow = 13) {
  const seen = !!gameState.vis[i];
  gameState.vis[i] = 1;
  gameState.cur = i;
  gameState.entry = from;
  gameState.entryRoom = fromRoom;
  gameState.entryRow = frow;
  runtime.level = i === HUB && kingReady() ? kingLv() : levels[i];
  gameState.lvl = i;
  runtime.grid = runtime.level.rows.map((r) => r.split(''));
  runtime.plates = [];
  runtime.anchors = [];
  runtime.ctm = {};
  gameState.anch = gameState.anchAll[i] || (gameState.anchAll[i] = {});
  runtime.ents = [];
  runtime.brokenLog = [];
  runtime.bed = null;
  if (gameState.sol[i] && !runtime.level.king && !runtime.level.gen) {
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
        runtime.spawnPt = {
          x: c * T + (T - PW0) / 2,
          y: (r + 1) * T - PH0,
        };
        runtime.grid[r][c] = '.';
      } else if (ch === '=') {
        runtime.bed = {
          x: c * T + T / 2,
          y: (r + 1) * T,
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
        runtime.ents.push({
          k: 'w',
          t,
          x: c * T + (T - D.w) / 2,
          y: (r + 1) * T - D.h - (t === 'g' ? 8 : 0),
          x0: c * T + (T - D.w) / 2,
          y0: (r + 1) * T - D.h - 8,
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
        if (!gameState.cl[i] && !(tw && ch === '$'))
          runtime.ents.push({
            k: 'b',
            join: tw ? 1 : 0,
            spr: 'twinB',
            x: tw ? 23 * T - bw / 2 : c * T + T / 2 - bw / 2,
            y: (r + 1) * T - bh,
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
  runtime.CR = [];
  runtime.crT = 0;
  for (let r = 0; r < 17; r++)
    for (let c = 0; c < 30; c++) if (runtime.grid[r][c] === '~') runtime.CR.push([c, r]);
  runtime.shots = [];
  runtime.player = {
    x: runtime.spawnPt.x,
    y: runtime.spawnPt.y,
    vx: 0,
    vy: 0,
    face: 1,
    g: false,
    co: 0,
    jb: 0,
    jumped: 0,
    w: PW0,
    h: PH0,
    big: 0,
    bigT: 0,
    hit: 0,
    hcd: 0,
    dash: 0,
    dcd: 0,
    dd: 1,
    fly: gameState.have[5] ? 1 : 0,
    flyT: 0,
    dj: 1,
    lad: 0,
    ladCd: 0,
  };
  runtime.echoClone = null;
  gameState.stA = 1;
  gameState.sealed = 0;
  runtime.SEAL = [];
  gameState.gateUpAt = -9;
  gameState.perch = 0;
  runtime.FLR = {
    cnt: [],
    rise: [],
    last: -1,
    fx: [],
  };
  runtime.PO = 0;
  runtime.NK = 0;
  if (runtime.level.plug && gameState.vis[runtime.level.plug.to])
    for (const [r, c] of runtime.level.plug.cells) runtime.grid[r][c] = '.';
  if (from === 'X') {
    const lk = runtime.level.links.find((k) => k.to === fromRoom) || runtime.level.links[0];
    if (lk.s === 'l' || lk.s === 'r') {
      const row = Math.max(lk.r0, Math.min(lk.r1, frow));
      runtime.player.x = lk.s === 'l' ? 6 : W - PW0 - 6;
      runtime.player.y = (row + 1) * T - PH0;
      runtime.player.face = lk.s === 'l' ? 1 : -1;
      runtime.player.vx = (lk.s === 'l' ? 1 : -1) * SPD * 0.45;
      let t = 0;
      while (collide(runtime.player) && t < 17) {
        runtime.player.y -= T;
        t++;
      }
      if (t >= 17) {
        runtime.player.x = runtime.spawnPt.x;
        runtime.player.y = runtime.spawnPt.y;
      }
    } else if (lk.lad) {
      runtime.player.x = lk.c0 * T + (T - PW0) / 2;
      runtime.player.vx = 0;
      runtime.player.vy = 0;
      runtime.player.lad = 1;
      if (lk.s === 't') {
        runtime.player.y = -2;
      } else {
        runtime.player.y = H - PH0 - 2;
        runtime.player.g = false;
      }
    } else {
      runtime.player.x = Math.max(lk.c0 * T + 3, Math.min((lk.c1 + 1) * T - PW0 - 3, frow));
      runtime.player.vx = 0;
      if (lk.s === 't') {
        runtime.player.y = 0;
        runtime.player.vy = 0;
      } else {
        runtime.player.y = H - PH0;
        runtime.player.vy = -960;
        runtime.player.g = false;
        runtime.player.noVar = 1;
      }
    }
  }
  runtime.statue = null;
  if (isBench(i) && !runtime.level.king) {
    const rP = Math.round((runtime.spawnPt.y + PH0) / T) - 1,
      cP = Math.floor((runtime.spawnPt.x + PW0 / 2) / T);
    for (const d of [2, 3, -2, -3, 4, -4]) {
      const c = cP + d;
      if (
        runtime.grid[rP] &&
        runtime.grid[rP][c] === '.' &&
        runtime.grid[rP + 1] &&
        runtime.grid[rP + 1][c] === '#'
      ) {
        runtime.statue = {
          x: c * T + T / 2,
          y: (rP + 1) * T,
        };
        break;
      }
    }
    if (!runtime.statue)
      runtime.statue = {
        x: runtime.spawnPt.x + PW0 / 2,
        y: runtime.spawnPt.y + PH0,
      };
  }
  gameState.bmax = runtime.level.boss
    ? runtime.level.boss.kind === 'twin'
      ? 7
      : runtime.level.boss.kind === 'mirror'
        ? runtime.level.boss.hp
        : runtime.ents.filter((e) => e.k === 'b').length * runtime.level.boss.hp
    : 0;
  gameState.lt = 0;
  gameState.newRec = 0;
  gameState.hist = [snap()];
  gameState.cd = 0;
  gameState.hintT = seen ? 99 : 0;
  gameState.mode = 'play';
  gameState.msgT = 0;
  gameState.bedT = 0;
  const o = owned();
  if (o.length && !gameState.have[gameState.sel]) gameState.sel = o[0];
  {
    const hl = [],
      bl = gameState.blue && gameState.blue[i];
    for (const [c, r, t] of HEARTS[runtime.level.name] || []) {
      if (bl && bl[0] === c && bl[1] === r) continue;
      hl.push([c, r, t]);
    }
    if (bl && !runtime.level.king) hl.push([bl[0], bl[1], 'm']);
    runtime.hearts = hl.map(([c, r, t], k) => ({
      x: (runtime.level.flip ? 29 - c : c) * T + T / 2,
      y: r * T + T / 2,
      t,
      id: i + ':' + k,
      got: !!gameState.hcol[i + ':' + k],
    }));
  }
  if (runtime.level.king) say("Le Roi des Échos t'attend. Pas de retraite !", 3);
  syncHoles();
  updDoors();
}
