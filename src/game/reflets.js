import { runtime } from '../state/runtime.js';
import { FLOOR_Y, LETHAL_BOSS_STATES, TILE, WIDTH } from '../core/config.js';
import { gameState, showMessage } from '../state/state.js';
import { collide, moveBody, overlaps, solid } from './physics.js';
import { bossAI } from './boss-ai.js';
import { playSfx } from '../audio/audio.js';
/* ---------- Les Reflets : le Soleil (gauche) et la Lune (droite), exactement en miroir ---------- */
export const BEAM_H = FLOOR_Y - 32,
  MURET_H = 64,
  DC = [
    [14, 15],
    [1, 2],
    [27, 28],
  ];
export const doorOpen = (d) => runtime.grid[14][DC[d][0]] !== '#';
function setDoor(d, op) {
  for (const c of DC[d]) {
    const o = runtime.grid[14][c],
      n = op ? '.' : '#';
    if (o !== n) {
      runtime.brokenTilesLog.push([c, 14, o]);
      runtime.grid[14][c] = n;
    }
  }
}
const heroInDoor = (d) =>
  overlaps(runtime.player, {
    x: DC[d][0] * TILE,
    y: 14 * TILE,
    w: 2 * TILE,
    h: TILE,
  });
function shuffleDoors() {
  const idx = [0, 1, 2].sort(() => Math.random() - 0.5),
    n = Math.floor(Math.random() * 3),
    nr = [1, 1, 1];
  for (let i = 0; i < n; i++) nr[idx[i]] = 0;
  for (let d = 0; d < 3; d++) {
    if (!nr[d] && heroInDoor(d)) nr[d] = 1;
    setDoor(d, nr[d]);
  }
  playSfx('plate');
}
runtime.nukeCount = 0;
function mirrorBossFire(e) {
  if ((runtime.nukeCount + 1) % 3 === 0)
    showMessage('☢ Fusion n°' + (runtime.nukeCount + 1) + ' : explosion nucléaire ! Reste sous terre !', 3.2);
  const m = e.hp > 4 ? 1 : e.hp > 2 ? 1.2 : 1.4;
  for (const sd of [1, -1])
    runtime.entities.push({
      k: 's',
      rf: 1,
      beam: 1,
      tone: sd > 0 ? 'sun' : 'moon',
      x: sd > 0 ? 34 - 13 : WIDTH - 34 - 13,
      y: FLOOR_Y - BEAM_H,
      w: 26,
      h: BEAM_H,
      vx: sd * 240 * m,
      vy: 0,
      alive: 1,
      life: 8,
      t0: gameState.time,
      face: sd,
    });
  playSfx('shot');
  gameState.shake = Math.max(gameState.shake, 0.2);
}
function reflEnt(e, dt) {
  if (e.beam) {
    e.life -= dt;
    e.x += e.vx * dt;
    const lead = e.vx > 0 ? e.x + e.w : e.x,
      cc = Math.floor(lead / TILE);
    if (e.life <= 0 || cc < 0 || cc >= 30) {
      e.alive = 0;
      return;
    }
    const mid = e.x + e.w / 2;
    if ((e.vx > 0 && mid >= WIDTH / 2) || (e.vx < 0 && mid <= WIDTH / 2)) {
      e.alive = 0;
      const o = runtime.entities.find((x) => x.k === 's' && x.orb && x.alive);
      if (o) o.n++;
      else
        runtime.entities.push({
          k: 's',
          orb: 1,
          nk: (runtime.nukeCount + 1) % 3 === 0 ? 1 : 0,
          n: 1,
          ph: 0,
          tm: 2,
          x: WIDTH / 2 - 16,
          y: FLOOR_Y - 48,
          w: 32,
          h: 32,
          vx: 0,
          vy: 0,
          alive: 1,
          life: 99,
          t0: gameState.time,
        });
    }
  } else if (e.orb) {
    e.tm -= dt;
    if (e.ph === 0) {
      if (e.tm <= 0) {
        e.ph = 1;
        e.tm = 0.5;
      }
    } else {
      const u = 1 - Math.max(0, e.tm) / 0.5;
      e.y = FLOOR_Y - 48 + u * (480 - (FLOOR_Y - 48));
      if (e.tm <= 0) {
        e.alive = 0;
        runtime.nukeCount++;
        if (runtime.nukeCount % 3 === 0) {
          runtime.entities.push({
            k: 's',
            rf: 1,
            nuke: 1,
            amt: 2,
            x: TILE,
            y: TILE,
            w: WIDTH - 2 * TILE,
            h: FLOOR_Y - TILE,
            vx: 0,
            vy: 0,
            alive: 1,
            life: 1.7,
            t0: gameState.time,
          });
          gameState.shake = 1.4;
          playSfx('land');
          playSfx('break');
          playSfx('shot');
        } else {
          runtime.entities.push({
            k: 's',
            rf: 1,
            boom: 1,
            amt: e.n >= 2 ? 2 : 1,
            x: WIDTH / 2 - 40,
            y: FLOOR_Y + 4,
            w: 80,
            h: 60,
            vx: 0,
            vy: 0,
            alive: 1,
            life: 0.4,
            t0: gameState.time,
          });
          gameState.shake = 0.8;
          playSfx('land');
          playSfx('break');
        }
        shuffleDoors();
      }
    }
  } else {
    e.life -= dt;
    if (e.life <= 0) e.alive = 0;
  }
}
export function mirrorBossAI(e, dt) {
  const bs = runtime.entities.filter((x) => x.k === 'b' && x.alive),
    lead = bs.find((x) => !x.dn) || bs[0];
  if (e !== lead) {
    // suiveur : copie le meneur en miroir (immobile s'il est à terre)
    if (!lead) return;
    if (!e.dn) {
      e.x = WIDTH - lead.x - e.w;
      e.y = lead.y;
      e.vx = -lead.vx;
      e.vy = lead.vy;
      e.g = lead.g;
      e.ph = lead.ph;
      e.wa = lead.wa;
    } else {
      e.vx = 0;
      e.vy = 0;
    }
    e.hh = lead.hh;
    e.st = lead.st;
    e.t = lead.t;
    e.face = -(lead.face || 1);
    return;
  }
  const m = e.hp > 4 ? 1 : e.hp > 2 ? 1.2 : 1.4;
  if (runtime.knockbackTimer > 0) {
    runtime.knockbackTimer -= dt;
    if (runtime.knockbackTimer <= 0) {
      runtime.knockbackTimer = 0;
      if (collide(runtime.player)) runtime.knockbackTimer = 0.05;
    }
  }
  for (let d = 0; d < 3; d++) if (!doorOpen(d) && heroInDoor(d)) setDoor(d, 1);
  e.wa = e.wa || 0;
  e.face = e.face || 1;
  if (e.st === 'idle') {
    const lo = (e.id ? 17 : 6) * TILE + 2,
      hi = (e.id ? 24 : 13) * TILE - e.w - 2;
    e.pz = (e.pz || 0) - dt;
    if (e.px === undefined || Math.abs(e.px - e.x) < 8) {
      if (e.pz <= 0 && e.px !== undefined) {
        e.pz = 0.5 + Math.random() * 0.9;
        e.px = undefined;
      }
      if (e.px === undefined && e.pz <= 0) e.px = lo + Math.random() * (hi - lo);
    }
    const tx = e.px === undefined ? e.x : e.px,
      dx = tx - e.x,
      d = Math.sign(dx) || 1,
      want = e.px !== undefined && Math.abs(dx) >= 8;
    e.spd = 170 * m;
    moveBody(
      e,
      {
        l: want && d < 0 ? 1 : 0,
        r: want && d > 0 ? 1 : 0,
        jp: 0,
        jh: 0,
      },
      dt,
    );
    e.x = Math.max(lo, Math.min(hi, e.x));
    if (Math.abs(dx) > 4) e.face = d;
    const busy = runtime.entities.some((x) => x.k === 's' && x.alive && (x.beam || x.orb || x.boom));
    if (!busy) {
      e.cd = (e.cd === undefined ? 1.4 : e.cd) - dt;
      if (e.cd <= 0) {
        e.st = 'tele';
        e.t = 0.9 / m;
        e.vx = 0;
      }
    }
  } else if (e.st === 'tele') {
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
    if (e.t <= 0) {
      mirrorBossFire(e);
      e.st = 'fire';
      e.t = 0.4;
    }
  } else if (e.st === 'fire') {
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
    if (e.t <= 0) {
      e.st = 'idle';
      e.cd = (1.3 + Math.random() * 0.6) / m;
    }
  } else if (e.st === 'stun') {
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
    if (e.t <= 0) {
      e.st = 'idle';
      e.cd = 1.2;
    }
  } else e.st = 'idle';
  e.wa += ((Math.abs(e.vx) > 20 ? 1 : 0) - e.wa) * Math.min(1, dt * 8);
  e.ph = (e.ph || 0) + (Math.abs(e.vx) * dt) / 13;
}
bossAI.any = () => runtime.entities.some((x) => x.k === 'b' && x.alive);
export function updateEntities(dt) {
  for (const e of runtime.entities) {
    if (!e.alive) continue;
    if (e.k === 'w') {
      e.inv = Math.max(0, e.inv - dt);
      if (e.t === 'g') {
        e.ph += dt * 3;
        e.x += e.dir * e.spd * dt;
        e.y = e.y0 + Math.sin(e.ph) * 4;
        const cc = Math.floor((e.x + (e.dir > 0 ? e.w + 2 : -2)) / TILE);
        if (solid(cc, Math.floor((e.y + e.h / 2) / TILE)) || Math.abs(e.x - e.x0) > 110) e.dir = -e.dir;
      } else {
        const cc = Math.floor((e.x + (e.dir > 0 ? e.w + 2 : -2)) / TILE);
        if (solid(cc, Math.floor((e.y + e.h - 2) / TILE)) || !solid(cc, Math.floor((e.y + e.h + 4) / TILE)))
          e.dir = -e.dir;
        moveBody(
          e,
          {
            l: e.dir < 0 ? 1 : 0,
            r: e.dir > 0 ? 1 : 0,
            jp: 0,
            jh: 0,
          },
          dt,
        );
      }
    } else if (e.k === 's' && (e.beam || e.orb || e.boom || e.puff || e.nuke)) reflEnt(e, dt);
    else if (e.k === 's') {
      e.life -= dt;
      e.x += e.vx * dt;
      if (e.fist) {
        if (e.life <= 0) e.alive = 0;
      } else if (e.bul) {
        e.d += Math.abs(e.vx * dt);
        if (
          (!e.spell && e.d >= 160) ||
          e.life <= 0 ||
          solid(Math.floor((e.x + (e.vx > 0 ? e.w : 0)) / TILE), Math.floor((e.y + 5) / TILE))
        )
          e.alive = 0;
      } else if (e.life <= 0 || solid(Math.floor((e.x + (e.vx > 0 ? e.w : 0)) / TILE), 13)) e.alive = 0;
    } else bossAI(e, dt);
  }
}
// fantôme de La Mémoire : rejoue ta position d'il y a 2,2 s ; il ne tue que s'il est en mouvement
const GHOST_TRAIL_LENGTH = 150;
export function ghost() {
  if ((runtime.level.boss && runtime.level.boss.kind !== 'ghost') || !runtime.level.boss || !bossAI.any())
    return null;
  const n = gameState.history.length - 1 - GHOST_TRAIL_LENGTH;
  if (n < 10) return null;
  const g = gameState.history[n].p,
    o = gameState.history[n - 5].p;
  return {
    x: g.x,
    y: g.y,
    w: g.w,
    h: g.h,
    mv: Math.hypot(g.x - o.x, g.y - o.y) > 2.5,
    face: g.face || 1,
    hit: g.hit || 0,
    big: g.big,
    f: g.x > o.x + 0.5 ? 1 : g.x < o.x - 0.5 ? -1 : 0,
    tr: [gameState.history[n - 4].p, gameState.history[n - 9].p],
  };
}
const damageOf = (e) => {
  const gi = runtime.level.boss && runtime.level.boss.kind === 'giant';
  if (e.fist) return 1;
  if (e.k === 'w') return e.t === 'c' ? 0.25 : e.t === 'g' ? 0.75 : e.t === 'r' ? 0.5 : 0.25;
  return gi ? 0.5 : 1;
};
export const hitSrcOf = (b) => {
  for (const e of runtime.entities)
    if (
      e.alive &&
      e.k === 'b' &&
      e.st === 'slap' &&
      e.sl &&
      overlaps(b, {
        x: e.face > 0 ? e.x + e.w - 4 : e.x - 48,
        y: e.y + 6,
        w: 52,
        h: e.h - 10,
      })
    )
      return {
        a: 1,
        x: e.x + e.w / 2,
      };
  if (runtime.level.boss && runtime.level.boss.kind === 'mirror') {
    let a = 0,
      x = 0;
    for (const e of runtime.entities)
      if (e.alive && e.rf && (!e.nuke || (e.life < 1.5 && e.life > 0.5)) && overlaps(b, e, 3)) {
        a += e.amt || 1;
        x = e.x + e.w / 2;
      }
    if (a)
      return {
        a: Math.min(2, a),
        x,
      };
  }
  for (const e of runtime.entities)
    if (
      e.alive &&
      ((e.k === 'w' && !(e.t === 'g' && b.dash > 0)) ||
        (e.k === 's' && !e.orb && !e.puff) ||
        LETHAL_BOSS_STATES[e.st]) &&
      overlaps(b, e, e.k === 'b' ? 8 : 3)
    )
      return {
        a: damageOf(e),
        x: e.x + e.w / 2,
      };
  return null;
};
export const hitSrc = () => {
  const g = ghost();
  if (g && g.mv && overlaps(runtime.player, g, 9))
    return {
      a: 0.75,
      x: g.x,
    };
  if (
    g &&
    g.hit > 0 &&
    overlaps(runtime.player, {
      x: g.face > 0 ? g.x + g.w - 2 : g.x - 28,
      y: g.y + 3,
      w: 30,
      h: g.h - 8,
    })
  )
    return {
      a: 0.75,
      x: g.x,
    };
  return hitSrcOf(runtime.player);
};
