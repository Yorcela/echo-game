import { trackEvent } from '../online/analytics.js';
import { runtime } from '../state/runtime.ts';
import { FLOOR_Y, PLATE_HOLD_TIME, TILE, WIDTH } from '../core/config.ts';
import { ECHO_GAIN_TEXTS } from '../data/echoes.js';
import { gameState, showMessage } from '../state/state.ts';
import { saveGame } from '../state/save.js';
import { isKingReady } from '../world/world.js';
import { winRoom } from './rewind.js';
import { collide, inWater, isDoor, overlaps, unsealRoom } from './physics.js';
import { octopusPunch } from './octopus.js';
import { startColossusDeath } from './colossus.js';
import { playSfx } from '../audio/audio.js';
import { bossAI } from './boss-ai.js';
/* ---------- Coup de tête, ennemis, boss ---------- */
let fireCooldown = 0;
runtime.shots = [];
export function fire(body = runtime.player) {
  if (!gameState.echoesOwned[6] || body.dash > 0 || gameState.mode !== 'play') return false;
  if (body === runtime.player) {
    if (fireCooldown > 0) return false;
    fireCooldown = 0.45;
  } else {
    if ((body.tcd || 0) > 0) return false;
    body.tcd = 0.45;
  }
  runtime.shots.push({
    x: body.x + body.w / 2 + body.face * (body.w / 2),
    y: body.y + body.h * 0.4,
    vx: body.face * 560,
    d: 0,
    alive: 1,
  });
  playSfx('shot');
  return true;
}
function startBossRewind(entity) {
  entity.st = 'rew';
  entity.t = 1.6;
  entity.inv = Math.max(entity.inv, 1.6);
  entity.vx = 0;
  playSfx('rewind');
}
function splitTwin(entity) {
  const cx = entity.x + entity.w / 2,
    W2 = 64;
  entity.join = 0;
  entity.fast = 1;
  entity.w = W2;
  entity.hp = 2;
  entity.spr = 'twin-b';
  entity.st = 'idle';
  entity.t = 0.7;
  entity.inv = 0.7;
  entity.sh = 0;
  entity.n = 0;
  const lx = Math.max(40, Math.min(WIDTH - 40 - W2, cx - 80 - W2 / 2)),
    rx = Math.max(40, Math.min(WIDTH - 40 - W2, cx + 80 - W2 / 2));
  const e2 = {
    ...entity,
    id: 1,
    spr: 'twin-a',
    n: 1,
    t: 1.2,
    hb: undefined,
  };
  entity.x = lx;
  e2.x = rx;
  entity.vx = -280;
  e2.vx = 280;
  entity.vy = e2.vy = -320;
  entity.g = e2.g = false;
  runtime.entities.push(e2);
  gameState.shake = 0.45;
  playSfx('land');
  showMessage('Le serpent se divise en deux !', 2.4);
}
export function bossHit(entity, dx, dmg = 1) {
  if (runtime.level.boss.kind === 'mirror') {
    const bs = runtime.entities.filter((x) => x.k === 'b' && x.alive);
    entity.inv = 0.35;
    playSfx('hit');
    gameState.shake = Math.max(gameState.shake, 0.15);
    entity.dm = Math.min(3, (entity.dm || 0) + dmg);
    const tot = bs.reduce((s, x) => s + (x.dm || 0), 0),
      hp = runtime.level.boss.hp - tot;
    for (const x of bs) {
      x.hp = hp;
      x.st = 'stun';
      x.t = 1.2;
      x.vx = 0;
      x.inv = 0.35;
    }
    if (entity.dm >= 3 && !entity.dn) {
      entity.dn = 1;
      const o = bs.find((y) => y !== entity);
      if (o && !o.dn) {
        o.cd = entity.cd;
        o.px = undefined;
        o.pz = 0.3;
      }
      showMessage(
        (entity.id ? 'La Lune' : 'Le Soleil') +
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
    entity.hp -= dmg;
    entity.inv = 0.35;
    playSfx('hit');
    gameState.shake = Math.max(gameState.shake, 0.15);
    if (entity.hp <= 0) startColossusDeath(entity);
    return false;
  }
  entity.sh = (entity.sh || 0) + 1;
  if (entity.sh >= 2) entity.t = Math.min(entity.t, 0.55);
  entity.hp -= dmg;
  entity.inv = 0.6;
  entity.vx = dx * 240;
  entity.vy = -200;
  playSfx('hit');
  gameState.shake = 0.25;
  if ((runtime.level.boss.kind === 'time' || runtime.level.boss.king) && entity.hp > 0)
    startBossRewind(entity);
  if (runtime.level.boss.kind === 'twin' && entity.join && entity.hp <= 3 && entity.hp > 0) splitTwin(entity);
  if (entity.hp <= 0) {
    entity.alive = 0;
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
const isHittable = (entity, dx) => {
  const K = runtime.level.boss && runtime.level.boss.kind;
  if (K === 'ghost') return false;
  if (K === 'bolt')
    return (
      entity.inv <= 0 &&
      entity.st !== 'dash' &&
      entity.st !== 'blink' &&
      dx !== undefined &&
      dx * (entity.face || 1) > 0
    );
  if (K === 'mirror') return entity.inv <= 0 && entity.st !== 'stun' && !entity.dn;
  return (
    entity.inv <= 0 &&
    (entity.sh || 0) < 2 &&
    (entity.st === 'stun' || (K === 'giant' && entity.st !== 'die'))
  );
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
      for (const entity of runtime.entities) {
        if (!entity.alive || entity.k === 's') continue;
        const bx = {
          x: s.x - 5,
          y: s.y - 5,
          w: 10,
          h: 10,
        };
        if (!overlaps(bx, entity)) continue;
        if (entity.k === 'w') {
          if (entity.t === 'c') {
            entity.alive = 0;
            playSfx('hit');
          } else if (entity.t === 'r') {
            if (entity.inv <= 0) {
              entity.hp -= 1;
              entity.inv = 0.2;
              playSfx(entity.hp <= 0 ? 'hit' : 'clang');
              if (entity.hp <= 0) entity.alive = 0;
            }
          } else playSfx('clang');
          s.alive = 0;
          break;
        } else {
          if (isHittable(entity, Math.sign(s.vx))) {
            if (bossHit(entity, Math.sign(s.vx))) return;
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
    for (const entity of runtime.entities) {
      if (!entity.alive || entity.k !== 'b' || entity.st === 'stun' || entity.st === 'rage' || entity.inv > 0)
        continue;
      const zone = {
        x: entity.x - 6,
        y: entity.y - 46,
        w: entity.w + 12,
        h: entity.h * 0.6 + 46,
      };
      if (
        overlaps(runtime.player, zone) &&
        runtime.player.y + runtime.player.h < entity.y + entity.h * 0.45
      ) {
        entity.st = 'stun';
        entity.t = runtime.level.boss.stun || 1.9;
        entity.vx = 0;
        entity.inv = 0.3;
        runtime.player.vy = -430;
        runtime.player.g = false;
        runtime.player.jb = 0;
        playSfx('hit');
        gameState.shake = 0.3;
        showMessage('Étourdie ! Frappe-la !', 1.6);
      }
    }
  for (const entity of runtime.entities) {
    if (!entity.alive || entity.k !== 'w' || (entity.t !== 'c' && entity.t !== 'p')) continue;
    if (
      overlaps(runtime.player, entity, 2) &&
      runtime.player.y + runtime.player.h < entity.y + entity.h * 0.7
    ) {
      entity.alive = 0;
      runtime.player.vy = -430;
      runtime.player.g = false;
      runtime.player.jb = 0;
      playSfx('hit');
      gameState.shake = 0.1;
    }
  }
}
export function doHit(body = runtime.player) {
  if ((body.hcd || 0) > 0 || (body.hit || 0) > 0 || body.dash > 0) return false;
  // dans l'eau on ne peut pas frapper : seul le dash (contre les piranhas)
  if (inWater(body)) return false;
  body.hit = 0.2;
  body.hcd = 0.45;
  body.vx += body.face * 200;
  playSfx('hit');
  return true;
}
export function hitCheck(body = runtime.player) {
  const fx = body.face > 0 ? body.x + body.w - 2 : body.x - 28,
    fy = body.y + 3,
    fw = 30,
    fh = body.h - 8,
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
      if (ch === '%' || (ch === '&' && body.big)) {
        runtime.brokenTilesLog.push([c, r, ch]);
        runtime.grid[r][c] = '.';
        playSfx('break');
        gameState.shake = 0.15;
      } else if (ch === '&' && !body.big && body === runtime.player && gameState.messageTimer <= 0)
        showMessage('Trop solide… il faudrait être plus gros');
    }
  if (runtime.level.boss && runtime.level.boss.kind === 'octopus') {
    const o = runtime.entities.find((q) => q.k === 'b' && q.alive);
    if (o && octopusPunch(o, box)) {
      o.hp -= body.big ? 2 : 1;
      playSfx('hit');
      gameState.shake = 0.3;
      if (o.hp <= 0) {
        o.alive = 0;
        unsealRoom();
        gameState.clearedBossRooms[gameState.loadedRoom] = 1;
        startGain();
      }
      return;
    }
  }
  for (const entity of runtime.entities) {
    if (!entity.alive || entity.k === 's' || !overlaps(box, entity)) continue;
    if (entity.k === 'w') {
      if (entity.t === 'g') {
        if (entity.inv <= 0) {
          entity.inv = 0.6;
          playSfx('clang');
          showMessage('Intouchable ! Saute par-dessus', 2.6);
        }
      } else if (entity.t === 'f') {
        if (entity.inv <= 0) {
          entity.inv = 0.6;
          playSfx('clang');
          showMessage("Le piranha esquive les coups : seul un dash l'élimine !", 2.4);
        }
      } else if (entity.t === 'p') {
        if (entity.inv <= 0) {
          entity.inv = 0.6;
          playSfx('clang');
          showMessage('Le pingouin encaisse les coups : saute-lui dessus !', 2.4);
        }
      } else if (entity.t === 'r') {
        if (entity.inv <= 0) {
          entity.hp -= body.big ? 2.5 : 1;
          entity.inv = 0.32;
          playSfx(entity.hp <= 0 ? 'hit' : 'clang');
          gameState.shake = 0.18;
          if (entity.hp <= 0) entity.alive = 0;
          else {
            const ox = entity.x;
            entity.x += body.face * 10;
            if (collide(entity)) entity.x = ox;
          }
        }
      } else {
        entity.alive = 0;
        playSfx('hit');
        gameState.shake = 0.1;
      }
    } else if (isHittable(entity, body.face)) {
      if (bossHit(entity, body.face, body.big ? 2 : 1)) return;
    } else if (
      (entity.st !== 'stun' || runtime.level.boss.kind === 'bolt') &&
      entity.inv <= 0 &&
      entity.st !== 'blink'
    ) {
      entity.inv = 0.35;
      body.vx = -body.face * 330;
      body.hit = 0;
      playSfx('clang');
    }
  }
}
export function startGain() {
  const g = runtime.level.gain;
  if (!gameState.trial)
    trackEvent('boss_defeated', {
      boss: String(g),
      rooms_visited: Object.keys(gameState.visitedRooms).length,
      run_time_s: Math.round(gameState.runTime),
    });
  if (g === 't') {
    gameState.hasTimeEcho = 1;
  } else if (g === 7) {
    gameState.hasSwim = 1;
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
