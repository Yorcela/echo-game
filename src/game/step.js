import { runtime } from '../state/runtime.js';
import { FLOOR, H, PH0, PW0, T, W } from '../core/config.js';
import { IDLE, actions, gameState, input, say } from '../state/state.js';
import { save } from '../state/save.js';
import { gateMsg, go, hurtP, snap, startRewind } from './rewind.js';
import {
  gateOK,
  hurt,
  linkAt,
  moveBody,
  ov,
  sealLand,
  sealRoom,
  syncHoles,
  updCrumble,
  updDoors,
  updPlates,
} from './physics.js';
import { cycle, setSize, useEcho } from './echoes.js';
import { bossAI, bossHit, doHit, fire, hitCheck, stomp, updShots } from './combat.js';
import { ghost, hitSrc, hitSrcOf, updEnts } from './reflets.js';
import { sfx } from '../audio/audio.js';
/* ---------- Pas de simulation (60 Hz fixe) ---------- */
export function step(dt) {
  if (actions.r5) {
    actions.r5 = 0;
    startRewind(5);
  }
  if (actions.r10) {
    actions.r10 = 0;
    startRewind(10);
  }
  if (gameState.mode !== 'play') {
    return;
  }
  if (actions.cyc) {
    actions.cyc = 0;
    cycle();
  }
  if (actions.cl) {
    actions.cl = 0;
    useEcho();
  }
  let hf = 0,
    tf = 0;
  if (actions.hit) {
    actions.hit = 0;
    hf = doHit() ? 1 : 0;
  }
  const inp = {
    l: input.l,
    r: input.r,
    u: input.u,
    d: input.d,
    jp: input.jp,
    jh: input.jh,
    js: input.js,
    ht: hf,
    tr: 0,
  };
  input.js = 0;
  if (runtime.player.big) {
    if (input.jp && gameState.msgT <= 0)
      say('Trop lourd pour sauter ! Rappuie sur Écho pour redevenir normal', 2.4);
    inp.jp = 0;
    inp.jh = 0;
  }
  input.jp = 0;
  snap.inp = inp;
  if (actions.tir) {
    actions.tir = 0;
    inp.tr = fire() ? 1 : 0;
  }
  if (
    !gameState.sealed &&
    runtime.level.boss &&
    !runtime.level.king &&
    runtime.player.x > 44 &&
    runtime.player.x + runtime.player.w < W - 44 &&
    bossAI.any()
  )
    sealRoom();
  if (gameState.sealed === 1 && gameState.time - gameState.sealAt >= 0.4) sealLand();
  gameState.perch =
    runtime.player.g && runtime.player.y + runtime.player.h < FLOOR - 10 ? (gameState.perch || 0) + dt : 0;
  gameState.cd = Math.max(0, gameState.cd - dt);
  gameState.hintT += dt;
  gameState.msgT = Math.max(0, gameState.msgT - dt);
  if (gameState.msgT <= 0)
    for (const k of runtime.level.links) {
      if (!k.gate || gateOK(k)) continue;
      const cx = runtime.player.x + runtime.player.w / 2,
        cy = runtime.player.y + runtime.player.h / 2;
      const near =
        k.s === 'b' || k.s === 't'
          ? cx > (k.c0 - 2) * T && cx < (k.c1 + 3) * T && (k.s === 't' ? cy < 9 * T : cy > 9 * T)
          : (k.s === 'l' ? cx < 46 : cx > W - 46) && cy > (k.r0 - 1) * T && cy < (k.r1 + 2) * T;
      if (near) {
        say(gateMsg(k), 3);
        break;
      }
    }
  runtime.player.hcd = Math.max(0, runtime.player.hcd - dt);
  runtime.player.dcd = Math.max(0, runtime.player.dcd - dt);
  runtime.player.hit = Math.max(0, runtime.player.hit - dt);
  runtime.player.fly = gameState.have[5] ? 1 : 0;
  runtime.player.djfx = Math.max(0, (runtime.player.djfx || 0) - dt);
  if (runtime.player.big) {
    runtime.player.bigT -= dt;
    if (runtime.player.bigT <= 0) {
      setSize(runtime.player, PW0, PH0);
      runtime.player.big = 0;
      gameState.cd = 0.6;
      sfx('off');
    }
  }
  const pg = runtime.player.g,
    pvy = runtime.player.vy;
  moveBody(runtime.player, inp, dt);
  if (runtime.player.jumped) {
    sfx('jump');
    runtime.player.jumped = 0;
  }
  if (!pg && runtime.player.g && pvy > 380) sfx('land');
  if (runtime.echoClone) {
    let ci;
    if (runtime.echoClone.type === 0)
      ci = {
        l: inp.r,
        r: inp.l,
        jp: inp.jp,
        jh: inp.jh,
      };
    else if (runtime.echoClone.type === 2) ci = inp;
    else {
      ci = runtime.echoClone.inp[runtime.echoClone.k++] || IDLE;
      if (runtime.echoClone.k >= runtime.echoClone.inp.length)
        runtime.echoClone.ttl = Math.min(runtime.echoClone.ttl, 1.2);
    }
    runtime.echoClone.hit = Math.max(0, (runtime.echoClone.hit || 0) - dt);
    runtime.echoClone.hcd = Math.max(0, (runtime.echoClone.hcd || 0) - dt);
    runtime.echoClone.tcd = Math.max(0, (runtime.echoClone.tcd || 0) - dt);
    moveBody(runtime.echoClone, ci, dt);
    runtime.echoClone.jumped = 0;
    runtime.echoClone.ttl -= dt;
    if (runtime.echoClone.type === 1 ? ci.ht : inp.ht) doHit(runtime.echoClone);
    if (runtime.echoClone.type === 1 ? ci.tr : inp.tr) fire(runtime.echoClone);
    runtime.echoClone.inv = Math.max(0, (runtime.echoClone.inv || 0) - dt);
    // le clone blessé (monstre ou terrain) fait souffrir l'original
    let cd = 0,
      cdie = false;
    if (hurt(runtime.echoClone) || runtime.echoClone.y > H + 40) {
      cd = 0.5;
      cdie = true;
    } else if (runtime.echoClone.inv <= 0) {
      const hs = hitSrcOf(runtime.echoClone);
      if (hs) {
        cd = hs.a;
        runtime.echoClone.inv = 1.4;
      }
    }
    if (cd > 0 && gameState.inv <= 0) {
      say('Ton clone est blessé : tu encaisses aussi !', 2.2);
      const cx0 = runtime.echoClone.x + runtime.echoClone.w / 2;
      if (cdie) {
        runtime.echoClone = null;
        gameState.cd = 0.6;
      }
      hurtP(cd, false, cx0);
      if (gameState.mode !== 'play') return;
    } else if (cdie) {
      runtime.echoClone = null;
      gameState.cd = 0.6;
      sfx('off');
    }
    if (runtime.echoClone && runtime.echoClone.ttl <= 0) {
      runtime.echoClone = null;
      gameState.cd = 0.6;
      sfx('off');
    }
  }
  updEnts(dt);
  if (runtime.level.boss && runtime.level.boss.kind === 'ghost') {
    const g = ghost();
    if (g && g.hit > 0) {
      const box = {
        x: g.face > 0 ? g.x + g.w - 2 : g.x - 28,
        y: g.y + 3,
        w: 30,
        h: g.h - 8,
      };
      for (const e of runtime.ents)
        if (e.alive && e.k === 'b' && e.inv <= 0 && ov(box, e)) {
          if (bossHit(e, g.face, g.big ? 2 : 1)) return;
          e.st = 'stun';
          e.t = 1.2;
          e.vx = 0;
          e.spd = 0;
        }
    }
  }
  if (runtime.player.hit > 0) {
    hitCheck();
    if (gameState.mode !== 'play') return;
  }
  if (runtime.echoClone && runtime.echoClone.hit > 0) {
    hitCheck(runtime.echoClone);
    if (gameState.mode !== 'play') return;
  }
  updCrumble(dt);
  updPlates(dt);
  updDoors();
  syncHoles();
  gameState.inv = Math.max(0, gameState.inv - dt);
  for (const h of runtime.hearts)
    if (
      !h.got &&
      (h.t === 'm' || gameState.hp < gameState.hpMax) &&
      Math.abs(runtime.player.x + runtime.player.w / 2 - h.x) < 26 &&
      Math.abs(runtime.player.y + runtime.player.h / 2 - h.y) < 30
    ) {
      h.got = true;
      gameState.hcol[h.id] = 1;
      if (h.t === 'm') {
        gameState.hp = gameState.hpMax;
        gameState.sh = Math.min(6, gameState.sh + 1);
        say('Cœur bleu ! Cœurs rechargés + un bouclier temporaire', 3);
      } else {
        gameState.hp = Math.min(gameState.hpMax, gameState.hp + 1);
        say('+1 cœur !', 1.5);
      }
      save();
      sfx('win');
    }
  // immobilité : +¼ de cœur toutes les 5 s ; la jauge du Temps ne se recharge que cœurs pleins
  {
    const still =
      runtime.player.g && !input.l && !input.r && Math.abs(runtime.player.vx) < 8 && !runtime.player.big_;
    if (still && gameState.hp < gameState.hpMax - 1e-6) {
      gameState.idle += dt;
      if (gameState.idle >= 5) {
        gameState.idle = 0;
        gameState.hp = Math.min(gameState.hpMax, gameState.hp + 0.25);
        sfx('tick');
      }
    } else gameState.idle = 0;
  }
  {
    const cxp = runtime.player.x + runtime.player.w / 2;
    if (runtime.statue) {
      const near =
        Math.abs(cxp - runtime.statue.x) < 30 &&
        Math.abs(runtime.player.y + runtime.player.h - runtime.statue.y) < 20;
      if (!near) gameState.stA = 1;
      else if (gameState.stA) {
        gameState.stA = 0;
        gameState.ck = gameState.lvl;
        save();
        sfx('win');
        say('Statut : partie sauvegardée', 2.5);
      }
    }
    gameState.bedNear = false;
    if (runtime.bed) {
      const near =
        runtime.player.g &&
        Math.abs(cxp - runtime.bed.x) < 40 &&
        Math.abs(runtime.player.y + runtime.player.h - runtime.bed.y) < 22;
      if (near && (gameState.hp < gameState.hpMax - 1e-6 || (gameState.haveT && gameState.gauge < 10 - 1e-6)))
        gameState.bedNear = true;
    }
  }
  stomp();
  updShots(dt);
  if (runtime.player.y > H + 40) {
    hurtP(0.5, true, 0);
    return;
  }
  if (gameState.inv <= 0) {
    if (runtime.player.dash <= 0 && hurt(runtime.player)) {
      hurtP(0.5, true, 0);
      return;
    }
    const hs = hitSrc();
    if (hs) {
      hurtP(hs.a, false, hs.x);
      if (gameState.mode !== 'play') return;
    }
  }
  {
    const cx = runtime.player.x + runtime.player.w / 2,
      cy = runtime.player.y + runtime.player.h / 2,
      side = cx < 0 ? 'l' : cx > W ? 'r' : cy < 0 ? 't' : cy > H ? 'b' : null;
    if (side) {
      const hz = side === 'l' || side === 'r',
        k = linkAt(side, hz ? Math.floor(cy / T) : Math.floor(cx / T));
      if (k) {
        go(k, hz ? Math.floor(cy / T) : runtime.player.x);
        return;
      }
    }
  }
  gameState.hist.push(snap());
  if (gameState.hist.length > 660) gameState.hist.shift();
}
