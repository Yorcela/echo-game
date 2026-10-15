import { runtime } from '../state/runtime.ts';
import { FLOOR_Y, HEIGHT, PLAYER_H, PLAYER_W, TILE, WIDTH } from '../core/config.ts';
import { IDLE, actions, gameState, input, showMessage } from '../state/state.ts';
import { saveGame } from '../state/save.js';
import { gateMessage, goThroughLink, hurtPlayer, takeSnapshot, startRewind } from './rewind.js';
import {
  gateOK,
  hurt,
  linkAt,
  moveBody,
  overlaps,
  sealLand,
  sealRoom,
  syncHoles,
  updateCrumblingTiles,
  updateDoors,
  updatePlates,
} from './physics.js';
import { cycle, setSize, useEcho } from './echoes.js';
import { prepareWater, updateWater } from './water.js';
import { bossHit, doHit, fire, hitCheck, stomp, updateShots } from './combat.js';
import { bossAI } from './boss-ai.js';
import { ghost, hitSrc, hitSrcOf, updateEntities } from './reflets.js';
import { playSfx } from '../audio/audio.js';
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
  let hf = 0;
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
    if (input.jp && gameState.messageTimer <= 0)
      showMessage('Trop lourd pour sauter ! Rappuie sur Écho pour redevenir normal', 2.4);
    inp.jp = 0;
    inp.jh = 0;
  }
  input.jp = 0;
  takeSnapshot.inp = inp;
  if (actions.tir) {
    actions.tir = 0;
    inp.tr = fire() ? 1 : 0;
  }
  if (
    !gameState.sealed &&
    runtime.level.boss &&
    !runtime.level.king &&
    runtime.player.x > 44 &&
    runtime.player.x + runtime.player.w < WIDTH - 44 &&
    bossAI.any()
  )
    sealRoom();
  if (gameState.sealed === 1 && gameState.time - gameState.sealStartTime >= 0.4) sealLand();
  gameState.perch =
    runtime.player.g && runtime.player.y + runtime.player.h < FLOOR_Y - 10 ? (gameState.perch || 0) + dt : 0;
  gameState.echoCooldown = Math.max(0, gameState.echoCooldown - dt);
  gameState.hintTimer += dt;
  gameState.messageTimer = Math.max(0, gameState.messageTimer - dt);
  if (gameState.messageTimer <= 0)
    for (const k of runtime.level.links) {
      if (!k.gate || gateOK(k)) continue;
      const cx = runtime.player.x + runtime.player.w / 2,
        cy = runtime.player.y + runtime.player.h / 2;
      const near =
        k.s === 'b' || k.s === 't'
          ? cx > (k.c0 - 2) * TILE && cx < (k.c1 + 3) * TILE && (k.s === 't' ? cy < 9 * TILE : cy > 9 * TILE)
          : (k.s === 'l' ? cx < 46 : cx > WIDTH - 46) && cy > (k.r0 - 1) * TILE && cy < (k.r1 + 2) * TILE;
      if (near) {
        showMessage(gateMessage(k), 3);
        break;
      }
    }
  runtime.player.hcd = Math.max(0, runtime.player.hcd - dt);
  runtime.player.dcd = Math.max(0, runtime.player.dcd - dt);
  runtime.player.hit = Math.max(0, runtime.player.hit - dt);
  runtime.player.fly = gameState.echoesOwned[5] ? 1 : 0;
  runtime.player.djfx = Math.max(0, (runtime.player.djfx || 0) - dt);
  if (runtime.player.big) {
    runtime.player.bigT -= dt;
    if (runtime.player.bigT <= 0) {
      setSize(runtime.player, PLAYER_W, PLAYER_H);
      runtime.player.big = 0;
      gameState.echoCooldown = 0.6;
      playSfx('off');
    }
  }
  const pg = runtime.player.g,
    pvy = runtime.player.vy;
  prepareWater();
  moveBody(runtime.player, inp, dt);
  updateWater();
  if (runtime.player.jumped) {
    playSfx('jump');
    runtime.player.jumped = 0;
  }
  if (!pg && runtime.player.g && pvy > 380) playSfx('land');
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
    if (hurt(runtime.echoClone)) {
      cd = 0.5;
      cdie = true;
    } else if (runtime.echoClone.y > HEIGHT + 40) {
      // chute dans le vide : le clone disparaît, sans blesser l'original
      cdie = true;
    } else if (runtime.echoClone.inv <= 0) {
      const hs = hitSrcOf(runtime.echoClone);
      if (hs) {
        cd = hs.a;
        runtime.echoClone.inv = 1.4;
      }
    }
    if (cd > 0 && gameState.invulnerableTimer <= 0) {
      showMessage('Ton clone est blessé : tu encaisses aussi !', 2.2);
      const cx0 = runtime.echoClone.x + runtime.echoClone.w / 2;
      if (cdie) {
        runtime.echoClone = null;
        gameState.echoCooldown = 0.6;
      }
      hurtPlayer(cd, false, cx0);
      if (gameState.mode !== 'play') return;
    } else if (cdie) {
      runtime.echoClone = null;
      gameState.echoCooldown = 0.6;
      playSfx('off');
    }
    if (runtime.echoClone && runtime.echoClone.ttl <= 0) {
      runtime.echoClone = null;
      gameState.echoCooldown = 0.6;
      playSfx('off');
    }
  }
  updateEntities(dt);
  if (runtime.level.boss && runtime.level.boss.kind === 'ghost') {
    const g = ghost();
    if (g && g.hit > 0) {
      const box = {
        x: g.face > 0 ? g.x + g.w - 2 : g.x - 28,
        y: g.y + 3,
        w: 30,
        h: g.h - 8,
      };
      for (const entity of runtime.entities)
        if (entity.alive && entity.k === 'b' && entity.inv <= 0 && overlaps(box, entity)) {
          if (bossHit(entity, g.face, g.big ? 2 : 1)) return;
          entity.st = 'stun';
          entity.t = 1.2;
          entity.vx = 0;
          entity.spd = 0;
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
  updateCrumblingTiles(dt);
  updatePlates(dt);
  updateDoors();
  syncHoles();
  gameState.invulnerableTimer = Math.max(0, gameState.invulnerableTimer - dt);
  for (const h of runtime.hearts)
    if (
      !h.got &&
      (h.t === 'm' || gameState.hp < gameState.hpMax) &&
      Math.abs(runtime.player.x + runtime.player.w / 2 - h.x) < 26 &&
      Math.abs(runtime.player.y + runtime.player.h / 2 - h.y) < 30
    ) {
      h.got = true;
      gameState.collectedHearts[h.id] = 1;
      if (h.t === 'm') {
        gameState.hp = gameState.hpMax;
        gameState.shieldHearts = Math.min(6, gameState.shieldHearts + 1);
        showMessage('Cœur bleu ! Cœurs rechargés + un bouclier temporaire', 3);
      } else {
        gameState.hp = Math.min(gameState.hpMax, gameState.hp + 1);
        showMessage('+1 cœur !', 1.5);
      }
      saveGame();
      playSfx('win');
    }
  // immobilité : +½ cœur toutes les 10 s ; la jauge du Temps ne se recharge que cœurs pleins
  {
    const still =
      runtime.player.g && !input.l && !input.r && Math.abs(runtime.player.vx) < 8 && !runtime.player.big_;
    if (still && gameState.hp < gameState.hpMax - 1e-6) {
      gameState.idleTime += dt;
      if (gameState.idleTime >= 10) {
        gameState.idleTime = 0;
        gameState.hp = Math.min(gameState.hpMax, gameState.hp + 0.5);
        playSfx('tick');
      }
    } else gameState.idleTime = 0;
  }
  {
    const cxp = runtime.player.x + runtime.player.w / 2;
    if (runtime.statue) {
      const near =
        Math.abs(cxp - runtime.statue.x) < 30 &&
        Math.abs(runtime.player.y + runtime.player.h - runtime.statue.y) < 20;
      if (!near) gameState.statueSaveArmed = 1;
      else if (gameState.statueSaveArmed) {
        gameState.statueSaveArmed = 0;
        gameState.checkpointRoom = gameState.loadedRoom;
        saveGame();
        playSfx('win');
        showMessage('Statut : partie sauvegardée', 2.5);
      }
    }
    gameState.isNearBed = false;
    if (runtime.bed) {
      const near =
        runtime.player.g &&
        Math.abs(cxp - runtime.bed.x) < 40 &&
        Math.abs(runtime.player.y + runtime.player.h - runtime.bed.y) < 22;
      if (
        near &&
        (gameState.hp < gameState.hpMax - 1e-6 || (gameState.hasTimeEcho && gameState.gauge < 10 - 1e-6))
      )
        gameState.isNearBed = true;
    }
  }
  stomp();
  updateShots(dt);
  // mémorise les ennemis tués : ils ne reviennent pas tant qu'on reste dans la salle
  if (runtime.deadWalkers)
    for (const e of runtime.entities) if (e.k === 'w' && !e.alive && e.key) runtime.deadWalkers.add(e.key);
  if (runtime.player.y > HEIGHT + 40) {
    hurtPlayer(0.5, true, 0);
    return;
  }
  if (gameState.invulnerableTimer <= 0) {
    if (runtime.player.dash <= 0 && hurt(runtime.player)) {
      // piques : on perd des points de vie et on rebondit, sans redémarrer la salle
      hurtPlayer(0.5, false, runtime.player.x + runtime.player.w / 2 + (runtime.player.face || 1) * 12);
      if (gameState.mode !== 'play') return;
    }
    const hs = hitSrc();
    if (hs) {
      hurtPlayer(hs.a, false, hs.x);
      if (gameState.mode !== 'play') return;
    }
  }
  {
    const cx = runtime.player.x + runtime.player.w / 2,
      cy = runtime.player.y + runtime.player.h / 2,
      side = cx < 0 ? 'l' : cx > WIDTH ? 'r' : cy < 0 ? 't' : cy > HEIGHT ? 'b' : null;
    if (side) {
      const hz = side === 'l' || side === 'r',
        k = linkAt(side, hz ? Math.floor(cy / TILE) : Math.floor(cx / TILE));
      if (k) {
        goThroughLink(k, hz ? Math.floor(cy / TILE) : runtime.player.x);
        return;
      }
    }
  }
  gameState.history.push(takeSnapshot());
  if (gameState.history.length > 660) gameState.history.shift();
}
