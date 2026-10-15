import { runtime } from '../state/runtime.ts';
import { FLOOR_Y, LETHAL_BOSS_STATES, TILE, WIDTH } from '../core/config.ts';
import { gameState, showMessage } from '../state/state.ts';
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
function mirrorBossFire(entity) {
  if ((runtime.nukeCount + 1) % 3 === 0)
    showMessage('☢ Fusion n°' + (runtime.nukeCount + 1) + ' : explosion nucléaire ! Reste sous terre !', 3.2);
  const m = entity.hp > 4 ? 1 : entity.hp > 2 ? 1.2 : 1.4;
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
function reflEnt(entity, dt) {
  if (entity.beam) {
    entity.life -= dt;
    entity.x += entity.vx * dt;
    const lead = entity.vx > 0 ? entity.x + entity.w : entity.x,
      cc = Math.floor(lead / TILE);
    if (entity.life <= 0 || cc < 0 || cc >= 30) {
      entity.alive = 0;
      return;
    }
    const mid = entity.x + entity.w / 2;
    if ((entity.vx > 0 && mid >= WIDTH / 2) || (entity.vx < 0 && mid <= WIDTH / 2)) {
      entity.alive = 0;
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
  } else if (entity.orb) {
    entity.tm -= dt;
    if (entity.ph === 0) {
      if (entity.tm <= 0) {
        entity.ph = 1;
        entity.tm = 0.5;
      }
    } else {
      const u = 1 - Math.max(0, entity.tm) / 0.5;
      entity.y = FLOOR_Y - 48 + u * (480 - (FLOOR_Y - 48));
      if (entity.tm <= 0) {
        entity.alive = 0;
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
            amt: entity.n >= 2 ? 2 : 1,
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
    entity.life -= dt;
    if (entity.life <= 0) entity.alive = 0;
  }
}
export function mirrorBossAI(entity, dt) {
  const bs = runtime.entities.filter((x) => x.k === 'b' && x.alive),
    lead = bs.find((x) => !x.dn) || bs[0];
  if (entity !== lead) {
    // suiveur : copie le meneur en miroir (immobile s'il est à terre)
    if (!lead) return;
    if (!entity.dn) {
      entity.x = WIDTH - lead.x - entity.w;
      entity.y = lead.y;
      entity.vx = -lead.vx;
      entity.vy = lead.vy;
      entity.g = lead.g;
      entity.ph = lead.ph;
      entity.wa = lead.wa;
    } else {
      entity.vx = 0;
      entity.vy = 0;
    }
    entity.hh = lead.hh;
    entity.st = lead.st;
    entity.t = lead.t;
    entity.face = -(lead.face || 1);
    return;
  }
  const m = entity.hp > 4 ? 1 : entity.hp > 2 ? 1.2 : 1.4;
  if (runtime.knockbackTimer > 0) {
    runtime.knockbackTimer -= dt;
    if (runtime.knockbackTimer <= 0) {
      runtime.knockbackTimer = 0;
      if (collide(runtime.player)) runtime.knockbackTimer = 0.05;
    }
  }
  for (let d = 0; d < 3; d++) if (!doorOpen(d) && heroInDoor(d)) setDoor(d, 1);
  entity.wa = entity.wa || 0;
  entity.face = entity.face || 1;
  if (entity.st === 'idle') {
    const lo = (entity.id ? 17 : 6) * TILE + 2,
      hi = (entity.id ? 24 : 13) * TILE - entity.w - 2;
    entity.pz = (entity.pz || 0) - dt;
    if (entity.px === undefined || Math.abs(entity.px - entity.x) < 8) {
      if (entity.pz <= 0 && entity.px !== undefined) {
        entity.pz = 0.5 + Math.random() * 0.9;
        entity.px = undefined;
      }
      if (entity.px === undefined && entity.pz <= 0) entity.px = lo + Math.random() * (hi - lo);
    }
    const tx = entity.px === undefined ? entity.x : entity.px,
      dx = tx - entity.x,
      d = Math.sign(dx) || 1,
      want = entity.px !== undefined && Math.abs(dx) >= 8;
    entity.spd = 170 * m;
    moveBody(
      entity,
      {
        l: want && d < 0 ? 1 : 0,
        r: want && d > 0 ? 1 : 0,
        jp: 0,
        jh: 0,
      },
      dt,
    );
    entity.x = Math.max(lo, Math.min(hi, entity.x));
    if (Math.abs(dx) > 4) entity.face = d;
    const busy = runtime.entities.some((x) => x.k === 's' && x.alive && (x.beam || x.orb || x.boom));
    if (!busy) {
      entity.cd = (entity.cd === undefined ? 1.4 : entity.cd) - dt;
      if (entity.cd <= 0) {
        entity.st = 'tele';
        entity.t = 0.9 / m;
        entity.vx = 0;
      }
    }
  } else if (entity.st === 'tele') {
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
    if (entity.t <= 0) {
      mirrorBossFire(entity);
      entity.st = 'fire';
      entity.t = 0.4;
    }
  } else if (entity.st === 'fire') {
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
    if (entity.t <= 0) {
      entity.st = 'idle';
      entity.cd = (1.3 + Math.random() * 0.6) / m;
    }
  } else if (entity.st === 'stun') {
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
    if (entity.t <= 0) {
      entity.st = 'idle';
      entity.cd = 1.2;
    }
  } else entity.st = 'idle';
  entity.wa += ((Math.abs(entity.vx) > 20 ? 1 : 0) - entity.wa) * Math.min(1, dt * 8);
  entity.ph = (entity.ph || 0) + (Math.abs(entity.vx) * dt) / 13;
}
bossAI.any = () => runtime.entities.some((x) => x.k === 'b' && x.alive);
export function updateEntities(dt) {
  for (const entity of runtime.entities) {
    if (!entity.alive) continue;
    if (entity.k === 'w') {
      entity.inv = Math.max(0, entity.inv - dt);
      if (entity.t === 'g') {
        entity.ph += dt * 3;
        entity.x += entity.dir * entity.spd * dt;
        entity.y = entity.y0 + Math.sin(entity.ph) * 4;
        // le fantôme traverse le décor (plateformes, piques, trous) et patrouille dans toute la salle
        if (entity.x < TILE) entity.dir = 1;
        else if (entity.x + entity.w > TILE * 29) entity.dir = -1;
      } else {
        const cc = Math.floor((entity.x + (entity.dir > 0 ? entity.w + 2 : -2)) / TILE),
          r0 = Math.floor(entity.y / TILE),
          r1 = Math.floor((entity.y + entity.h - 2) / TILE);
        let spike = false;
        for (let r = r0; r <= r1; r++) if (runtime.grid[r] && runtime.grid[r][cc] === '^') spike = true;
        if (
          spike ||
          solid(cc, Math.floor((entity.y + entity.h - 2) / TILE)) ||
          !solid(cc, Math.floor((entity.y + entity.h + 4) / TILE))
        )
          entity.dir = -entity.dir;
        moveBody(
          entity,
          {
            l: entity.dir < 0 ? 1 : 0,
            r: entity.dir > 0 ? 1 : 0,
            jp: 0,
            jh: 0,
          },
          dt,
        );
      }
    } else if (entity.k === 's' && (entity.beam || entity.orb || entity.boom || entity.puff || entity.nuke))
      reflEnt(entity, dt);
    else if (entity.k === 's') {
      entity.life -= dt;
      entity.x += entity.vx * dt;
      if (entity.fist) {
        if (entity.life <= 0) entity.alive = 0;
      } else if (entity.bul) {
        entity.d += Math.abs(entity.vx * dt);
        if (
          (!entity.spell && entity.d >= 160) ||
          entity.life <= 0 ||
          solid(
            Math.floor((entity.x + (entity.vx > 0 ? entity.w : 0)) / TILE),
            Math.floor((entity.y + 5) / TILE),
          )
        )
          entity.alive = 0;
      } else if (
        entity.life <= 0 ||
        solid(Math.floor((entity.x + (entity.vx > 0 ? entity.w : 0)) / TILE), 13)
      )
        entity.alive = 0;
    } else bossAI(entity, dt);
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
const damageOf = (entity) => {
  const gi = runtime.level.boss && runtime.level.boss.kind === 'giant';
  if (entity.fist) return 1;
  if (entity.k === 'w')
    return entity.t === 'c' ? 0.25 : entity.t === 'g' ? 0.75 : entity.t === 'r' ? 0.5 : 0.25;
  return gi ? 0.5 : 1;
};
export const hitSrcOf = (body) => {
  for (const entity of runtime.entities)
    if (
      entity.alive &&
      entity.k === 'b' &&
      entity.st === 'slap' &&
      entity.sl &&
      overlaps(body, {
        x: entity.face > 0 ? entity.x + entity.w - 4 : entity.x - 48,
        y: entity.y + 6,
        w: 52,
        h: entity.h - 10,
      })
    )
      return {
        a: 1,
        x: entity.x + entity.w / 2,
      };
  if (runtime.level.boss && runtime.level.boss.kind === 'mirror') {
    let a = 0,
      x = 0;
    for (const entity of runtime.entities)
      if (
        entity.alive &&
        entity.rf &&
        (!entity.nuke || (entity.life < 1.5 && entity.life > 0.5)) &&
        overlaps(body, entity, 3)
      ) {
        a += entity.amt || 1;
        x = entity.x + entity.w / 2;
      }
    if (a)
      return {
        a: Math.min(2, a),
        x,
      };
  }
  for (const entity of runtime.entities)
    if (
      entity.alive &&
      ((entity.k === 'w' && !(entity.t === 'g' && body.dash > 0)) ||
        (entity.k === 's' && !entity.orb && !entity.puff) ||
        LETHAL_BOSS_STATES[entity.st]) &&
      overlaps(body, entity, entity.k === 'b' ? 8 : 3)
    )
      return {
        a: damageOf(entity),
        x: entity.x + entity.w / 2,
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
