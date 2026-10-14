import { runtime } from '../state/runtime.js';
import { FLOOR, G, H, T } from '../core/config.js';
import { gameState, say } from '../state/state.js';
import { moveBody, unsealRoom } from './physics.js';
import { startGain } from './combat.js';
import { bossAI } from './boss-ai.js';
import { sfx } from '../audio/audio.js';
/* ---------- Le Colosse ---------- */
function collapseTile(c, quiet) {
  if (c < 1 || c > 28 || runtime.grid[14][c] === '.') return;
  for (let r = 14; r <= 16; r++) {
    runtime.brokenLog.push([c, r, runtime.grid[r][c]]);
    runtime.grid[r][c] = '.';
  }
  runtime.FLR.cnt[c] = 0;
  if (!quiet) {
    sfx('break');
    gameState.shake = Math.max(gameState.shake, 0.3);
  }
  (runtime.FLR.fx || (runtime.FLR.fx = [])).push({
    c,
    t: gameState.time,
  });
}
export function startColossusDeath(e) {
  e.st = 'die';
  e.dd = 0;
  e.inv = 999;
  e.vx = 0;
  e.vy = 0;
  e.imp = 0;
  e.rest = 0;
  e.t = 99;
  for (const x of runtime.ents) if (x.k === 's') x.alive = 0;
  say("Le Colosse s'effondre…", 2.6);
  gameState.shake = Math.max(gameState.shake, 0.4);
  sfx('land');
}
function colossusDie(e, dt) {
  e.dd += dt;
  if (e.dd < 0.8) {
    e.cr = Math.min(1, e.dd / 0.8);
    if (Math.random() < dt * 10) gameState.shake = Math.max(gameState.shake, 0.12);
  } else if (!e.jmp) {
    e.jmp = 1;
    e.vy = -1000;
    e.cr = 0;
    const cx = e.x + e.w / 2,
      pcx = runtime.player.x + runtime.player.w / 2,
      tl = 4 * T + 16,
      tr = 25 * T + 16;
    e.tx = Math.abs(pcx - tl) > Math.abs(pcx - tr) ? tl : tr;
    e.vx = (e.tx - cx) / 1.0526;
    sfx('land');
    gameState.shake = Math.max(gameState.shake, 0.3);
  }
  if (e.jmp) {
    e.vy += G * dt;
    e.y += e.vy * dt;
    if (!e.imp) e.x += e.vx * dt;
    if (!e.imp && e.vy > 0 && e.y + e.h >= FLOOR) {
      e.imp = 1;
      e.vx = 0;
      e.x = e.tx - e.w / 2;
      const c = Math.floor(e.tx / T);
      for (let q = c - 3; q <= c + 3; q++) collapseTile(q, 1);
      gameState.shake = 0.8;
      sfx('land');
      sfx('break');
    }
    if (e.imp && !e.rest && e.y > H + 30) {
      e.rest = 1;
      e.rt = 0;
    }
  }
  if (e.rest) {
    e.rt += dt;
    if (e.rest === 1 && e.rt > 0.7) {
      e.rest = 2;
      for (let c = 1; c <= 28; c++)
        if (runtime.grid[14][c] === '.') {
          for (let r = 14; r <= 16; r++) runtime.grid[r][c] = '#';
          runtime.FLR.rise[c] = gameState.time;
        }
      runtime.FLR.cnt = [];
      runtime.FLR.steps = 0;
      gameState.shake = 0.7;
      sfx('land');
      sfx('break');
    }
    if (e.rest === 2 && e.rt > 1.7) {
      e.alive = 0;
      if (!bossAI.any()) {
        unsealRoom();
        gameState.cl[gameState.lvl] = 1;
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
export function colossusAI(e, dt) {
  if (e.st === 'die') {
    colossusDie(e, dt);
    return;
  }
  const m = e.hp > 12 ? 0.8 : e.hp >= 6 ? 1 : 1.3;
  e.m = m;
  e.t -= dt * (m - 1); // tous les minuteurs s'écoulent plus vite quand il s'énerve
  const cx = e.x + e.w / 2,
    pcx = runtime.player.x + runtime.player.w / 2,
    dx = pcx - cx,
    ad = Math.abs(dx),
    dm = dt * m;
  e.wa = e.wa || 0;
  if (e.st === 'idle' || ((e.st === 'arm' || e.st === 'rarm') && e.t > 0.4)) {
    const nf = ad > 14 ? Math.sign(dx) : e.face || 1;
    e.face = nf;
  }
  if (e.st === 'idle') {
    if (!e.q)
      e.q = Array.from(
        {
          length: 5,
        },
        () => (Math.random() < 0.5 ? 'r' : 'm'),
      ).join(''); // 5 prochaines attaques tirées au sort
    const ch = e.hp > 12 ? 1.5 : e.hp >= 6 ? 1 : 0.5,
      nx = e.q[0],
      reach = e.w / 2 + 110,
      walk = ad > e.w / 2 + 30;
    e.spd = 72 * m;
    moveBody(
      e,
      {
        l: walk && dx < 0 ? 1 : 0,
        r: walk && dx > 0 ? 1 : 0,
        jp: 0,
        jh: 0,
      },
      dt,
    );
    e.wa += ((walk ? 1 : 0) - e.wa) * Math.min(1, dt * 6);
    if (walk || e.wa > 0.15) {
      const o = e.ph || 0;
      e.ph = o + dm * 3.9 * (walk ? 1 : e.wa);
      if (Math.floor(o / Math.PI) !== Math.floor(e.ph / Math.PI) && walk) {
        gameState.shake = Math.max(gameState.shake, 0.22);
        sfx('land');
        runtime.FLR.steps = (runtime.FLR.steps || 0) + 1;
        if (runtime.FLR.steps % 2 === 0) breakEdges();
      }
    }
    if (e.t <= 0) {
      if (nx === 'r') {
        e.q = e.q.slice(1);
        e.st = 'rarm';
        e.d0 = e.t = ch * m;
        e.vx = 0;
        e.wn = e.hp > 12 ? 1 : e.hp >= 6 ? 2 : 3;
        sfx('clang');
      } // à distance : ondes au sol
      else if (ad <= reach) {
        e.q = e.q.slice(1);
        e.st = 'arm';
        e.d0 = e.t = ch * m;
        e.vx = 0;
        e.fx = 0;
        sfx('clang');
      } // corps à corps : il doit être au contact
      else e.t = 0;
      if (!e.q) e.q = '';
    }
  } else if (e.st === 'arm' || e.st === 'rarm') {
    e.vx = 0;
    moveBody(
      e,
      {
        l: 0,
        r: 0,
        jp: 0,
        jh: 0,
      },
      dt,
    );
    e.wa *= Math.max(0, 1 - dt * 8);
    if (e.t <= 0) {
      e.st = e.st === 'arm' ? 'smash' : 'rsmash';
      e.t = 0.55;
      e.fx = 0;
    }
  } else if (e.st === 'smash' || e.st === 'rsmash') {
    e.vx = 0;
    moveBody(
      e,
      {
        l: 0,
        r: 0,
        jp: 0,
        jh: 0,
      },
      dt,
    );
    if (!e.fx && e.t <= 0.37) {
      e.fx = 1;
      const f = e.face || 1,
        fx = cx + f * (e.w / 2 + 55);
      if (e.st === 'smash')
        runtime.ents.push({
          k: 's',
          fist: 1,
          x: cx + f * (e.w / 2 - 10) - (f < 0 ? 120 : 0),
          y: FLOOR - 130,
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
          runtime.ents.push({
            k: 's',
            shock: 1,
            x: cx + sd * (e.w / 2 - 6) - 15,
            y: FLOOR - 38,
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
      sfx('land');
      sfx('break');
    }
    if (e.t <= 0) {
      if (e.st === 'rsmash' && --e.wn > 0) {
        e.st = 'rarm';
        e.d0 = e.t = 0.4;
      } else {
        e.t = e.st === 'rsmash' ? 1.3 : 2.4;
        e.st = 'idle';
      }
    }
  } else {
    e.st = 'idle';
    e.t = 1;
  }
}

/* ---------- Les Reflets : le Soleil (gauche) et la Lune (droite), exactement en miroir ---------- */
