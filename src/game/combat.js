import { runtime } from '../state/runtime.js';
import { FLOOR_Y, PLATE_HOLD_TIME, TILE, WIDTH } from '../core/config.js';
import { ECHO_GAIN_TEXTS } from '../data/echoes.js';
import { gameState, showMessage } from '../state/state.js';
import { saveGame } from '../state/save.js';
import { isKingReady } from '../world/world.js';
import { winRoom } from './rewind.js';
import { collide, isDoor, overlaps, unsealRoom } from './physics.js';
import { startColossusDeath } from './colossus.js';
import { playSfx } from '../audio/audio.js';
import { bossAI } from './boss-ai.js';
/* ---------- Coup de tête, ennemis, boss ---------- */
let fireCooldown = 0;
runtime.shots = [];
export function fire(b = runtime.player) {
  if (!gameState.echoesOwned[6] || b.dash > 0 || gameState.mode !== 'play') return false;
  if (b === runtime.player) {
    if (fireCooldown > 0) return false;
    fireCooldown = 0.45;
  } else {
    if ((b.tcd || 0) > 0) return false;
    b.tcd = 0.45;
  }
  runtime.shots.push({
    x: b.x + b.w / 2 + b.face * (b.w / 2),
    y: b.y + b.h * 0.4,
    vx: b.face * 560,
    d: 0,
    alive: 1,
  });
  playSfx('shot');
  return true;
}
function startBossRewind(e) {
  e.st = 'rew';
  e.t = 1.6;
  e.inv = Math.max(e.inv, 1.6);
  e.vx = 0;
  playSfx('rewind');
}
function splitTwin(e) {
  const cx = e.x + e.w / 2,
    W2 = 64;
  e.join = 0;
  e.fast = 1;
  e.w = W2;
  e.hp = 2;
  e.spr = 'twin-b';
  e.st = 'idle';
  e.t = 0.7;
  e.inv = 0.7;
  e.sh = 0;
  e.n = 0;
  const lx = Math.max(40, Math.min(WIDTH - 40 - W2, cx - 80 - W2 / 2)),
    rx = Math.max(40, Math.min(WIDTH - 40 - W2, cx + 80 - W2 / 2));
  const e2 = {
    ...e,
    id: 1,
    spr: 'twin-a',
    n: 1,
    t: 1.2,
    hb: undefined,
  };
  e.x = lx;
  e2.x = rx;
  e.vx = -280;
  e2.vx = 280;
  e.vy = e2.vy = -320;
  e.g = e2.g = false;
  runtime.entities.push(e2);
  gameState.shake = 0.45;
  playSfx('land');
  showMessage('Le serpent se divise en deux !', 2.4);
}
export function bossHit(e, dx, dmg = 1) {
  if (runtime.level.boss.kind === 'mirror') {
    const bs = runtime.entities.filter((x) => x.k === 'b' && x.alive);
    e.inv = 0.35;
    playSfx('hit');
    gameState.shake = Math.max(gameState.shake, 0.15);
    e.dm = Math.min(3, (e.dm || 0) + dmg);
    const tot = bs.reduce((s, x) => s + (x.dm || 0), 0),
      hp = runtime.level.boss.hp - tot;
    for (const x of bs) {
      x.hp = hp;
      x.st = 'stun';
      x.t = 1.2;
      x.vx = 0;
      x.inv = 0.35;
    }
    if (e.dm >= 3 && !e.dn) {
      e.dn = 1;
      const o = bs.find((y) => y !== e);
      if (o && !o.dn) {
        o.cd = e.cd;
        o.px = undefined;
        o.pz = 0.3;
      }
      showMessage(
        (e.id ? 'La Lune' : 'Le Soleil') +
          " est à terre, mais ses rayons continuent ! Frappe l'autre 3 fois.",
        3.2,
      );
    }
    if (bs.every((x) => x.dn)) {
      for (const x of bs) x.alive = 0;
      gameState.shake = 0.6;
      unsealRoom();
      gameState.clearedBossRooms[gameState.loadedRoom] = 1;
      startGain();
      return true;
    }
    if (runtime.player.y + runtime.player.h < FLOOR_Y - 90) {
      runtime.knockbackTimer = 1;
      runtime.player.vx = -(runtime.player.face || 1) * 240;
      runtime.player.vy = Math.max(runtime.player.vy, 160);
      runtime.player.g = false;
      runtime.player.hit = 0;
    }
    return false;
  }
  if (runtime.level.boss.kind === 'giant') {
    e.hp -= dmg;
    e.inv = 0.35;
    playSfx('hit');
    gameState.shake = Math.max(gameState.shake, 0.15);
    if (e.hp <= 0) startColossusDeath(e);
    return false;
  }
  e.sh = (e.sh || 0) + 1;
  if (e.sh >= 2) e.t = Math.min(e.t, 0.55);
  e.hp -= dmg;
  e.inv = 0.6;
  e.vx = dx * 240;
  e.vy = -200;
  playSfx('hit');
  gameState.shake = 0.25;
  if ((runtime.level.boss.kind === 'time' || runtime.level.boss.king) && e.hp > 0) startBossRewind(e);
  if (runtime.level.boss.kind === 'twin' && e.join && e.hp <= 3 && e.hp > 0) splitTwin(e);
  if (e.hp <= 0) {
    e.alive = 0;
    if (!bossAI.any()) {
      unsealRoom();
      gameState.clearedBossRooms[gameState.loadedRoom] = 1;
      if (runtime.level.king) {
        winRoom();
        return true;
      }
      startGain();
      return true;
    }
  }
  return false;
}
const isHittable = (e, dx) => {
  const K = runtime.level.boss && runtime.level.boss.kind;
  if (K === 'ghost') return false;
  if (K === 'bolt')
    return e.inv <= 0 && e.st !== 'dash' && e.st !== 'blink' && dx !== undefined && dx * (e.face || 1) > 0;
  if (K === 'mirror') return e.inv <= 0 && e.st !== 'stun' && !e.dn;
  return e.inv <= 0 && (e.sh || 0) < 2 && (e.st === 'stun' || (K === 'giant' && e.st !== 'die'));
};
export function updateShots(dt) {
  fireCooldown = Math.max(0, fireCooldown - dt);
  for (const s of runtime.shots) {
    if (!s.alive) continue;
    for (let k = 0; k < 4 && s.alive; k++) {
      const st = (s.vx * dt) / 4;
      s.x += st;
      s.d += Math.abs(st);
      if (s.d >= 160 || s.x < 0 || s.x > WIDTH) {
        s.alive = 0;
        break;
      }
      const c = Math.floor(s.x / TILE),
        r = Math.floor(s.y / TILE),
        ch = runtime.grid[r] && runtime.grid[r][c];
      if (
        ch === '#' ||
        ch === '%' ||
        ch === '&' ||
        ch === '~' ||
        (isDoor(ch) && !runtime.openDoors[ch.toLowerCase()])
      ) {
        s.alive = 0;
        break;
      }
      if (ch >= 'a' && ch <= 'z') {
        const p = runtime.plates.find((p) => p.c === c && p.r === r);
        if (p) p.t = PLATE_HOLD_TIME;
      }
      if (ch === '1' || ch === '2' || ch === '3') {
        if (!gameState.roomAnchors[ch]) {
          gameState.roomAnchors[ch] = 1;
          playSfx('plate');
        }
      }
      for (const e of runtime.entities) {
        if (!e.alive || e.k === 's') continue;
        const bx = {
          x: s.x - 5,
          y: s.y - 5,
          w: 10,
          h: 10,
        };
        if (!overlaps(bx, e)) continue;
        if (e.k === 'w') {
          if (e.t === 'c') {
            e.alive = 0;
            playSfx('hit');
          } else if (e.t === 'r') {
            if (e.inv <= 0) {
              e.hp -= 1;
              e.inv = 0.2;
              playSfx(e.hp <= 0 ? 'hit' : 'clang');
              if (e.hp <= 0) e.alive = 0;
            }
          } else playSfx('clang');
          s.alive = 0;
          break;
        } else {
          if (isHittable(e, Math.sign(s.vx))) {
            if (bossHit(e, Math.sign(s.vx))) return;
          } else playSfx('clang');
          s.alive = 0;
          break;
        }
      }
    }
  }
  runtime.shots = runtime.shots.filter((s) => s.alive);
}
export function stomp() {
  if (runtime.player.vy <= 40 || runtime.player.dash > 0) return;
  if (runtime.level.boss && runtime.level.boss.kind === 'shooter')
    for (const e of runtime.entities) {
      if (!e.alive || e.k !== 'b' || e.st === 'stun' || e.st === 'rage' || e.inv > 0) continue;
      const zone = {
        x: e.x - 6,
        y: e.y - 46,
        w: e.w + 12,
        h: e.h * 0.6 + 46,
      };
      if (overlaps(runtime.player, zone) && runtime.player.y + runtime.player.h < e.y + e.h * 0.45) {
        e.st = 'stun';
        e.t = runtime.level.boss.stun || 1.9;
        e.vx = 0;
        e.inv = 0.3;
        runtime.player.vy = -430;
        runtime.player.g = false;
        runtime.player.jb = 0;
        playSfx('hit');
        gameState.shake = 0.3;
        showMessage('Étourdie ! Frappe-la !', 1.6);
      }
    }
  for (const e of runtime.entities) {
    if (!e.alive || e.k !== 'w' || e.t !== 'c') continue;
    if (overlaps(runtime.player, e, 2) && runtime.player.y + runtime.player.h < e.y + e.h * 0.7) {
      e.alive = 0;
      runtime.player.vy = -430;
      runtime.player.g = false;
      runtime.player.jb = 0;
      playSfx('hit');
      gameState.shake = 0.1;
    }
  }
}
export function doHit(b = runtime.player) {
  if ((b.hcd || 0) > 0 || (b.hit || 0) > 0 || b.dash > 0) return false;
  b.hit = 0.2;
  b.hcd = 0.45;
  b.vx += b.face * 200;
  playSfx('hit');
  return true;
}
export function hitCheck(b = runtime.player) {
  const fx = b.face > 0 ? b.x + b.w - 2 : b.x - 28,
    fy = b.y + 3,
    fw = 30,
    fh = b.h - 8,
    box = {
      x: fx,
      y: fy,
      w: fw,
      h: fh,
    };
  const x0 = Math.floor(fx / TILE),
    x1 = Math.floor((fx + fw) / TILE),
    y0 = Math.floor(fy / TILE),
    y1 = Math.floor((fy + fh) / TILE);
  for (let r = y0; r <= y1; r++)
    for (let c = x0; c <= x1; c++) {
      const ch = runtime.grid[r] && runtime.grid[r][c];
      if (ch === '%' || (ch === '&' && b.big)) {
        runtime.brokenTilesLog.push([c, r, ch]);
        runtime.grid[r][c] = '.';
        playSfx('break');
        gameState.shake = 0.15;
      } else if (ch === '&' && !b.big && b === runtime.player && gameState.messageTimer <= 0)
        showMessage('Trop solide… il faudrait être plus gros');
    }
  for (const e of runtime.entities) {
    if (!e.alive || e.k === 's' || !overlaps(box, e)) continue;
    if (e.k === 'w') {
      if (e.t === 'g') {
        if (e.inv <= 0) {
          e.inv = 0.6;
          playSfx('clang');
          showMessage("Intouchable ! Saute par-dessus, ou fonce à travers avec l'Éclair", 2.6);
        }
      } else if (e.t === 'r') {
        if (e.inv <= 0) {
          e.hp -= b.big ? 2.5 : 1;
          e.inv = 0.32;
          playSfx(e.hp <= 0 ? 'hit' : 'clang');
          gameState.shake = 0.18;
          if (e.hp <= 0) e.alive = 0;
          else {
            const ox = e.x;
            e.x += b.face * 10;
            if (collide(e)) e.x = ox;
          }
        }
      } else {
        e.alive = 0;
        playSfx('hit');
        gameState.shake = 0.1;
      }
    } else if (isHittable(e, b.face)) {
      if (bossHit(e, b.face, b.big ? 2 : 1)) return;
    } else if ((e.st !== 'stun' || runtime.level.boss.kind === 'bolt') && e.inv <= 0 && e.st !== 'blink') {
      e.inv = 0.35;
      b.vx = -b.face * 330;
      b.hit = 0;
      playSfx('clang');
    }
  }
}
export function startGain() {
  const g = runtime.level.gain;
  if (g === 't') {
    gameState.hasTimeEcho = 1;
  } else if (g !== undefined) {
    gameState.echoesOwned[g] = 1;
    if (g < 5) gameState.selectedEcho = g;
  }
  gameState.gainedEcho = ECHO_GAIN_TEXTS[g];
  if (isKingReady())
    gameState.gainedEcho = [
      gameState.gainedEcho[0],
      gameState.gainedEcho[1] + " · Le Roi des Échos t'attend dans le Hall !",
    ];
  gameState.gainTimer = 0;
  gameState.mode = 'gain';
  saveGame();
  playSfx('gain');
}
