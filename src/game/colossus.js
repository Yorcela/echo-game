import { runtime } from '../state/runtime.js';
import { FLOOR_Y, GRAVITY, HEIGHT, TILE } from '../core/config.js';
import { gameState, showMessage } from '../state/state.js';
import { moveBody, unsealRoom } from './physics.js';
import { startGain } from './combat.js';
import { bossAI } from './boss-ai.js';
import { playSfx } from '../audio/audio.js';
/* ---------- Le Colosse ---------- */
function collapseTile(c, quiet) {
  if (c < 1 || c > 28 || runtime.grid[14][c] === '.') return;
  for (let r = 14; r <= 16; r++) {
    runtime.brokenTilesLog.push([c, r, runtime.grid[r][c]]);
    runtime.grid[r][c] = '.';
  }
  runtime.colossusFloor.cnt[c] = 0;
  if (!quiet) {
    playSfx('break');
    gameState.shake = Math.max(gameState.shake, 0.3);
  }
  (runtime.colossusFloor.fx || (runtime.colossusFloor.fx = [])).push({
    c,
    t: gameState.time,
  });
}
export function startColossusDeath(entity) {
  entity.st = 'die';
  entity.dd = 0;
  entity.inv = 999;
  entity.vx = 0;
  entity.vy = 0;
  entity.imp = 0;
  entity.rest = 0;
  entity.t = 99;
  for (const x of runtime.entities) if (x.k === 's') x.alive = 0;
  showMessage("Le Colosse s'effondre…", 2.6);
  gameState.shake = Math.max(gameState.shake, 0.4);
  playSfx('land');
}
function colossusDie(entity, dt) {
  entity.dd += dt;
  if (entity.dd < 0.8) {
    entity.cr = Math.min(1, entity.dd / 0.8);
    if (Math.random() < dt * 10) gameState.shake = Math.max(gameState.shake, 0.12);
  } else if (!entity.jmp) {
    entity.jmp = 1;
    entity.vy = -1000;
    entity.cr = 0;
    const cx = entity.x + entity.w / 2,
      pcx = runtime.player.x + runtime.player.w / 2,
      tl = 4 * TILE + 16,
      tr = 25 * TILE + 16;
    entity.tx = Math.abs(pcx - tl) > Math.abs(pcx - tr) ? tl : tr;
    entity.vx = (entity.tx - cx) / 1.0526;
    playSfx('land');
    gameState.shake = Math.max(gameState.shake, 0.3);
  }
  if (entity.jmp) {
    entity.vy += GRAVITY * dt;
    entity.y += entity.vy * dt;
    if (!entity.imp) entity.x += entity.vx * dt;
    if (!entity.imp && entity.vy > 0 && entity.y + entity.h >= FLOOR_Y) {
      entity.imp = 1;
      entity.vx = 0;
      entity.x = entity.tx - entity.w / 2;
      const c = Math.floor(entity.tx / TILE);
      for (let q = c - 3; q <= c + 3; q++) collapseTile(q, 1);
      gameState.shake = 0.8;
      playSfx('land');
      playSfx('break');
    }
    if (entity.imp && !entity.rest && entity.y > HEIGHT + 30) {
      entity.rest = 1;
      entity.rt = 0;
    }
  }
  if (entity.rest) {
    entity.rt += dt;
    if (entity.rest === 1 && entity.rt > 0.7) {
      entity.rest = 2;
      for (let c = 1; c <= 28; c++)
        if (runtime.grid[14][c] === '.') {
          for (let r = 14; r <= 16; r++) runtime.grid[r][c] = '#';
          runtime.colossusFloor.rise[c] = gameState.time;
        }
      runtime.colossusFloor.cnt = [];
      runtime.colossusFloor.steps = 0;
      gameState.shake = 0.7;
      playSfx('land');
      playSfx('break');
    }
    if (entity.rest === 2 && entity.rt > 1.7) {
      entity.alive = 0;
      if (!bossAI.any()) {
        unsealRoom();
        gameState.clearedBossRooms[gameState.loadedRoom] = 1;
        startGain();
      }
    }
  }
}
function breakEdges() {
  let l = -1,
    r = -1;
  for (let c = 1; c <= 10; c++)
    if (runtime.grid[14][c] !== '.') {
      l = c;
      break;
    }
  for (let c = 28; c >= 19; c--)
    if (runtime.grid[14][c] !== '.') {
      r = c;
      break;
    }
  if (l > 0) collapseTile(l);
  if (r > 0) collapseTile(r);
}
export function colossusAI(entity, dt) {
  if (entity.st === 'die') {
    colossusDie(entity, dt);
    return;
  }
  const m = entity.hp > 12 ? 0.8 : entity.hp >= 6 ? 1 : 1.3;
  entity.m = m;
  entity.t -= dt * (m - 1); // tous les minuteurs s'écoulent plus vite quand il s'énerve
  const cx = entity.x + entity.w / 2,
    pcx = runtime.player.x + runtime.player.w / 2,
    dx = pcx - cx,
    ad = Math.abs(dx),
    dm = dt * m;
  entity.wa = entity.wa || 0;
  if (entity.st === 'idle' || ((entity.st === 'arm' || entity.st === 'rarm') && entity.t > 0.4)) {
    const nf = ad > 14 ? Math.sign(dx) : entity.face || 1;
    entity.face = nf;
  }
  if (entity.st === 'idle') {
    if (!entity.q)
      entity.q = Array.from(
        {
          length: 5,
        },
        () => (Math.random() < 0.5 ? 'r' : 'm'),
      ).join(''); // 5 prochaines attaques tirées au sort
    const ch = entity.hp > 12 ? 1.5 : entity.hp >= 6 ? 1 : 0.5,
      nx = entity.q[0],
      reach = entity.w / 2 + 110,
      walk = ad > entity.w / 2 + 30;
    entity.spd = 72 * m;
    moveBody(
      entity,
      {
        l: walk && dx < 0 ? 1 : 0,
        r: walk && dx > 0 ? 1 : 0,
        jp: 0,
        jh: 0,
      },
      dt,
    );
    entity.wa += ((walk ? 1 : 0) - entity.wa) * Math.min(1, dt * 6);
    if (walk || entity.wa > 0.15) {
      const o = entity.ph || 0;
      entity.ph = o + dm * 3.9 * (walk ? 1 : entity.wa);
      if (Math.floor(o / Math.PI) !== Math.floor(entity.ph / Math.PI) && walk) {
        gameState.shake = Math.max(gameState.shake, 0.22);
        playSfx('land');
        runtime.colossusFloor.steps = (runtime.colossusFloor.steps || 0) + 1;
        if (runtime.colossusFloor.steps % 2 === 0) breakEdges();
      }
    }
    if (entity.t <= 0) {
      if (nx === 'r') {
        entity.q = entity.q.slice(1);
        entity.st = 'rarm';
        entity.d0 = entity.t = ch * m;
        entity.vx = 0;
        entity.wn = entity.hp > 12 ? 1 : entity.hp >= 6 ? 2 : 3;
        playSfx('clang');
      } // à distance : ondes au sol
      else if (ad <= reach) {
        entity.q = entity.q.slice(1);
        entity.st = 'arm';
        entity.d0 = entity.t = ch * m;
        entity.vx = 0;
        entity.fx = 0;
        playSfx('clang');
      } // corps à corps : il doit être au contact
      else entity.t = 0;
      if (!entity.q) entity.q = '';
    }
  } else if (entity.st === 'arm' || entity.st === 'rarm') {
    entity.vx = 0;
    moveBody(
      entity,
      {
        l: 0,
        r: 0,
        jp: 0,
        jh: 0,
      },
      dt,
    );
    entity.wa *= Math.max(0, 1 - dt * 8);
    if (entity.t <= 0) {
      entity.st = entity.st === 'arm' ? 'smash' : 'rsmash';
      entity.t = 0.55;
      entity.fx = 0;
    }
  } else if (entity.st === 'smash' || entity.st === 'rsmash') {
    entity.vx = 0;
    moveBody(
      entity,
      {
        l: 0,
        r: 0,
        jp: 0,
        jh: 0,
      },
      dt,
    );
    if (!entity.fx && entity.t <= 0.37) {
      entity.fx = 1;
      const f = entity.face || 1;
      if (entity.st === 'smash')
        runtime.entities.push({
          k: 's',
          fist: 1,
          x: cx + f * (entity.w / 2 - 10) - (f < 0 ? 120 : 0),
          y: FLOOR_Y - 130,
          w: 120,
          h: 130,
          vx: 0,
          vy: 0,
          alive: 1,
          life: 0.28,
          face: f,
        });
      else
        for (const sd of [-1, 1])
          runtime.entities.push({
            k: 's',
            shock: 1,
            x: cx + sd * (entity.w / 2 - 6) - 15,
            y: FLOOR_Y - 38,
            vx: sd * 330 * m,
            vy: 0,
            w: 30,
            h: 38,
            alive: 1,
            life: 2.4,
            face: sd,
            t0: gameState.time,
          });
      gameState.shake = 0.7;
      playSfx('land');
      playSfx('break');
    }
    if (entity.t <= 0) {
      if (entity.st === 'rsmash' && --entity.wn > 0) {
        entity.st = 'rarm';
        entity.d0 = entity.t = 0.4;
      } else {
        entity.t = entity.st === 'rsmash' ? 1.3 : 2.4;
        entity.st = 'idle';
      }
    }
  } else {
    entity.st = 'idle';
    entity.t = 1;
  }
}

/* ---------- Les Reflets : le Soleil (gauche) et la Lune (droite), exactement en miroir ---------- */
