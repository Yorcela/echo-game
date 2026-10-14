import { runtime } from '../state/runtime.js';
import { TILE } from '../core/config.js';
import { ctx } from '../core/canvas.js';
import { gameState } from '../state/state.js';
import { DC, doorOpen } from '../game/reflets.js';
import { FONT_BODY, INK_COLOR } from './primitives.js';
export function drawTunnelBG() {
  if (!runtime.level.boss || runtime.level.boss.kind !== 'mirror') return;
  ctx.save();
  for (let r = 14; r <= 15; r++)
    for (let c = 1; c <= 28; c++)
      if (runtime.grid[r][c] === '.') {
        const g = ctx.createLinearGradient(0, r * TILE, 0, r * TILE + TILE);
        g.addColorStop(0, '#2A2030');
        g.addColorStop(1, '#16101C');
        ctx.fillStyle = g;
        ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      }
  ctx.fillStyle = 'rgba(255,214,120,.5)';
  for (let c = 3; c <= 26; c += 3)
    if (runtime.grid[15][c] === '.' && runtime.grid[15][c + 1] === '.') {
      const f = 0.5 + 0.5 * Math.sin(gameState.time * 3 + c);
      ctx.globalAlpha = 0.35 + 0.35 * f;
      ctx.beginPath();
      ctx.arc(c * TILE + 16, 15 * TILE + 6, 3, 0, 7);
      ctx.fill();
    }
  ctx.restore();
}
export function drawDoors() {
  if (!runtime.level.boss || runtime.level.boss.kind !== 'mirror') return;
  ctx.save();
  for (let d = 0; d < 3; d++) {
    const x = DC[d][0] * TILE,
      y = 14 * TILE,
      open = doorOpen(d);
    if (!open) {
      ctx.fillStyle = '#9A6532';
      ctx.fillRect(x, y, 2 * TILE, 12);
      ctx.strokeStyle = INK_COLOR;
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1.5, y + 1.5, 2 * TILE - 3, 9);
      ctx.beginPath();
      ctx.moveTo(x + TILE, y + 1);
      ctx.lineTo(x + TILE, y + 11);
      ctx.stroke();
      ctx.fillStyle = '#D8C07A';
      for (const bx of [x + 8, x + TILE - 8, x + TILE + 8, x + 2 * TILE - 8]) {
        ctx.beginPath();
        ctx.arc(bx, y + 6, 2, 0, 7);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(208,64,46,.9)';
      ctx.font = '800 12px ' + FONT_BODY;
      ctx.textAlign = 'center';
      ctx.fillText('✕', x + TILE, y - 5);
    } else {
      const f = 0.5 + 0.5 * Math.sin(gameState.time * 5 + d);
      ctx.fillStyle = 'rgba(120,230,150,' + (0.5 + 0.4 * f) + ')';
      ctx.font = '800 13px ' + FONT_BODY;
      ctx.textAlign = 'center';
      ctx.fillText('▾', x + TILE, y - 4 + f * 3);
    }
  }
  ctx.restore();
}
