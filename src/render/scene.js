import { runtime } from '../state/runtime.js';
import { HEIGHT, TILE, WIDTH } from '../core/config.js';
import { canvas, ctx } from '../core/canvas.js';
import { ECHO_TYPES } from '../data/echoes.js';
import { levels } from '../data/levels.js';
import { formatTime, gameState } from '../state/state.js';
import { scores } from '../state/save.js';
import { snapCv } from '../game/rewind.js';
import { sealed } from '../game/physics.js';
import { ghost } from '../game/reflets.js';
import { isSpriteReady } from './sprites.js';
import {
  FONT_BODY,
  INK_COLOR,
  uiHitBoxes,
  grainTexture,
  drawOutlinedText,
  roundRectPath,
} from './primitives.js';
import { drawBackground, drawFloorFx } from './background.js';
import { drawTiles } from './tiles.js';
import { drawHero, drawWalker, starPath } from './characters.js';
import { drawBoss, drawTrap } from './bosses.js';
import { drawAfter } from './boss-witch.js';
import { drawDoors, drawTunnelBG } from './room-overlays.js';
import { drawMirrorBG } from './boss-mirror.js';
import { drawHUD, drawHeart, drawOver } from '../ui/hud.js';
import { drawMap, drawPause, drawScores, drawSleep, drawTitle, drawTrial } from '../ui/screens.js';
const scratchCanvas = document.createElement('canvas');
scratchCanvas.width = WIDTH;
scratchCanvas.height = HEIGHT;
const scratchContext = scratchCanvas.getContext('2d');
export function draw() {
  const boil = Math.floor(gameState.time * 8) % 3;
  ctx.save();
  if (gameState.shake > 0) {
    ctx.translate((Math.random() - 0.5) * 24 * gameState.shake, (Math.random() - 0.5) * 24 * gameState.shake);
  }
  if (gameState.mode === 'title') {
    drawTitle();
    ctx.restore();
    return;
  }
  if (gameState.mode === 'scores') {
    drawScores();
    ctx.restore();
    return;
  }
  if (gameState.mode === 'trial') {
    drawTrial();
    ctx.restore();
    return;
  }
  if (gameState.mode === 'map') {
    drawMap();
    ctx.restore();
    return;
  }
  drawBackground(boil, gameState.loadedRoom);
  drawMirrorBG();
  drawTunnelBG();
  drawTiles(boil);
  drawDoors();
  drawFloorFx();
  {
    const up = gameState.time - (gameState.gateRaisedAt || -9),
      fall = gameState.sealed === 1 ? Math.min(1, (gameState.time - gameState.sealStartTime) / 0.4) : 1;
    if (gameState.sealed || up < 0.5) {
      const off = gameState.sealed
          ? -(1 - fall * fall) * (13 * TILE + 8)
          : -Math.min(1, up / 0.5) * (13 * TILE + 8),
        h = 13 * TILE,
        y0 = TILE + off;
      for (const x0 of [0, WIDTH - TILE]) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x0, TILE, TILE, h);
        ctx.clip();
        ctx.fillStyle = '#2B2530';
        ctx.fillRect(x0, y0, TILE, h);
        ctx.strokeStyle = INK_COLOR;
        ctx.lineWidth = 3;
        ctx.fillStyle = '#8B8497';
        for (let i = 0; i < 4; i++) {
          const bx = x0 + 3 + i * 8;
          ctx.fillRect(bx, y0, 5, h);
          ctx.strokeRect(bx, y0, 5, h);
          ctx.beginPath();
          ctx.moveTo(bx + 2.5, y0 + h);
          ctx.lineTo(bx + 2.5, y0 + h + 10);
          ctx.stroke();
        }
        for (let r = 0; r < 7; r++) {
          const by = y0 + 10 + (r * h) / 7;
          ctx.fillRect(x0, by, TILE, 5);
          ctx.strokeRect(x0, by, TILE, 5);
        }
        ctx.restore();
      }
    }
  }
  for (const entity of runtime.entities)
    if (entity.alive) {
      if (entity.k === 'w') drawWalker(entity);
      else drawBoss(entity);
    }
  {
    const g = ghost();
    if (g) {
      if (isSpriteReady('ghost-afterimage')) drawAfter(g);
      else
        drawHero(g, {
          jean: '#C77B30',
          cuff: '#E8B77A',
          tie: '#F6EBCB',
          body: '#F2E6CF',
          alpha: g.mv ? 0.6 : 0.25,
          clone: 1,
          col: '#C77B30',
        });
    }
  }
  if (runtime.echoClone)
    drawHero(runtime.echoClone, {
      jean: ECHO_TYPES[runtime.echoClone.type].c,
      cuff: '#F6EBCB',
      tie: '#F6EBCB',
      body: '#F4F1E6',
      alpha: 0.88,
      clone: 1,
      col: ECHO_TYPES[runtime.echoClone.type].c,
    });
  if (runtime.player.dash > 0)
    for (let i = 1; i <= 3; i++)
      drawHero(
        {
          ...runtime.player,
          x: runtime.player.x - runtime.player.dd * i * 16,
        },
        {
          jean: '#6FB0F0',
          body: '#DCEBFA',
          alpha: (0.28 / i) * 1.6,
        },
      );
  if (runtime.player.djfx > 0) {
    ctx.save();
    ctx.globalAlpha = runtime.player.djfx * 3;
    ctx.strokeStyle = '#FFF8E1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(
      runtime.player.x + runtime.player.w / 2,
      runtime.player.y + runtime.player.h + 4,
      16 + (0.25 - runtime.player.djfx) * 60,
      5,
      0,
      0,
      7,
    );
    ctx.stroke();
    ctx.restore();
  }
  for (const k of runtime.level.links)
    if ((sealed(k) || k.sc) && (k.s === 't' || k.s === 'b')) {
      if (k.gate) drawTrap(k);
      else if (sealed(k)) {
        ctx.save();
        ctx.fillStyle = 'rgba(208,64,46,.38)';
        ctx.fillRect(k.c0 * TILE, k.s === 't' ? 0 : 14 * TILE, (k.c1 - k.c0 + 1) * TILE, 10);
        ctx.fillStyle = INK_COLOR;
        for (let x = k.c0 * TILE; x < (k.c1 + 1) * TILE; x += 16)
          ctx.fillRect(x + 2, k.s === 't' ? 0 : 14 * TILE, 10, 5);
        ctx.restore();
      }
    }
  for (const k of runtime.level.links)
    if (sealed(k) && (k.s === 'l' || k.s === 'r')) {
      const x = k.s === 'l' ? 0 : WIDTH - 12;
      ctx.save();
      ctx.fillStyle = 'rgba(208,64,46,.28)';
      ctx.fillRect(x, k.r0 * TILE, 12, (k.r1 - k.r0 + 1) * TILE);
      ctx.fillStyle = INK_COLOR;
      for (let r = k.r0 * TILE; r < (k.r1 + 1) * TILE; r += 16)
        ctx.fillRect(x + (k.s === 'l' ? 0 : 2), r, 10, 5);
      ctx.restore();
    }
  if (runtime.bed && gameState.mode === 'play')
    uiHitBoxes.push({
      id: 'bedz',
      x: runtime.bed.x - 56,
      y: runtime.bed.y - 64,
      w: 112,
      h: 72,
    });
  if (runtime.bed) {
    const bx = runtime.bed.x,
      by = runtime.bed.y,
      used = gameState.usedBeds[gameState.loadedRoom];
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = INK_COLOR;
    ctx.fillStyle = '#6B4A33';
    roundRectPath(bx - 44, by - 12, 88, 12, 3);
    ctx.fill();
    ctx.stroke();
    roundRectPath(bx - 44, by - 34, 8, 34, 3);
    ctx.fill();
    ctx.stroke();
    roundRectPath(bx + 36, by - 26, 8, 26, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = used ? '#8A8F98' : '#E8E0C8';
    roundRectPath(bx - 38, by - 24, 74, 13, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = used ? '#6E727A' : '#D0402E';
    roundRectPath(bx - 14, by - 27, 50, 16, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = used ? '#B5B9C0' : '#F6EBCB';
    roundRectPath(bx - 36, by - 33, 22, 11, 5);
    ctx.fill();
    ctx.stroke();
    if (!used) {
      const g = 0.5 + 0.5 * Math.sin(gameState.time * 3);
      ctx.fillStyle = 'rgba(242,196,90,' + (0.5 + 0.4 * g) + ')';
      ctx.font = '900 16px ' + FONT_BODY;
      ctx.textAlign = 'center';
      ctx.fillText('z', bx + 30, by - 46 - g * 4);
      ctx.fillText('Z', bx + 42, by - 58 - g * 4);
    }
    ctx.restore();
  }
  if (runtime.statue) {
    const g = 0.5 + 0.5 * Math.sin(gameState.time * 3);
    ctx.save();
    ctx.fillStyle = 'rgba(77,184,177,' + (0.22 + 0.12 * g) + ')';
    ctx.beginPath();
    ctx.arc(runtime.statue.x, runtime.statue.y - 30, 34, 0, 7);
    ctx.fill();
    ctx.fillStyle = INK_COLOR;
    roundRectPath(runtime.statue.x - 15, runtime.statue.y - 12, 30, 12, 3);
    ctx.fill();
    roundRectPath(runtime.statue.x - 10, runtime.statue.y - 44, 20, 34, 6);
    ctx.fill();
    ctx.fillStyle = '#B8AE98';
    roundRectPath(runtime.statue.x - 12, runtime.statue.y - 10, 24, 8, 2);
    ctx.fill();
    roundRectPath(runtime.statue.x - 7, runtime.statue.y - 41, 14, 30, 5);
    ctx.fill();
    ctx.fillStyle = '#4DB8B1';
    ctx.beginPath();
    ctx.arc(runtime.statue.x, runtime.statue.y - 28, 5 + g * 1.5, 0, 7);
    ctx.fill();
    ctx.restore();
  }
  for (const h of runtime.hearts)
    if (!h.got) {
      const by = Math.sin(gameState.time * 4 + h.x) * 4;
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.15 * Math.sin(gameState.time * 5);
      ctx.fillStyle = '#FFE9A8';
      ctx.beginPath();
      ctx.arc(h.x, h.y + by, 22, 0, 7);
      ctx.fill();
      ctx.restore();
      if (h.t === 'm') {
        ctx.save();
        ctx.strokeStyle = '#5BB8FF';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(h.x, h.y + by, 24 + Math.sin(gameState.time * 6) * 2, 0, 7);
        ctx.stroke();
        ctx.restore();
        drawHeart(h.x, h.y + by, 36, true, true);
      } else drawHeart(h.x, h.y + by, 28, true);
    }
  if (!(gameState.invulnerableTimer > 0 && Math.floor(gameState.time * 14) % 2))
    drawHero(
      runtime.player,
      runtime.player.big
        ? {
            jean: '#8A4E30',
            cuff: '#D9A878',
            tie: '#F2C45A',
          }
        : {},
    );
  for (const s of runtime.shots) {
    ctx.save();
    const gl = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, 16);
    gl.addColorStop(0, 'rgba(190,255,250,.95)');
    gl.addColorStop(1, 'rgba(90,220,230,0)');
    ctx.fillStyle = gl;
    ctx.fillRect(s.x - 16, s.y - 16, 32, 32);
    ctx.fillStyle = '#F6FFFE';
    ctx.strokeStyle = INK_COLOR;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 5.5, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  for (const q of runtime.echoClone ? [runtime.player, runtime.echoClone] : [runtime.player])
    if (q.hit > 0) {
      const fx = q.face > 0 ? q.x + q.w + 4 : q.x - 4,
        fy = q.y + q.h * 0.3;
      ctx.strokeStyle = '#F6EBCB';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(fx + q.face * 4, fy + i * 9);
        ctx.lineTo(fx + q.face * (18 + Math.abs(i) * -4), fy + i * 14);
        ctx.stroke();
      }
    }
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.drawImage(grainTexture, 0, 0, 256, 256, 0, 0, WIDTH, HEIGHT);
  ctx.restore();
  if (gameState.mode === 'rewind') {
    ctx.fillStyle = 'rgba(46,100,140,.28)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = 'rgba(246,235,203,.10)';
    for (let y = (gameState.time * 300) % 24; y < HEIGHT; y += 24) ctx.fillRect(0, y, WIDTH, 6);
    drawOutlinedText('« RETOUR', WIDTH / 2, HEIGHT / 2 + 8, 40, '#F6EBCB');
  }
  uiHitBoxes.length = 0;
  drawHUD();
  if (gameState.fade > 0) {
    ctx.fillStyle = 'rgba(27,22,18,' + Math.min(1, gameState.fade / 0.45) + ')';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  if (gameState.mode === 'pause') drawPause();
  if (gameState.mode === 'sleep') {
    uiHitBoxes.length = 0;
    drawSleep();
  }
  if (gameState.mode === 'gain' && gameState.gainedEcho) {
    ctx.fillStyle = 'rgba(27,22,18,.7)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const g = Math.min(1, gameState.gainTimer * 2),
      t = gameState.gainTimer,
      cx = WIDTH / 2,
      cy = HEIGHT / 2 - 60;
    // rayons dorés qui tournent
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.45);
    const R0 = Math.min(1, t * 1.8) * 640;
    for (let i = 0; i < 24; i += 2) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R0, (i / 24) * Math.PI * 2, ((i + 1) / 24) * Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(242,196,90,' + (0.13 + 0.05 * Math.sin(t * 3 + i)) + ')';
      ctx.fill();
    }
    ctx.restore();
    // gerbe d'étoiles
    const cols = ['#F2C45A', '#F6EBCB', '#4DB8B1', '#E2604B'];
    for (let i = 0; i < 46; i++) {
      const life = t - (i % 9) * 0.035;
      if (life < 0 || life > 2.2) continue;
      const a = i * 2.399,
        sp = 150 + ((i * 53) % 190);
      const x = cx + Math.cos(a) * sp * life,
        y = cy + Math.sin(a) * sp * life + 300 * life * life,
        al = Math.max(0, 1 - life / 2.2),
        sz = 6 + (i % 4) * 3;
      ctx.save();
      ctx.globalAlpha = al;
      ctx.fillStyle = cols[i % 4];
      ctx.strokeStyle = INK_COLOR;
      ctx.lineWidth = 2;
      starPath(x, y, sz, sz * 0.45, life * 4 + i);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // scintillements autour du titre
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + t * 0.6,
        rx = 300 + (i % 3) * 40,
        ry = 120 + (i % 2) * 30,
        k = 0.5 + 0.5 * Math.sin(t * 5 + i * 1.7);
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.5 * k;
      ctx.fillStyle = '#FFF8E1';
      starPath(cx + Math.cos(a) * rx, cy + 30 + Math.sin(a) * ry, 4 + k * 5, 1.6, t * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = g;
    ctx.font = '800 18px ' + FONT_BODY;
    ctx.textAlign = 'left';
    const words = gameState.gainedEcho[1].split(' '),
      tw = 700,
      lines = [];
    let ln = '';
    for (const w of words) {
      const q = ln ? ln + ' ' + w : w;
      if (ctx.measureText(q).width > tw && ln) {
        lines.push(ln);
        ln = w;
      } else ln = q;
    }
    lines.push(ln);
    const bh = lines.length * 24 + 22,
      ty = HEIGHT / 2 - 6;
    drawOutlinedText('ÉCHO GAGNÉ !', WIDTH / 2, HEIGHT / 2 - 128, 52, '#E2A93B');
    drawOutlinedText(gameState.gainedEcho[0], WIDTH / 2, HEIGHT / 2 - 68, 38, '#F6EBCB');
    ctx.fillStyle = 'rgba(20,15,12,.72)';
    roundRectPath(WIDTH / 2 - tw / 2 - 20, ty - 8, tw + 40, bh, 12);
    ctx.fill();
    ctx.fillStyle = '#F6EBCB';
    ctx.textAlign = 'center';
    ctx.font = '800 18px ' + FONT_BODY;
    lines.forEach((l, i) => ctx.fillText(l, WIDTH / 2, ty + 18 + i * 24));
    if (gameState.gainTimer > 0.8) ctx.fillText("Touche l'écran pour continuer", WIDTH / 2, ty + bh + 28);
    ctx.globalAlpha = 1;
  }
  if (gameState.mode === 'over') drawOver();
  if (gameState.slideTimer > 0) {
    const t = gameState.slideTimer / 0.4,
      entity = t * t * (3 - 2 * t);
    scratchContext.clearRect(0, 0, WIDTH, HEIGHT);
    scratchContext.drawImage(canvas, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = INK_COLOR;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(
      snapCv,
      -gameState.slideDirX * WIDTH * (1 - entity),
      -gameState.slideDirY * HEIGHT * (1 - entity),
    );
    ctx.drawImage(scratchCanvas, gameState.slideDirX * WIDTH * entity, gameState.slideDirY * HEIGHT * entity);
  }
  if (gameState.mode === 'win') {
    ctx.fillStyle = 'rgba(27,22,18,.45)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawOutlinedText('NIVEAU RÉUSSI !', WIDTH / 2, HEIGHT / 2, 60, '#E2A93B');
    ctx.fillStyle = '#F6EBCB';
    ctx.font = '800 18px ' + FONT_BODY;
    ctx.textAlign = 'center';
    drawOutlinedText('⏱ ' + formatTime(gameState.roomTime), WIDTH / 2, HEIGHT / 2 + 52, 34, '#F6EBCB');
    if (gameState.newRecordKind)
      drawOutlinedText(
        gameState.newRecordKind === 1 ? 'PREMIER TEMPS !' : 'NOUVEAU RECORD !',
        WIDTH / 2,
        HEIGHT / 2 + 92,
        26,
        '#4DB8B1',
      );
    else if (scores.best[gameState.loadedRoom] !== undefined) {
      ctx.font = '800 16px ' + FONT_BODY;
      ctx.fillText('record : ' + formatTime(scores.best[gameState.loadedRoom]), WIDTH / 2, HEIGHT / 2 + 86);
    }
    ctx.font = '800 16px ' + FONT_BODY;
    ctx.fillText(
      gameState.loadedRoom + 1 >= levels.length ? 'Tu as fini la démo' : "Touche l'écran pour continuer",
      WIDTH / 2,
      HEIGHT / 2 + 120,
    );
  }
  if (gameState.mode === 'end') {
    ctx.fillStyle = 'rgba(27,22,18,.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawOutlinedText('VICTOIRE !', WIDTH / 2, HEIGHT / 2 - 10, 72, '#E2A93B');
    ctx.fillStyle = '#F6EBCB';
    ctx.font = '800 20px ' + FONT_BODY;
    ctx.textAlign = 'center';
    ctx.fillText(
      'Le Roi des Échos est vaincu · temps total ' +
        formatTime(gameState.endResult ? gameState.endResult.t : gameState.runTime) +
        (gameState.endResult && gameState.endResult.rank
          ? ' (n°' + gameState.endResult.rank + ' au classement)'
          : ''),
      WIDTH / 2,
      HEIGHT / 2 + 40,
    );
    ctx.fillText("Touche l'écran pour revenir au menu", WIDTH / 2, HEIGHT / 2 + 74);
  }
}
