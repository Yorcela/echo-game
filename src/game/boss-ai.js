import { runtime } from '../state/runtime.js';
import { FLOOR_Y, GRAVITY, TILE, WIDTH } from '../core/config.js';
import { gameState, showMessage } from '../state/state.js';
import { hurtPlayer } from './rewind.js';
import { collide, moveBody, overlaps } from './physics.js';
import { colossusAI } from './colossus.js';
import { mirrorBossAI } from './reflets.js';
import { playSfx } from '../audio/audio.js';
// un bond sous une plateforme le sonnerait aussitôt : on simule la trajectoire
function isHopBlocked(entity, pcx, cx) {
  let vx = Math.max(-300, Math.min(300, (pcx - cx) / 0.84));
  if (entity.fast) vx *= 1.6;
  let x = entity.x,
    y = entity.y,
    vy = -800;
  for (let i = 0; i < 120; i++) {
    const dt = 1 / 60;
    vy += GRAVITY * dt;
    x += vx * dt;
    y += vy * dt;
    if (y + entity.h >= FLOOR_Y) return false;
    if (
      collide({
        x: Math.max(34, Math.min(WIDTH - 34 - entity.w, x)),
        y,
        w: entity.w,
        h: entity.h,
      })
    )
      return !entity.fast || vy < 0;
  }
  return false;
}
const GHOST_ORBIT_RADIUS = 5 * TILE;
function ghostBossAI(entity, dt) {
  const B = runtime.level.boss,
    cx0 = WIDTH / 2,
    lo = cx0 - GHOST_ORBIT_RADIUS - entity.w / 2,
    hi = cx0 + GHOST_ORBIT_RADIUS - entity.w / 2,
    cx = entity.x + entity.w / 2,
    pcx = runtime.player.x + runtime.player.w / 2,
    dir = pcx >= cx ? 1 : -1;
  if (!entity.gi) {
    entity.gi = 1;
    entity.x = cx0 - entity.w / 2;
    entity.st = 'idle';
    entity.t = 1.2;
    entity.tx = cx0;
    entity.vx = 0;
  }
  if (entity.x < lo) {
    entity.x = lo;
    entity.vx = Math.max(0, entity.vx);
  }
  if (entity.x > hi) {
    entity.x = hi;
    entity.vx = Math.min(0, entity.vx);
  }
  if (entity.st === 'idle') {
    entity.face = dir;
    entity.spd = 70;
    const dd = entity.tx - cx;
    moveBody(
      entity,
      {
        l: dd < -8 ? 1 : 0,
        r: dd > 8 ? 1 : 0,
        jp: 0,
        jh: 0,
      },
      dt,
    );
    if (Math.abs(dd) <= 8 && entity.t > 0.6) entity.tx = cx0 + (Math.random() * 2 - 1) * GHOST_ORBIT_RADIUS;
    if (entity.t <= 0) {
      entity.st = 'tele';
      entity.t = B.tele || 0.5;
      entity.vx = 0;
      entity.spd = 0;
    }
  } else if (entity.st === 'tele') {
    entity.face = dir;
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
      entity.st = 'charge';
      entity.dirc = dir;
      entity.t = 1.1;
      entity.spd = B.spd;
    }
  } else if (entity.st === 'charge') {
    entity.face = entity.dirc;
    moveBody(
      entity,
      {
        l: entity.dirc < 0 ? 1 : 0,
        r: entity.dirc > 0 ? 1 : 0,
        jp: 0,
        jh: 0,
      },
      dt,
    );
    if (entity.t <= 0 || (entity.dirc < 0 && entity.x <= lo + 1) || (entity.dirc > 0 && entity.x >= hi - 1)) {
      entity.st = 'rest';
      entity.t = 1.3;
      entity.vx = 0;
      entity.spd = 0;
      gameState.shake = 0.12;
    }
  } else if (entity.st === 'rest') {
    entity.face = dir;
    entity.vx *= 0.8;
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
      entity.t = 1.4;
      entity.tx = cx0 + (Math.random() * 2 - 1) * GHOST_ORBIT_RADIUS;
    }
  } else if (entity.st === 'stun') {
    entity.vx *= 0.85;
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
      entity.t = 1.0;
    }
  }
  if (entity.x < lo) {
    entity.x = lo;
    entity.vx = 0;
  }
  if (entity.x > hi) {
    entity.x = hi;
    entity.vx = 0;
  }
}
function boltAI(entity, dt) {
  const B = runtime.level.boss,
    cx = entity.x + entity.w / 2,
    dP = Math.abs(runtime.player.x + runtime.player.w / 2 - cx),
    tg =
      runtime.echoClone && Math.abs(runtime.echoClone.x + runtime.echoClone.w / 2 - cx) < dP
        ? runtime.echoClone
        : runtime.player,
    pcx = tg.x + tg.w / 2,
    dir = pcx >= cx ? 1 : -1,
    d = Math.abs(pcx - cx),
    none0 = {
      l: 0,
      r: 0,
      jp: 0,
      jh: 0,
    };
  if (!entity.bi) {
    entity.bi = 1;
    entity.st = 'idle';
    entity.t = 1.0;
    entity.n = 0;
    entity.bc = 0;
    entity.ft = 0;
  }
  if (entity.st !== 'stun') entity.sh = 0;
  entity.ft = Math.max(0, (entity.ft || 0) - dt);
  if (entity.st === 'idle') {
    entity.face = dir;
    entity.spd = 0;
    moveBody(entity, none0, dt);
    if (d < 90 && entity.t > 0.18) entity.t = 0.18;
    if (entity.t <= 0) {
      entity.n++;
      if (entity.n % 4 === 0) {
        entity.st = 'crouch';
        entity.t = 1.2;
        entity.dirc = dir;
      } else if (d < 110) {
        entity.st = 'slap';
        entity.t = 0.5;
        entity.sl = 0;
      } else if (d > 120) {
        entity.st = 'blink';
        entity.bc = 0;
        entity.bs = 0;
        entity.t = 0.14;
      } else {
        entity.st = 'slap';
        entity.t = 0.5;
        entity.sl = 0;
      }
    }
  } else if (entity.st === 'crouch') {
    entity.spd = 0;
    moveBody(entity, none0, dt);
    if (entity.t > 0.3) {
      entity.dirc = dir;
      entity.face = dir;
    } else entity.face = entity.dirc;
    if (entity.t <= 0) {
      entity.st = 'dash';
      entity.t = 1.5;
      entity.face = entity.dirc;
    }
  } else if (entity.st === 'dash') {
    entity.face = entity.dirc;
    entity.lock = 0.1;
    entity.vx = entity.dirc * 900;
    moveBody(entity, none0, dt);
    const atWall = entity.x <= TILE + 10 || entity.x >= WIDTH - TILE - entity.w - 10;
    if (entity.t <= 0 || Math.abs(entity.vx) < 30) {
      entity.vx = 0;
      entity.lock = 0;
      if (atWall || entity.t > 0) {
        entity.st = 'stun';
        entity.t = B.stun || 1.8;
        gameState.shake = 0.35;
        playSfx('clang');
      } else {
        entity.st = 'rest';
        entity.t = 0.5;
      }
    }
  } else if (entity.st === 'rest') {
    entity.vx *= 0.8;
    moveBody(entity, none0, dt);
    if (entity.t <= 0) {
      entity.st = 'idle';
      entity.t = 0.4;
    }
  } else if (entity.st === 'blink') {
    entity.face = dir;
    entity.vx = 0;
    moveBody(entity, none0, dt);
    if (entity.t <= 0) {
      if (entity.bs === 0) {
        const step = Math.min(170, Math.max(0, d - 70)),
          ox = entity.x;
        entity.fa0 = cx;
        entity.x = Math.max(TILE + 4, Math.min(WIDTH - TILE - entity.w - 4, entity.x + dir * step));
        if (collide(entity)) entity.x = ox;
        entity.fa1 = entity.x + entity.w / 2;
        entity.ft = 0.35;
        entity.bs = 1;
        entity.t = 0.14;
        playSfx('shot');
      } else {
        entity.bc++;
        if (entity.bc >= 2) {
          entity.st = 'idle';
          entity.t = 0.3;
        } else {
          entity.bs = 0;
          entity.t = 0.2;
        }
      }
    }
  } else if (entity.st === 'slap') {
    entity.spd = 0;
    moveBody(entity, none0, dt);
    if (entity.t > 0.24) entity.face = dir;
    entity.sl = entity.t <= 0.2 && entity.t > 0.08 ? 1 : 0;
    if (entity.t <= 0) {
      entity.sl = 0;
      entity.st = 'idle';
      entity.t = 0.5;
    }
  } else if (entity.st === 'stun') {
    entity.vx *= 0.85;
    moveBody(entity, none0, dt);
    if (entity.t <= 0) {
      entity.st = 'idle';
      entity.t = 0.8;
    }
  }
  // le clone (Miroir, Jumeau, Rémanence) pris dans une gifle ou un dash est détruit : le joueur encaisse aussi
  if (
    runtime.echoClone &&
    ((entity.st === 'slap' &&
      entity.sl &&
      overlaps(runtime.echoClone, {
        x: entity.face > 0 ? entity.x + entity.w - 4 : entity.x - 48,
        y: entity.y + 6,
        w: 52,
        h: entity.h - 10,
      })) ||
      (entity.st === 'dash' && overlaps(runtime.echoClone, entity, 6)))
  ) {
    const cx0 = runtime.echoClone.x + runtime.echoClone.w / 2;
    runtime.echoClone = null;
    gameState.echoCooldown = 0.6;
    playSfx('off');
    showMessage('Ton clone est détruit : tu encaisses aussi !', 2.2);
    if (gameState.invulnerableTimer <= 0) hurtPlayer(1, false, cx0);
  }
}
export function bossAI(entity, dt) {
  runtime.kingAiActive = runtime.level.boss && runtime.level.boss.king ? 1 : 0;
  runtime.bossCollisionMode =
    runtime.level.boss && runtime.level.boss.kind === 'giant'
      ? 1
      : runtime.level.boss && runtime.level.boss.kind === 'mirror'
        ? 2
        : 0;
  try {
    bossAIInner(entity, dt);
  } finally {
    runtime.kingAiActive = 0;
    runtime.bossCollisionMode = 0;
  }
}
function bossAIInner(entity, dt) {
  const B = runtime.level.boss,
    K = B.kind;
  entity.t -= dt;
  if (K === 'shooter' && entity.st !== 'stun' && entity.st !== 'rage') {
    entity.wf = entity.hp >= 4 ? 1 : entity.hp === 3 ? 1.25 : entity.hp === 2 ? 1.55 : 1.9;
    entity.t -= dt * (entity.wf - 1);
  }
  entity.inv = Math.max(0, entity.inv - dt);
  if (K === 'giant') {
    colossusAI(entity, dt);
    return;
  }
  if (K === 'ghost') {
    ghostBossAI(entity, dt);
    return;
  }
  if (K === 'bolt') {
    boltAI(entity, dt);
    return;
  }
  if (K === 'mirror') {
    mirrorBossAI(entity, dt);
    return;
  }
  if (entity.st !== 'stun') entity.sh = 0;
  const cx = entity.x + entity.w / 2,
    pcx = runtime.player.x + runtime.player.w / 2,
    dir = Math.sign(pcx - cx) || 1,
    none = {
      l: 0,
      r: 0,
      jp: 0,
      jh: 0,
    },
    FS = entity.fast ? 1.8 : 1;
  if (K === 'time' || B.king) {
    if (entity.st === 'rew') {
      let p = null;
      for (let i = 0; i < 3 && entity.hb && entity.hb.length > 2; i++) p = entity.hb.pop();
      if (p) {
        entity.x = p[0];
        entity.y = p[1];
      }
      if (!entity.hb || entity.hb.length <= 2 || entity.t <= 0) {
        entity.st = 'idle';
        entity.t = B.idle;
        entity.hb = [];
        entity.vx = 0;
        entity.vy = 0;
        entity.g = false;
      }
      return;
    }
    (entity.hb || (entity.hb = [])).push([entity.x, entity.y]);
    if (entity.hb.length > 150) entity.hb.shift();
  }
  // ---- phases en vol (L'Envol)
  if (entity.fly) {
    entity.face = dir;
    entity.ph += dt;
    if (entity.st === 'hover') {
      entity.x += Math.max(-1, Math.min(1, (pcx - cx) / 40)) * 115 * dt;
      entity.y = 96 + Math.sin(entity.ph * 3) * 9;
      if (entity.t <= 0) {
        entity.st = 'ftele';
        entity.t = B.tele;
      }
    } else if (entity.st === 'ftele') {
      entity.x += Math.max(-1, Math.min(1, (pcx - cx) / 40)) * 60 * dt + Math.sin(entity.ph * 70) * 1.6;
      if (entity.t <= 0) {
        entity.st = 'dive';
        const tx = pcx - entity.w / 2,
          ty = FLOOR_Y - entity.h,
          dx = tx - entity.x,
          dy = ty - entity.y,
          d = Math.hypot(dx, dy) || 1;
        entity.vx = (dx / d) * 590;
        entity.vy = (dy / d) * 590;
        entity.combo = entity.n++ % 2 === 1;
      }
    } else if (entity.st === 'dive') {
      entity.x += entity.vx * dt;
      entity.y += entity.vy * dt;
      entity.x = Math.max(34, Math.min(WIDTH - 34 - entity.w, entity.x));
      if (entity.y + entity.h >= FLOOR_Y) {
        entity.y = FLOOR_Y - entity.h;
        entity.fly = 0;
        entity.vx = 0;
        entity.vy = 0;
        entity.g = true;
        gameState.shake = 0.35;
        playSfx('land');
        if (entity.combo) {
          entity.st = 'tele';
          entity.kind = 'charge';
          entity.t = 0.55;
        } else {
          entity.st = 'stun';
          entity.t = (B.stun || 2) + 0.4;
        }
      }
    } else if (entity.st === 'rise') {
      entity.y -= 280 * dt;
      entity.x += Math.max(-1, Math.min(1, (pcx - cx) / 40)) * 80 * dt;
      if (entity.y <= 96) {
        entity.y = 96;
        entity.st = 'hover';
        entity.t = 1.3;
        entity.ph = 0;
      }
    }
    return;
  }
  // ---- phases au sol
  if (entity.st === 'idle') {
    entity.face = dir;
    if (K === 'mirror' || K === 'king') {
      const tx = Math.max(70, Math.min(WIDTH - 70 - entity.w / 2, WIDTH - pcx + (entity.id ? 75 : -75))),
        dd = tx - cx;
      entity.spd = 190;
      moveBody(
        entity,
        {
          l: dd < -12 ? 1 : 0,
          r: dd > 12 ? 1 : 0,
          jp: 0,
          jh: 0,
        },
        dt,
      );
    } else if (K === 'shooter') {
      const dx = pcx - cx,
        ad = Math.abs(dx);
      entity.spd = B.spd;
      moveBody(
        entity,
        {
          l: ad < 190 && dx > 0 ? 1 : ad > 300 && dx < 0 ? 1 : 0,
          r: ad < 190 && dx < 0 ? 1 : ad > 300 && dx > 0 ? 1 : 0,
          jp: 0,
          jh: 0,
        },
        dt,
      );
    } else if (K === 'twin') {
      const dx = pcx - cx,
        dyy = entity.y + entity.h - (runtime.player.y + runtime.player.h),
        gap = entity.fast
          ? dyy > 40
            ? entity.w / 2 + 150
            : dyy < -40
              ? 20
              : entity.w / 2 + 80
          : entity.w / 2 + 80;
      entity.spd = 75 * FS;
      moveBody(
        entity,
        {
          l: dx < -gap ? 1 : 0,
          r: dx > gap ? 1 : 0,
          jp: 0,
          jh: 0,
        },
        dt,
      );
    } else if (K === 'time') {
      const dx = pcx - cx;
      entity.spd = 62;
      moveBody(
        entity,
        {
          l: dx < -150 ? 1 : 0,
          r: dx > 150 ? 1 : 0,
          jp: 0,
          jh: 0,
        },
        dt,
      );
    } else {
      entity.spd = 0;
      moveBody(entity, none, dt);
    }
    if (entity.t <= 0) {
      entity.st = 'tele';
      entity.t = (B.tele || 0.6) / (entity.fast ? 1.4 : 1);
      entity.spd = 0;
      entity.kind =
        K === 'king'
          ? ['charge', 'shoot', 'hop', 'stomp', 'dash', 'fly'][entity.n++ % 6]
          : K === 'mirror'
            ? 'hop'
            : K === 'twin'
              ? entity.fast
                ? entity.y + entity.h - (runtime.player.y + runtime.player.h) > 40 && Math.abs(pcx - cx) < 430
                  ? 'hop'
                  : entity.n++ % 3 === 2
                    ? 'hop'
                    : 'charge'
                : entity.n++ % 2
                  ? 'hop'
                  : 'charge'
              : K === 'giant'
                ? entity.n++ % 2
                  ? 'stomp'
                  : 'charge'
                : K === 'bolt'
                  ? 'dash'
                  : K === 'shooter'
                    ? 'shoot'
                    : 'charge';
    }
  } else if (entity.st === 'tele') {
    entity.face = dir;
    moveBody(entity, none, dt);
    if (entity.t <= 0) {
      if (K === 'twin' && entity.kind === 'hop' && isHopBlocked(entity, pcx, cx)) entity.kind = 'charge';
      if (entity.kind === 'charge') {
        entity.st = 'charge';
        entity.t = 6;
        entity.dirc = dir;
        entity.spd = B.spd * FS;
      } else if (entity.kind === 'dash') {
        entity.st = 'dash';
        entity.t = 0.22;
        entity.dirc = dir;
        entity.dn = 3;
      } else if (entity.kind === 'stomp') {
        entity.st = 'stomp';
        entity.t = 0.45;
      } else if (entity.kind === 'fly') {
        entity.fly = 1;
        entity.st = 'rise';
        entity.g = false;
        entity.vx = 0;
        entity.vy = 0;
      } else if (entity.kind === 'shoot') {
        entity.st = 'volley';
        entity.t = 1.0;
        entity.dirc = dir;
        entity.vn = 0;
      } else {
        entity.st = entity.kind === 'slam' ? 'slam' : 'hop';
        entity.t = 3;
        entity.vy = entity.kind === 'slam' ? -950 : -800;
        entity.g = false;
        entity.vx = Math.max(-300, Math.min(300, (pcx - cx) / (entity.kind === 'slam' ? 1 : 0.84)));
        entity.vx = entity.kind === 'slam' ? Math.max(-260, Math.min(260, (pcx - cx) / 1.0)) : entity.vx;
        if (entity.fast && entity.kind !== 'slam') entity.vx *= 1.6;
        entity.lock = 1.6;
        entity.dirc = dir;
      }
    }
  } else if (entity.st === 'dpause') {
    entity.face = dir;
    moveBody(entity, none, dt);
    if (entity.t <= 0) {
      entity.st = 'dash';
      entity.t = 0.22;
      entity.dirc = dir;
    }
  } else if (entity.st === 'charge') {
    // il fonce : seul un mur le sonne ; s'il dépasse le joueur de 5 cases, il fait demi-tour et repart vers lui
    entity.face = entity.dirc;
    moveBody(
      entity,
      {
        l: entity.dirc < 0 ? 1 : 0,
        r: entity.dirc > 0 ? 1 : 0,
        jp: 0,
        jh: 0,
      },
      dt,
    );
    if (entity.t > 0 && entity.t < 5.6 && Math.abs(entity.vx) < 30 && gameState.perch > 2) {
      entity.st = 'tele';
      entity.kind = 'charge';
      entity.t = 0.25;
      entity.vx = 0;
      entity.spd = 0;
    } else if (entity.t <= 0 || (entity.t < 5.6 && Math.abs(entity.vx) < 30)) {
      entity.st = 'stun';
      entity.t = B.stun || 2.3;
      entity.vx = 0;
      entity.spd = 0;
      gameState.shake = 0.3;
      playSfx('clang');
    } else if ((cx - pcx) * entity.dirc > 5 * TILE) {
      entity.st = 'tele';
      entity.kind = 'charge';
      entity.t = 0.2;
      entity.vx *= 0.3;
      entity.spd = 0;
    }
  } else if (entity.st === 'dash') {
    entity.face = entity.dirc;
    entity.lock = 0.1;
    entity.vx = entity.dirc * 870;
    moveBody(entity, none, dt);
    if (entity.t <= 0 || Math.abs(entity.vx) < 30) {
      entity.vx = 0;
      entity.lock = 0;
      entity.dn--;
      gameState.shake = 0.12;
      if (entity.dn <= 0) {
        entity.st = 'stun';
        entity.t = B.stun || 1.9;
      } else {
        entity.st = 'dpause';
        entity.t = 0.6;
      }
    }
  } else if (entity.st === 'stomp') {
    entity.face = dir;
    moveBody(entity, none, dt);
    if (entity.t <= 0) {
      for (const sd of [-1, 1])
        runtime.entities.push({
          k: 's',
          x: cx - 13 + (sd * entity.w) / 2,
          y: FLOOR_Y - 24,
          vx: sd * 330,
          vy: 0,
          w: 26,
          h: 24,
          alive: 1,
          life: 2.4,
          face: sd,
        });
      entity.st = 'stun';
      entity.t = B.stun || 2;
      entity.vx = 0;
      entity.spd = 0;
      gameState.shake = 0.4;
      playSfx('land');
    }
  } else if (entity.st === 'volley') {
    entity.face = entity.dirc;
    moveBody(entity, none, dt);
    const ys = [FLOOR_Y - 12, FLOOR_Y - 52, FLOOR_Y - 12],
      at = [0.8, 0.5, 0.2];
    while (entity.vn < 3 && entity.t <= at[entity.vn]) {
      runtime.entities.push({
        k: 's',
        bul: 1,
        spell: K === 'shooter' ? 1 : 0,
        tn: entity.vn,
        x: cx + entity.dirc * (entity.w / 2 + 4) - 5,
        y: ys[entity.vn] - 5,
        vx: entity.dirc * 340 * (K === 'shooter' ? 1 + ((entity.wf || 1) - 1) * 0.45 : 1),
        vy: 0,
        w: 10,
        h: 10,
        d: 0,
        alive: 1,
        life: K === 'shooter' ? 7 : 3,
        face: entity.dirc,
      });
      entity.vn++;
      playSfx('shot');
    }
    if (entity.t <= 0) {
      entity.sv = (entity.sv || 0) + 1;
      if (K === 'shooter') {
        entity.sv = 0;
        entity.st = 'idle';
        entity.t = 0.7;
      } else if (entity.sv >= 2) {
        entity.sv = 0;
        entity.st = 'stun';
        entity.t = B.stun || 2;
        entity.spd = 0;
        gameState.shake = 0.3;
        playSfx('clang');
      } else {
        entity.st = 'idle';
        entity.t = 0.5;
      }
    }
  } else if (entity.st === 'hop' || entity.st === 'slam') {
    entity.face = entity.dirc;
    moveBody(
      entity,
      {
        l: 0,
        r: 0,
        jp: 0,
        jh: 1,
      },
      dt,
    );
    if (entity.g || entity.t <= 0) {
      if (entity.st === 'slam') {
        for (const sd of [-1, 1])
          runtime.entities.push({
            k: 's',
            x: cx - 13 + (sd * entity.w) / 2,
            y: FLOOR_Y - 24,
            vx: sd * 330,
            vy: 0,
            w: 26,
            h: 24,
            alive: 1,
            life: 2.4,
            face: sd,
          });
      }
      entity.st = 'stun';
      entity.t = (B.stun || 2) * (entity.fast ? 0.5 : 1);
      entity.vx = 0;
      entity.spd = 0;
      gameState.shake = 0.35;
      playSfx('land');
    }
  } else if (entity.st === 'rage') {
    entity.face = dir;
    entity.dirc = dir;
    moveBody(entity, none, dt);
    entity.vx = 0;
    entity.rc = (entity.rc || 0) - dt;
    while (entity.rc <= 0) {
      entity.rc += 0.15;
      entity.rh = (entity.rh || 0) + 1;
      const hi = Math.random() < 0.5,
        y0 = hi ? FLOOR_Y - 52 : FLOOR_Y - 12;
      runtime.entities.push({
        k: 's',
        bul: 1,
        spell: 1,
        tn: hi ? 1 : 0,
        x: cx + dir * (entity.w / 2 + 4) - 5,
        y: y0 - 5,
        vx: dir * 380,
        vy: 0,
        w: 10,
        h: 10,
        d: 0,
        alive: 1,
        life: 7,
        face: dir,
      });
      playSfx('shot');
    }
    if (entity.t <= 0) {
      entity.st = 'idle';
      entity.t = 0.8;
    }
  } else if (entity.st === 'stun') {
    entity.spd = 0;
    moveBody(entity, none, dt);
    entity.vx *= 0.9;
    if (entity.t <= 0) {
      if (K === 'shooter') {
        entity.st = 'rage';
        entity.t = 3;
        entity.rc = 0;
        gameState.shake = 0.2;
      } else if (K === 'wing') {
        entity.st = 'rise';
        entity.fly = 1;
        entity.kind = 'charge';
      } else {
        entity.st = 'idle';
        entity.t = (B.idle || 0.7) / FS;
      }
    }
  }
}
