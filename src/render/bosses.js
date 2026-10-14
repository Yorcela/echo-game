import { runtime } from '../state/runtime.js';
import { HERO_BASE_H, FLOOR_Y, HEIGHT, TILE, WIDTH } from '../core/config.js';
import { ctx } from '../core/canvas.js';
import { gameState } from '../state/state.js';
import { gateOK } from '../game/physics.js';
import { isSpriteReady } from './sprites.js';
import { INK_COLOR, drawOutlinedText, roundRectPath } from './primitives.js';
import { drawChar, drawSpriteBoss, drawWorm, starPath } from './characters.js';
import { drawColossus, drawEnvol } from './boss-wing-giant.js';
import { drawBeam, drawBoom, drawNuke, drawPuff, drawReflet } from './boss-mirror.js';
import { BOLT_OK, drawOrb, drawTelegraph, drawWitch } from './boss-witch.js';
import { drawBolt } from './boss-bolt.js';
function drawBoss0(entity) {
  if (runtime.level.boss.kind === 'bolt' && BOLT_OK()) {
    drawBolt(entity);
    return;
  }
  if (
    runtime.level.boss.kind === 'shooter' &&
    [
      'witch-body',
      'witch-skirt',
      'witch-leg-left',
      'witch-leg-right',
      'witch-wand-arm-up',
      'witch-wand-arm-flick',
      'witch-wand-arm-down',
      'witch-free-arm-up',
      'witch-free-arm-cast',
      'witch-hair-1',
      'witch-hair-2',
      'witch-hair-3',
    ].every(isSpriteReady)
  ) {
    const blink = entity.inv > 0 && Math.floor(gameState.time * 20) % 2;
    drawWitch(entity, blink ? 0.4 : 1);
    if (entity.st === 'tele') drawOutlinedText('!', entity.x + entity.w / 2, entity.y - 48, 34, '#D0402E');
    return;
  }
  if (
    runtime.level.boss.kind === 'mirror' &&
    ['sun-torso', 'sun-leg-left', 'sun-leg-right', 'moon-torso', 'moon-leg-left', 'moon-leg-right'].every(
      isSpriteReady,
    )
  ) {
    if (entity.st === 'tele' && !entity.id) drawTelegraph(entity);
    drawReflet(entity, entity.inv > 0 && entity.inv < 5 && Math.floor(gameState.time * 20) % 2 ? 0.45 : 1);
    return;
  }
  if (
    runtime.level.boss.kind === 'giant' &&
    ['giant-torso', 'giant-arm-left', 'giant-arm-right', 'giant-leg-left', 'giant-leg-right'].every(
      isSpriteReady,
    )
  ) {
    const blink = entity.inv > 0 && entity.inv < 5 && Math.floor(gameState.time * 20) % 2,
      cx = entity.x + entity.w / 2;
    let tint = null;
    if (entity.st === 'arm' && entity.t < 0.6)
      tint = ['#D0402E', 0.14 + 0.12 * Math.sin(gameState.time * 40)];
    ctx.save();
    if (entity.st === 'die' && entity.y + entity.h > FLOOR_Y - 6) {
      ctx.beginPath();
      ctx.rect(0, 0, WIDTH, FLOOR_Y);
      for (let c = 1; c <= 28; c++)
        if (runtime.grid[14][c] === '.') ctx.rect(c * TILE, FLOOR_Y, TILE, HEIGHT);
      ctx.clip();
    }
    drawColossus(entity, blink ? 0.45 : 1, tint);
    ctx.restore();
    if (entity.st === 'arm' || entity.st === 'rarm')
      drawOutlinedText('!', cx, entity.y - 30, 38, entity.st === 'arm' ? '#D0402E' : '#E2A93B');
    return;
  }
  if (
    runtime.level.boss.kind === 'wing' &&
    isSpriteReady('wing-body') &&
    isSpriteReady('wing-left') &&
    isSpriteReady('wing-right')
  ) {
    const blink = entity.inv > 0 && Math.floor(gameState.time * 20) % 2,
      cx = entity.x + entity.w / 2;
    drawEnvol(entity, blink ? 0.35 : 1, entity.st === 'stun' ? ['#9C9380', 0.3] : null);
    if (entity.st === 'tele' || entity.st === 'ftele')
      drawOutlinedText('!', cx, entity.y - 34, 34, '#D0402E');
    if (entity.st === 'stun') {
      for (let q = 0; q < 3; q++) {
        const a = gameState.time * 4 + q * 2.1;
        ctx.fillStyle = '#E2A93B';
        starPath(cx + Math.cos(a) * 30, entity.y - 24 + Math.sin(a) * 6, 7, 3, a);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = INK_COLOR;
        ctx.stroke();
      }
    }
    return;
  }
  if (
    runtime.level.boss.kind === 'twin' &&
    isSpriteReady('twin-joined') &&
    isSpriteReady('twin-a') &&
    isSpriteReady('twin-b')
  ) {
    const blink = entity.inv > 0 && Math.floor(gameState.time * 20) % 2,
      sh = entity.st === 'tele' || entity.st === 'stomp' ? Math.sin(gameState.time * 60) * 3 : 0,
      cx = entity.x + entity.w / 2;
    drawWorm(
      {
        ...entity,
        x: entity.x + sh,
      },
      blink ? 0.35 : 1,
      entity.st === 'stun'
        ? ['#9C9380', 0.3]
        : entity.fast && entity.st === 'tele'
          ? ['#D0402E', 0.25]
          : null,
    );
    if (entity.st === 'charge' && Math.abs(entity.vx) > 20) {
      const d = entity.dirc || entity.face;
      ctx.save();
      for (let q = 0; q < 4; q++) {
        const t = (gameState.time * 5 + q / 4) % 1;
        ctx.globalAlpha = 0.55 * (1 - t);
        ctx.fillStyle = '#E9DFC4';
        ctx.strokeStyle = INK_COLOR;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx - d * (entity.w / 2 + t * 40), entity.y + entity.h - 3 - t * 14, 4 + t * 8, 0, 7);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
    if (entity.st === 'tele') drawOutlinedText('!', cx, entity.y - 30, 34, '#D0402E');
    if (entity.st === 'stun') {
      for (let q = 0; q < 3; q++) {
        const a = gameState.time * 4 + q * 2.1;
        ctx.fillStyle = '#E2A93B';
        starPath(cx + Math.cos(a) * (entity.w * 0.4 + 10), entity.y - 14 + Math.sin(a) * 6, 7, 3, a);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = INK_COLOR;
        ctx.stroke();
      }
    }
    return;
  }
  if (isSpriteReady(runtime.level.boss.kind)) {
    const blink = entity.inv > 0 && Math.floor(gameState.time * 20) % 2,
      sh = entity.st === 'tele' || entity.st === 'stomp' ? Math.sin(gameState.time * 60) * 3 : 0;
    const e2 = {
      ...entity,
      x: entity.x + sh,
    };
    drawSpriteBoss(
      e2,
      entity.st === 'rew' ? 0.35 + 0.4 * Math.abs(Math.sin(gameState.time * 14)) : blink ? 0.35 : 1,
      entity.st === 'rew' ? ['#6FB0F0', 0.6] : entity.st === 'stun' ? ['#9C9380', 0.35] : null,
    );
    const cx = entity.x + entity.w / 2;
    if (entity.st === 'charge' && Math.abs(entity.vx) > 20) {
      const d = entity.dirc || entity.face;
      ctx.save();
      for (let q = 0; q < 4; q++) {
        const t = (gameState.time * 5 + q / 4) % 1;
        ctx.globalAlpha = 0.55 * (1 - t);
        ctx.fillStyle = '#E9DFC4';
        ctx.strokeStyle = INK_COLOR;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx - d * (16 + t * 40), entity.y + entity.h - 3 - t * 14, 4 + t * 8, 0, 7);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
    if (entity.st === 'tele') drawOutlinedText('!', cx, entity.y - 34, 34, '#D0402E');
    if (entity.st === 'stun') {
      for (let q = 0; q < 3; q++) {
        const a = gameState.time * 4 + q * 2.1;
        ctx.fillStyle = '#E2A93B';
        starPath(cx + Math.cos(a) * 34, entity.y - 30 + Math.sin(a) * 6, 7, 3, a);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = INK_COLOR;
        ctx.stroke();
      }
    }
    return;
  }
  const B = runtime.level.boss,
    cx = entity.x + entity.w / 2,
    k = entity.h / HERO_BASE_H,
    by = entity.y + entity.h;
  const blink = entity.inv > 0 && Math.floor(gameState.time * 20) % 2;
  const sh = entity.st === 'tele' || entity.st === 'stomp' ? Math.sin(gameState.time * 60) * 3 : 0;
  const b2 = {
    ...entity,
    x: entity.x + sh,
  };
  drawChar(
    b2,
    entity.st === 'stun' ? '#9C9380' : entity.st === 'rew' ? '#6FB0F0' : B.c,
    entity.st === 'rew' ? 0.35 + 0.4 * Math.abs(Math.sin(gameState.time * 14)) : blink ? 0.35 : 1,
    false,
  );
  ctx.save();
  ctx.translate(cx + sh, by);
  ctx.scale(k, k);
  ctx.strokeStyle = INK_COLOR;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-10, -HERO_BASE_H + 3);
  ctx.lineTo(0, -HERO_BASE_H + 9);
  ctx.moveTo(12, -HERO_BASE_H + 3);
  ctx.lineTo(2, -HERO_BASE_H + 9);
  ctx.stroke();
  ctx.fillStyle = '#E2A93B';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-8, -HERO_BASE_H);
  ctx.lineTo(-8, -HERO_BASE_H - 8);
  ctx.lineTo(-4, -HERO_BASE_H - 4);
  ctx.lineTo(0, -HERO_BASE_H - 10);
  ctx.lineTo(4, -HERO_BASE_H - 4);
  ctx.lineTo(8, -HERO_BASE_H - 8);
  ctx.lineTo(8, -HERO_BASE_H);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  if (entity.st === 'tele') drawOutlinedText('!', cx, entity.y - 14, 34, '#D0402E');
  if (entity.st === 'stun') {
    for (let i = 0; i < 3; i++) {
      const a = gameState.time * 4 + i * 2.1;
      ctx.fillStyle = '#E2A93B';
      starPath(cx + Math.cos(a) * 26, entity.y - 8 + Math.sin(a) * 6, 7, 3, a);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK_COLOR;
      ctx.stroke();
    }
  }
}
function wingsAt(cx, cy, sz, flap, col) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineJoin = 'round';
  ctx.fillStyle = col;
  ctx.strokeStyle = INK_COLOR;
  ctx.lineWidth = 3;
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.scale(sd, 1);
    ctx.rotate(-0.35 + Math.sin(flap) * 0.45);
    ctx.beginPath();
    ctx.moveTo(sz * 0.25, 0);
    ctx.quadraticCurveTo(sz * 1.1, -sz * 0.9, sz * 1.7, -sz * 0.35);
    ctx.quadraticCurveTo(sz * 1.35, -sz * 0.1, sz * 1.5, sz * 0.3);
    ctx.quadraticCurveTo(sz * 1.0, sz * 0.2, sz * 0.8, sz * 0.5);
    ctx.quadraticCurveTo(sz * 0.5, sz * 0.35, sz * 0.25, sz * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
export function emblem(entity, B) {
  const cx = entity.x + entity.w / 2,
    cy = entity.y + entity.h * 0.58,
    s = Math.max(8, entity.h * 0.2);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = INK_COLOR;
  ctx.fillStyle = '#FFF8E1';
  const em = B.em;
  if (em === 'clock') {
    ctx.beginPath();
    ctx.arc(0, 0, s, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.6);
    ctx.lineTo(0, 0);
    ctx.lineTo(s * 0.45, s * 0.25);
    ctx.stroke();
  } else if (em === 'mirror') {
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sd * s * 0.15, -s * 0.8);
      ctx.lineTo(sd * s * 1.1, 0);
      ctx.lineTo(sd * s * 0.15, s * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (em === 'twin') {
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(sd * s * 0.6, 0, s * 0.5, 0, 7);
      ctx.fill();
      ctx.stroke();
    }
  } else if (em === 'ghost') {
    ctx.beginPath();
    ctx.moveTo(-s * 0.8, s * 0.8);
    ctx.lineTo(-s * 0.8, -s * 0.1);
    ctx.arc(0, -s * 0.1, s * 0.8, Math.PI, 0);
    ctx.lineTo(s * 0.8, s * 0.8);
    ctx.lineTo(s * 0.4, s * 0.45);
    ctx.lineTo(0, s * 0.8);
    ctx.lineTo(-s * 0.4, s * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (em === 'giant') {
    ctx.beginPath();
    ctx.rect(-s * 0.5, -s * 0.5, s, s);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (const [x, y] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      ctx.moveTo(x * s * 1.1, y * s * 0.5);
      ctx.lineTo(x * s * 1.1, y * s * 1.1);
      ctx.lineTo(x * s * 0.5, y * s * 1.1);
    }
    ctx.stroke();
  } else if (em === 'bolt') {
    ctx.beginPath();
    ctx.moveTo(s * 0.3, -s * 1.1);
    ctx.lineTo(-s * 0.7, s * 0.2);
    ctx.lineTo(-s * 0.05, s * 0.2);
    ctx.lineTo(-s * 0.35, s * 1.1);
    ctx.lineTo(s * 0.75, -s * 0.3);
    ctx.lineTo(s * 0.1, -s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (em === 'gun') {
    ctx.beginPath();
    ctx.rect(-s * 0.9, -s * 0.35, s * 1.4, s * 0.6);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(-s * 0.3, s * 0.2, s * 0.5, s * 0.7);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(s * 0.5, -s * 0.22, s * 0.7, s * 0.28);
    ctx.fill();
    ctx.stroke();
  } else if (em === 'king') {
    for (let i = 3; i >= 1; i--) {
      ctx.beginPath();
      ctx.arc(0, 0, s * (0.5 + i * 0.42) + Math.sin(gameState.time * 5 + i) * 2, 0, 7);
      ctx.stroke();
    }
    ctx.fillStyle = '#FFF8E1';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2,
        r = i % 2 ? s * 0.35 : s * 0.8;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (em === 'wing') {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.9);
    ctx.quadraticCurveTo(s * 0.9, -s * 0.2, 0, s * 0.9);
    ctx.quadraticCurveTo(-s * 0.9, -s * 0.2, 0, -s * 0.9);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
function drawSpell(entity) {
  const x = entity.x + entity.w / 2,
    y = entity.y + entity.h / 2,
    d = Math.sign(entity.vx) || 1,
    ph = gameState.time * 12 + entity.x * 0.04,
    tn = entity.tn % 3;
  const pal =
    tn === 1
      ? ['120,255,150', '#8CF08A', '#2F8F4A']
      : tn === 2
        ? ['255,130,210', '#FF9AD8', '#B03C88']
        : ['190,110,255', '#C58BFF', '#6A3CB0'];
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.globalCompositeOperation = 'lighter';
  const gradient = ctx.createRadialGradient(x, y, 2, x, y, 30);
  gradient.addColorStop(0, 'rgba(' + pal[0] + ',.85)');
  gradient.addColorStop(1, 'rgba(' + pal[0] + ',0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, 7);
  ctx.fill();
  for (let i = 0; i < 7; i++) {
    const u = (i + ((gameState.time * 7) % 1)) / 7,
      tx = x - d * u * 58,
      ty = y + Math.sin(ph * 1.3 + i * 1.4) * 8 * u;
    ctx.globalAlpha = 0.7 * (1 - u);
    ctx.fillStyle = 'rgba(' + pal[0] + ',1)';
    ctx.beginPath();
    ctx.arc(tx, ty, 5 * (1 - u) + 1, 0, 7);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = pal[1];
  ctx.strokeStyle = INK_COLOR;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, 7);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = pal[2];
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let q = 0; q < 22; q++) {
    const a = q * 0.35 + ph,
      r = 1 + q * 0.42;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.stroke();
  ctx.fillStyle = '#FFF6D0';
  ctx.strokeStyle = INK_COLOR;
  ctx.lineWidth = 1.5;
  for (let q = 0; q < 3; q++) {
    const a = ph * 0.8 + q * 2.1;
    starPath(x + Math.cos(a) * 17, y + Math.sin(a) * 17, 4, 1.6, a);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
function drawBullet(entity) {
  if (entity.spell) return drawSpell(entity);
  const x = entity.x + entity.w / 2,
    y = entity.y + entity.h / 2;
  ctx.save();
  const gradient = ctx.createRadialGradient(x, y, 1, x, y, 18);
  gradient.addColorStop(0, 'rgba(255,180,90,.9)');
  gradient.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(x - 18, y - 18, 36, 36);
  ctx.fillStyle = '#FFE08A';
  ctx.strokeStyle = INK_COLOR;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 6.5, 0, 7);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,170,70,.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - Math.sign(entity.vx) * 8, y);
  ctx.lineTo(x - Math.sign(entity.vx) * 26, y);
  ctx.stroke();
  ctx.restore();
}
function drawFist(entity) {
  const u = 1 - Math.max(0, entity.life) / 0.28,
    x = entity.x + entity.w / 2,
    y = FLOOR_Y;
  ctx.save();
  ctx.globalAlpha = 1 - u * 0.8;
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#F6EBCB';
  ctx.strokeStyle = INK_COLOR;
  ctx.lineWidth = 3;
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i * Math.PI) / 8,
      r = 30 + u * 70 + (i % 2) * 22;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * 12, y + Math.sin(a) * 8);
    ctx.lineTo(x + Math.cos(a + 0.1) * r, y + Math.sin(a + 0.1) * r * 0.7);
    ctx.lineTo(x + Math.cos(a - 0.1) * r * 0.75, y + Math.sin(a - 0.1) * r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
function drawShock(entity) {
  const x = entity.x + entity.w / 2,
    y = FLOOR_Y,
    sd = Math.sign(entity.vx) || 1,
    t = gameState.time,
    ph = t - (entity.t0 || 0);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sd * 1.35, 1.35);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#F6EBCB';
  ctx.lineWidth = 2;
  for (let i = 1; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-12 - i * 14, 0);
    ctx.quadraticCurveTo(-8 - i * 14, -26 + i * 5, 6 - i * 8, -26 + i * 6);
    ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const u = (ph * 3 + i / 5) % 1;
    ctx.globalAlpha = 0.55 * (1 - u);
    ctx.fillStyle = '#E9DFC4';
    ctx.strokeStyle = INK_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-14 - u * 52, -3 - u * 10, 3 + u * 7, 0, 7);
    ctx.fill();
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#5C4B50';
  ctx.strokeStyle = INK_COLOR;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const u = (ph * 4 + i * 0.33) % 1,
      px = -6 - i * 10 - u * 14,
      py = -12 - Math.sin(u * Math.PI) * (18 + i * 6);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ph * 9 + i);
    ctx.beginPath();
    ctx.rect(-3, -3, 6, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  const pulse = 1 + Math.sin(ph * 28) * 0.07;
  ctx.fillStyle = '#F6EBCB';
  ctx.strokeStyle = INK_COLOR;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.quadraticCurveTo(-4, -34 * pulse, 16, -30 * pulse);
  ctx.quadraticCurveTo(22, -18, 20, 0);
  ctx.quadraticCurveTo(10, -6, -12, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#E2A93B';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-8, -1);
  ctx.quadraticCurveTo(-1, -22 * pulse, 12, -20 * pulse);
  ctx.quadraticCurveTo(15, -10, 14, -1);
  ctx.quadraticCurveTo(6, -4, -8, -1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = INK_COLOR;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-60, 1);
  ctx.lineTo(-44, 3);
  ctx.lineTo(-34, 0);
  ctx.lineTo(-20, 3);
  ctx.stroke();
  ctx.restore();
}
function drawWave(entity) {
  const x = entity.x + entity.w / 2,
    y = entity.y + entity.h;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(Math.sign(entity.vx) || 1, 1);
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#E2A93B';
  ctx.strokeStyle = INK_COLOR;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.quadraticCurveTo(-6, -26, 14, -24);
  ctx.quadraticCurveTo(4, -14, 12, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
export function drawTrap(k) {
  const x = k.c0 * TILE,
    w = (k.c1 - k.c0 + 1) * TILE,
    ok = gateOK(k),
    t = gameState.time;
  let y = k.s === 't' ? TILE * 0.4 : 14 * TILE;
  ctx.save();
  if (!ok) {
    // trappe de fer scellée, cadenas rouge
    ctx.fillStyle = INK_COLOR;
    roundRectPath(x - 4, y - 6, w + 8, 20, 5);
    ctx.fill();
    ctx.fillStyle = '#5B4636';
    roundRectPath(x, y - 3, w, 14, 4);
    ctx.fill();
    ctx.strokeStyle = '#2A1F18';
    ctx.lineWidth = 3;
    for (let px = x + 10; px < x + w - 4; px += 16) {
      ctx.beginPath();
      ctx.moveTo(px, y - 3);
      ctx.lineTo(px, y + 11);
      ctx.stroke();
    }
    ctx.fillStyle = '#D0402E';
    ctx.strokeStyle = INK_COLOR;
    ctx.lineWidth = 3;
    const cx = x + w / 2;
    roundRectPath(cx - 11, y - 14, 22, 16, 4);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, y - 14, 8, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = INK_COLOR;
    ctx.beginPath();
    ctx.arc(cx, y - 7, 2.5, 0, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(208,64,46,' + (0.12 + 0.08 * Math.sin(t * 3)) + ')';
    ctx.fillRect(x, y - 90, w, 90);
  } else {
    // trappe ouverte : halo doré qui descend vers le boss
    const g = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.fillStyle = 'rgba(242,196,90,' + (0.16 + 0.1 * g) + ')';
    ctx.fillRect(x, y - 110, w, 110);
    ctx.fillStyle = '#F2C45A';
    ctx.strokeStyle = INK_COLOR;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const ax = x + w / 2,
        ay = y - 70 + ((t * 60 + i * 26) % 78);
      ctx.beginPath();
      ctx.moveTo(ax - 10, ay);
      ctx.lineTo(ax + 10, ay);
      ctx.lineTo(ax, ay + 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = INK_COLOR;
    roundRectPath(x - 4, y - 6, 6, 20, 2);
    ctx.fill();
    roundRectPath(x + w - 2, y - 6, 6, 20, 2);
    ctx.fill();
  }
  ctx.restore();
}
export function drawBoss(entity) {
  if (entity.k === 's') {
    if (entity.bul) drawBullet(entity);
    else if (entity.fist) drawFist(entity);
    else if (entity.shock) drawShock(entity);
    else if (entity.beam) drawBeam(entity);
    else if (entity.orb) drawOrb(entity);
    else if (entity.boom) drawBoom(entity);
    else if (entity.nuke) drawNuke(entity);
    else if (entity.puff) drawPuff(entity);
    else drawWave(entity);
    return;
  }
  const B = runtime.level.boss;
  if ((B.em === 'wing' || (B.king && entity.fly)) && entity.alive && !isSpriteReady('wing-body'))
    wingsAt(
      entity.x + entity.w / 2,
      entity.y + entity.h * 0.45,
      entity.h * 0.42,
      gameState.time * (entity.st === 'dive' ? 5 : 14),
      '#F6EBCB',
    );
  const sp =
    isSpriteReady(B.kind) ||
    (B.kind === 'mirror' && isSpriteReady('sun-torso')) ||
    (B.kind === 'giant' && isSpriteReady('giant-torso')) ||
    (B.kind === 'twin' && isSpriteReady('twin-joined')) ||
    (B.kind === 'wing' && isSpriteReady('wing-body')) ||
    (B.kind === 'shooter' && isSpriteReady('witch-body')) ||
    (B.kind === 'bolt' && isSpriteReady('bolt-torso'));
  if (entity.st === 'dash' && B.kind !== 'bolt') {
    for (let i = 1; i <= 3; i++) {
      if (sp)
        drawSpriteBoss(
          {
            ...entity,
            x: entity.x - entity.dirc * i * 26,
          },
          (0.3 / i) * 1.4,
        );
      else
        drawChar(
          {
            ...entity,
            x: entity.x - entity.dirc * i * 26,
          },
          B.c,
          (0.3 / i) * 1.4,
          false,
        );
    }
  }
  drawBoss0(entity);
  if (!sp) emblem(entity, B);
}
