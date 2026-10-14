import { runtime } from '../state/runtime.js';
import { FLOOR, G, T, W } from '../core/config.js';
import { gameState, say } from '../state/state.js';
import { hurtP } from './rewind.js';
import { collide, moveBody, ov } from './physics.js';
import { colossusAI } from './colossus.js';
import { reflAI } from './reflets.js';
import { sfx } from '../audio/audio.js';
// un bond sous une plateforme le sonnerait aussitôt : on simule la trajectoire
function hopBlocked(e, pcx, cx) {
  let vx = Math.max(-300, Math.min(300, (pcx - cx) / 0.84));
  if (e.fast) vx *= 1.6;
  let x = e.x,
    y = e.y,
    vy = -800;
  for (let i = 0; i < 120; i++) {
    const dt = 1 / 60;
    vy += G * dt;
    x += vx * dt;
    y += vy * dt;
    if (y + e.h >= FLOOR) return false;
    if (
      collide({
        x: Math.max(34, Math.min(W - 34 - e.w, x)),
        y,
        w: e.w,
        h: e.h,
      })
    )
      return !e.fast || vy < 0;
  }
  return false;
}
const GH_R = 5 * T;
function ghostBossAI(e, dt) {
  const B = runtime.level.boss,
    cx0 = W / 2,
    lo = cx0 - GH_R - e.w / 2,
    hi = cx0 + GH_R - e.w / 2,
    cx = e.x + e.w / 2,
    pcx = runtime.player.x + runtime.player.w / 2,
    dir = pcx >= cx ? 1 : -1;
  if (!e.gi) {
    e.gi = 1;
    e.x = cx0 - e.w / 2;
    e.st = 'idle';
    e.t = 1.2;
    e.tx = cx0;
    e.vx = 0;
  }
  if (e.x < lo) {
    e.x = lo;
    e.vx = Math.max(0, e.vx);
  }
  if (e.x > hi) {
    e.x = hi;
    e.vx = Math.min(0, e.vx);
  }
  if (e.st === 'idle') {
    e.face = dir;
    e.spd = 70;
    const dd = e.tx - cx;
    moveBody(
      e,
      {
        l: dd < -8 ? 1 : 0,
        r: dd > 8 ? 1 : 0,
        jp: 0,
        jh: 0,
      },
      dt,
    );
    if (Math.abs(dd) <= 8 && e.t > 0.6) e.tx = cx0 + (Math.random() * 2 - 1) * GH_R;
    if (e.t <= 0) {
      e.st = 'tele';
      e.t = B.tele || 0.5;
      e.vx = 0;
      e.spd = 0;
    }
  } else if (e.st === 'tele') {
    e.face = dir;
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
      e.st = 'charge';
      e.dirc = dir;
      e.t = 1.1;
      e.spd = B.spd;
    }
  } else if (e.st === 'charge') {
    e.face = e.dirc;
    moveBody(
      e,
      {
        l: e.dirc < 0 ? 1 : 0,
        r: e.dirc > 0 ? 1 : 0,
        jp: 0,
        jh: 0,
      },
      dt,
    );
    if (e.t <= 0 || (e.dirc < 0 && e.x <= lo + 1) || (e.dirc > 0 && e.x >= hi - 1)) {
      e.st = 'rest';
      e.t = 1.3;
      e.vx = 0;
      e.spd = 0;
      gameState.shake = 0.12;
    }
  } else if (e.st === 'rest') {
    e.face = dir;
    e.vx *= 0.8;
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
      e.t = 1.4;
      e.tx = cx0 + (Math.random() * 2 - 1) * GH_R;
    }
  } else if (e.st === 'stun') {
    e.vx *= 0.85;
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
      e.t = 1.0;
    }
  }
  if (e.x < lo) {
    e.x = lo;
    e.vx = 0;
  }
  if (e.x > hi) {
    e.x = hi;
    e.vx = 0;
  }
}
function boltAI(e, dt) {
  const B = runtime.level.boss,
    cx = e.x + e.w / 2,
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
  if (!e.bi) {
    e.bi = 1;
    e.st = 'idle';
    e.t = 1.0;
    e.n = 0;
    e.bc = 0;
    e.ft = 0;
  }
  if (e.st !== 'stun') e.sh = 0;
  e.ft = Math.max(0, (e.ft || 0) - dt);
  if (e.st === 'idle') {
    e.face = dir;
    e.spd = 0;
    moveBody(e, none0, dt);
    if (d < 90 && e.t > 0.18) e.t = 0.18;
    if (e.t <= 0) {
      e.n++;
      if (e.n % 4 === 0) {
        e.st = 'crouch';
        e.t = 1.2;
        e.dirc = dir;
      } else if (d < 110) {
        e.st = 'slap';
        e.t = 0.5;
        e.sl = 0;
      } else if (d > 120) {
        e.st = 'blink';
        e.bc = 0;
        e.bs = 0;
        e.t = 0.14;
      } else {
        e.st = 'slap';
        e.t = 0.5;
        e.sl = 0;
      }
    }
  } else if (e.st === 'crouch') {
    e.spd = 0;
    moveBody(e, none0, dt);
    if (e.t > 0.3) {
      e.dirc = dir;
      e.face = dir;
    } else e.face = e.dirc;
    if (e.t <= 0) {
      e.st = 'dash';
      e.t = 1.5;
      e.face = e.dirc;
    }
  } else if (e.st === 'dash') {
    e.face = e.dirc;
    e.lock = 0.1;
    e.vx = e.dirc * 900;
    moveBody(e, none0, dt);
    const atWall = e.x <= T + 10 || e.x >= W - T - e.w - 10;
    if (e.t <= 0 || Math.abs(e.vx) < 30) {
      e.vx = 0;
      e.lock = 0;
      if (atWall || e.t > 0) {
        e.st = 'stun';
        e.t = B.stun || 1.8;
        gameState.shake = 0.35;
        sfx('clang');
      } else {
        e.st = 'rest';
        e.t = 0.5;
      }
    }
  } else if (e.st === 'rest') {
    e.vx *= 0.8;
    moveBody(e, none0, dt);
    if (e.t <= 0) {
      e.st = 'idle';
      e.t = 0.4;
    }
  } else if (e.st === 'blink') {
    e.face = dir;
    e.vx = 0;
    moveBody(e, none0, dt);
    if (e.t <= 0) {
      if (e.bs === 0) {
        const step = Math.min(170, Math.max(0, d - 70)),
          ox = e.x;
        e.fa0 = cx;
        e.x = Math.max(T + 4, Math.min(W - T - e.w - 4, e.x + dir * step));
        if (collide(e)) e.x = ox;
        e.fa1 = e.x + e.w / 2;
        e.ft = 0.35;
        e.bs = 1;
        e.t = 0.14;
        sfx('shot');
      } else {
        e.bc++;
        if (e.bc >= 2) {
          e.st = 'idle';
          e.t = 0.3;
        } else {
          e.bs = 0;
          e.t = 0.2;
        }
      }
    }
  } else if (e.st === 'slap') {
    e.spd = 0;
    moveBody(e, none0, dt);
    if (e.t > 0.24) e.face = dir;
    e.sl = e.t <= 0.2 && e.t > 0.08 ? 1 : 0;
    if (e.t <= 0) {
      e.sl = 0;
      e.st = 'idle';
      e.t = 0.5;
    }
  } else if (e.st === 'stun') {
    e.vx *= 0.85;
    moveBody(e, none0, dt);
    if (e.t <= 0) {
      e.st = 'idle';
      e.t = 0.8;
    }
  }
  // le clone (Miroir, Jumeau, Rémanence) pris dans une gifle ou un dash est détruit : le joueur encaisse aussi
  if (
    runtime.echoClone &&
    ((e.st === 'slap' &&
      e.sl &&
      ov(runtime.echoClone, {
        x: e.face > 0 ? e.x + e.w - 4 : e.x - 48,
        y: e.y + 6,
        w: 52,
        h: e.h - 10,
      })) ||
      (e.st === 'dash' && ov(runtime.echoClone, e, 6)))
  ) {
    const cx0 = runtime.echoClone.x + runtime.echoClone.w / 2;
    runtime.echoClone = null;
    gameState.cd = 0.6;
    sfx('off');
    say('Ton clone est détruit : tu encaisses aussi !', 2.2);
    if (gameState.inv <= 0) hurtP(1, false, cx0);
  }
}
export function bossAI(e, dt) {
  runtime.KG = runtime.level.boss && runtime.level.boss.king ? 1 : 0;
  runtime.BM =
    runtime.level.boss && runtime.level.boss.kind === 'giant'
      ? 1
      : runtime.level.boss && runtime.level.boss.kind === 'mirror'
        ? 2
        : 0;
  try {
    bossAI1(e, dt);
  } finally {
    runtime.KG = 0;
    runtime.BM = 0;
  }
}
function bossAI1(e, dt) {
  const B = runtime.level.boss,
    K = B.kind;
  e.t -= dt;
  if (K === 'shooter' && e.st !== 'stun' && e.st !== 'rage') {
    e.wf = e.hp >= 4 ? 1 : e.hp === 3 ? 1.25 : e.hp === 2 ? 1.55 : 1.9;
    e.t -= dt * (e.wf - 1);
  }
  e.inv = Math.max(0, e.inv - dt);
  if (K === 'giant') {
    colossusAI(e, dt);
    return;
  }
  if (K === 'ghost') {
    ghostBossAI(e, dt);
    return;
  }
  if (K === 'bolt') {
    boltAI(e, dt);
    return;
  }
  if (K === 'mirror') {
    reflAI(e, dt);
    return;
  }
  if (e.st !== 'stun') e.sh = 0;
  const cx = e.x + e.w / 2,
    pcx = runtime.player.x + runtime.player.w / 2,
    dir = Math.sign(pcx - cx) || 1,
    none = {
      l: 0,
      r: 0,
      jp: 0,
      jh: 0,
    },
    FS = e.fast ? 1.8 : 1;
  if (K === 'time' || B.king) {
    if (e.st === 'rew') {
      let p = null;
      for (let i = 0; i < 3 && e.hb && e.hb.length > 2; i++) p = e.hb.pop();
      if (p) {
        e.x = p[0];
        e.y = p[1];
      }
      if (!e.hb || e.hb.length <= 2 || e.t <= 0) {
        e.st = 'idle';
        e.t = B.idle;
        e.hb = [];
        e.vx = 0;
        e.vy = 0;
        e.g = false;
      }
      return;
    }
    (e.hb || (e.hb = [])).push([e.x, e.y]);
    if (e.hb.length > 150) e.hb.shift();
  }
  // ---- phases en vol (L'Envol)
  if (e.fly) {
    e.face = dir;
    e.ph += dt;
    if (e.st === 'hover') {
      e.x += Math.max(-1, Math.min(1, (pcx - cx) / 40)) * 115 * dt;
      e.y = 96 + Math.sin(e.ph * 3) * 9;
      if (e.t <= 0) {
        e.st = 'ftele';
        e.t = B.tele;
      }
    } else if (e.st === 'ftele') {
      e.x += Math.max(-1, Math.min(1, (pcx - cx) / 40)) * 60 * dt + Math.sin(e.ph * 70) * 1.6;
      if (e.t <= 0) {
        e.st = 'dive';
        const tx = pcx - e.w / 2,
          ty = FLOOR - e.h,
          dx = tx - e.x,
          dy = ty - e.y,
          d = Math.hypot(dx, dy) || 1;
        e.vx = (dx / d) * 590;
        e.vy = (dy / d) * 590;
        e.combo = e.n++ % 2 === 1;
      }
    } else if (e.st === 'dive') {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.x = Math.max(34, Math.min(W - 34 - e.w, e.x));
      if (e.y + e.h >= FLOOR) {
        e.y = FLOOR - e.h;
        e.fly = 0;
        e.vx = 0;
        e.vy = 0;
        e.g = true;
        gameState.shake = 0.35;
        sfx('land');
        if (e.combo) {
          e.st = 'tele';
          e.kind = 'charge';
          e.t = 0.55;
        } else {
          e.st = 'stun';
          e.t = (B.stun || 2) + 0.4;
        }
      }
    } else if (e.st === 'rise') {
      e.y -= 280 * dt;
      e.x += Math.max(-1, Math.min(1, (pcx - cx) / 40)) * 80 * dt;
      if (e.y <= 96) {
        e.y = 96;
        e.st = 'hover';
        e.t = 1.3;
        e.ph = 0;
      }
    }
    return;
  }
  // ---- phases au sol
  if (e.st === 'idle') {
    e.face = dir;
    if (K === 'mirror' || K === 'king') {
      const tx = Math.max(70, Math.min(W - 70 - e.w / 2, W - pcx + (e.id ? 75 : -75))),
        dd = tx - cx;
      e.spd = 190;
      moveBody(
        e,
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
      e.spd = B.spd;
      moveBody(
        e,
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
        dyy = e.y + e.h - (runtime.player.y + runtime.player.h),
        gap = e.fast ? (dyy > 40 ? e.w / 2 + 150 : dyy < -40 ? 20 : e.w / 2 + 80) : e.w / 2 + 80;
      e.spd = 75 * FS;
      moveBody(
        e,
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
      e.spd = 62;
      moveBody(
        e,
        {
          l: dx < -150 ? 1 : 0,
          r: dx > 150 ? 1 : 0,
          jp: 0,
          jh: 0,
        },
        dt,
      );
    } else {
      e.spd = 0;
      moveBody(e, none, dt);
    }
    if (e.t <= 0) {
      e.st = 'tele';
      e.t = (B.tele || 0.6) / (e.fast ? 1.4 : 1);
      e.spd = 0;
      e.kind =
        K === 'king'
          ? ['charge', 'shoot', 'hop', 'stomp', 'dash', 'fly'][e.n++ % 6]
          : K === 'mirror'
            ? 'hop'
            : K === 'twin'
              ? e.fast
                ? e.y + e.h - (runtime.player.y + runtime.player.h) > 40 && Math.abs(pcx - cx) < 430
                  ? 'hop'
                  : e.n++ % 3 === 2
                    ? 'hop'
                    : 'charge'
                : e.n++ % 2
                  ? 'hop'
                  : 'charge'
              : K === 'giant'
                ? e.n++ % 2
                  ? 'stomp'
                  : 'charge'
                : K === 'bolt'
                  ? 'dash'
                  : K === 'shooter'
                    ? 'shoot'
                    : 'charge';
    }
  } else if (e.st === 'tele') {
    e.face = dir;
    moveBody(e, none, dt);
    if (e.t <= 0) {
      if (K === 'twin' && e.kind === 'hop' && hopBlocked(e, pcx, cx)) e.kind = 'charge';
      if (e.kind === 'charge') {
        e.st = 'charge';
        e.t = 6;
        e.dirc = dir;
        e.spd = B.spd * FS;
      } else if (e.kind === 'dash') {
        e.st = 'dash';
        e.t = 0.22;
        e.dirc = dir;
        e.dn = 3;
      } else if (e.kind === 'stomp') {
        e.st = 'stomp';
        e.t = 0.45;
      } else if (e.kind === 'fly') {
        e.fly = 1;
        e.st = 'rise';
        e.g = false;
        e.vx = 0;
        e.vy = 0;
      } else if (e.kind === 'shoot') {
        e.st = 'volley';
        e.t = 1.0;
        e.dirc = dir;
        e.vn = 0;
      } else {
        e.st = e.kind === 'slam' ? 'slam' : 'hop';
        e.t = 3;
        e.vy = e.kind === 'slam' ? -950 : -800;
        e.g = false;
        e.vx = Math.max(-300, Math.min(300, (pcx - cx) / (e.kind === 'slam' ? 1 : 0.84)));
        e.vx = e.kind === 'slam' ? Math.max(-260, Math.min(260, (pcx - cx) / 1.0)) : e.vx;
        if (e.fast && e.kind !== 'slam') e.vx *= 1.6;
        e.lock = 1.6;
        e.dirc = dir;
      }
    }
  } else if (e.st === 'dpause') {
    e.face = dir;
    moveBody(e, none, dt);
    if (e.t <= 0) {
      e.st = 'dash';
      e.t = 0.22;
      e.dirc = dir;
    }
  } else if (e.st === 'charge') {
    // il fonce : seul un mur le sonne ; s'il dépasse le joueur de 5 cases, il fait demi-tour et repart vers lui
    e.face = e.dirc;
    moveBody(
      e,
      {
        l: e.dirc < 0 ? 1 : 0,
        r: e.dirc > 0 ? 1 : 0,
        jp: 0,
        jh: 0,
      },
      dt,
    );
    if (e.t > 0 && e.t < 5.6 && Math.abs(e.vx) < 30 && gameState.perch > 2) {
      e.st = 'tele';
      e.kind = 'charge';
      e.t = 0.25;
      e.vx = 0;
      e.spd = 0;
    } else if (e.t <= 0 || (e.t < 5.6 && Math.abs(e.vx) < 30)) {
      e.st = 'stun';
      e.t = B.stun || 2.3;
      e.vx = 0;
      e.spd = 0;
      gameState.shake = 0.3;
      sfx('clang');
    } else if ((cx - pcx) * e.dirc > 5 * T) {
      e.st = 'tele';
      e.kind = 'charge';
      e.t = 0.2;
      e.vx *= 0.3;
      e.spd = 0;
    }
  } else if (e.st === 'dash') {
    e.face = e.dirc;
    e.lock = 0.1;
    e.vx = e.dirc * 870;
    moveBody(e, none, dt);
    if (e.t <= 0 || Math.abs(e.vx) < 30) {
      e.vx = 0;
      e.lock = 0;
      e.dn--;
      gameState.shake = 0.12;
      if (e.dn <= 0) {
        e.st = 'stun';
        e.t = B.stun || 1.9;
      } else {
        e.st = 'dpause';
        e.t = 0.6;
      }
    }
  } else if (e.st === 'stomp') {
    e.face = dir;
    moveBody(e, none, dt);
    if (e.t <= 0) {
      for (const sd of [-1, 1])
        runtime.ents.push({
          k: 's',
          x: cx - 13 + (sd * e.w) / 2,
          y: FLOOR - 24,
          vx: sd * 330,
          vy: 0,
          w: 26,
          h: 24,
          alive: 1,
          life: 2.4,
          face: sd,
        });
      e.st = 'stun';
      e.t = B.stun || 2;
      e.vx = 0;
      e.spd = 0;
      gameState.shake = 0.4;
      sfx('land');
    }
  } else if (e.st === 'volley') {
    e.face = e.dirc;
    moveBody(e, none, dt);
    const ys = [FLOOR - 12, FLOOR - 52, FLOOR - 12],
      at = [0.8, 0.5, 0.2];
    while (e.vn < 3 && e.t <= at[e.vn]) {
      runtime.ents.push({
        k: 's',
        bul: 1,
        spell: K === 'shooter' ? 1 : 0,
        tn: e.vn,
        x: cx + e.dirc * (e.w / 2 + 4) - 5,
        y: ys[e.vn] - 5,
        vx: e.dirc * 340 * (K === 'shooter' ? 1 + ((e.wf || 1) - 1) * 0.45 : 1),
        vy: 0,
        w: 10,
        h: 10,
        d: 0,
        alive: 1,
        life: K === 'shooter' ? 7 : 3,
        face: e.dirc,
      });
      e.vn++;
      sfx('shot');
    }
    if (e.t <= 0) {
      e.sv = (e.sv || 0) + 1;
      if (K === 'shooter') {
        e.sv = 0;
        e.st = 'idle';
        e.t = 0.7;
      } else if (e.sv >= 2) {
        e.sv = 0;
        e.st = 'stun';
        e.t = B.stun || 2;
        e.spd = 0;
        gameState.shake = 0.3;
        sfx('clang');
      } else {
        e.st = 'idle';
        e.t = 0.5;
      }
    }
  } else if (e.st === 'hop' || e.st === 'slam') {
    e.face = e.dirc;
    moveBody(
      e,
      {
        l: 0,
        r: 0,
        jp: 0,
        jh: 1,
      },
      dt,
    );
    if (e.g || e.t <= 0) {
      if (e.st === 'slam') {
        for (const sd of [-1, 1])
          runtime.ents.push({
            k: 's',
            x: cx - 13 + (sd * e.w) / 2,
            y: FLOOR - 24,
            vx: sd * 330,
            vy: 0,
            w: 26,
            h: 24,
            alive: 1,
            life: 2.4,
            face: sd,
          });
      }
      e.st = 'stun';
      e.t = (B.stun || 2) * (e.fast ? 0.5 : 1);
      e.vx = 0;
      e.spd = 0;
      gameState.shake = 0.35;
      sfx('land');
    }
  } else if (e.st === 'rage') {
    e.face = dir;
    e.dirc = dir;
    moveBody(e, none, dt);
    e.vx = 0;
    e.rc = (e.rc || 0) - dt;
    while (e.rc <= 0) {
      e.rc += 0.15;
      e.rh = (e.rh || 0) + 1;
      const hi = Math.random() < 0.5,
        y0 = hi ? FLOOR - 52 : FLOOR - 12;
      runtime.ents.push({
        k: 's',
        bul: 1,
        spell: 1,
        tn: hi ? 1 : 0,
        x: cx + dir * (e.w / 2 + 4) - 5,
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
      sfx('shot');
    }
    if (e.t <= 0) {
      e.st = 'idle';
      e.t = 0.8;
    }
  } else if (e.st === 'stun') {
    e.spd = 0;
    moveBody(e, none, dt);
    e.vx *= 0.9;
    if (e.t <= 0) {
      if (K === 'shooter') {
        e.st = 'rage';
        e.t = 3;
        e.rc = 0;
        gameState.shake = 0.2;
      } else if (K === 'wing') {
        e.st = 'rise';
        e.fly = 1;
        e.kind = 'charge';
      } else {
        e.st = 'idle';
        e.t = (B.idle || 0.7) / FS;
      }
    }
  }
}
