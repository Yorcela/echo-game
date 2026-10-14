import { runtime } from '../state/runtime.ts';
import { PLATE_HOLD_TIME, TILE } from '../core/config.ts';
import { ctx } from '../core/canvas.ts';
import { isBossAlive, gameState } from '../state/state.ts';
import { isDoor } from '../game/physics.js';
import { FONT_BODY, INK_COLOR, roundRectPath } from './primitives.js';
export function drawTiles(boil) {
  const sol = (c, r) => {
    if (c < 0 || c >= 30 || r < 0 || r >= 17) return true;
    const h = runtime.grid[r][c];
    return h === '#' || h === '%' || h === '&';
  };
  for (let r = 0; r < 17; r++)
    for (let c = 0; c < 30; c++) {
      if (r >= 14 && runtime.colossusFloor.rise[c] && gameState.time - runtime.colossusFloor.rise[c] < 0.9)
        continue;
      const ch = runtime.grid[r][c],
        x = c * TILE,
        y = r * TILE,
        j = (k) => (((c * 131 + r * 71 + k * 17 + boil * 29) % 5) - 2) * 0.55;
      if (ch === '#' || ch === '%' || ch === '&') {
        ctx.fillStyle =
          ch === '#'
            ? (c * 7 + r * 13) % 3 === 0
              ? '#5C4B50'
              : '#51424A'
            : ch === '%'
              ? '#8E7650'
              : '#5B6672';
        ctx.fillRect(x, y, TILE, TILE);
        if (ch === '#') {
          ctx.strokeStyle = 'rgba(22,14,20,.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y + 16);
          ctx.lineTo(x + TILE, y + 16);
          ctx.moveTo(x + 16, y);
          ctx.lineTo(x + 16, y + 16);
          ctx.moveTo(x, y + 16);
          ctx.lineTo(x, y + TILE);
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,236,200,.07)';
          ctx.fillRect(x + 2, y + 2, 12, 5);
          ctx.fillRect(x + 18, y + 18, 12, 5);
        }
        if (ch === '#' && !sol(c, r - 1)) {
          ctx.fillStyle = '#CDB98A';
          ctx.fillRect(x, y, TILE, 7);
          ctx.fillStyle = '#8F7C58';
          ctx.fillRect(x, y + 7, TILE, 3);
          if ((c * 5 + r * 11) % 6 === 0) {
            ctx.strokeStyle = '#5E8A4E';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let k = 0; k < 4; k++) {
              ctx.moveTo(x + 6 + k * 6, y + 1);
              ctx.lineTo(x + 4 + k * 6, y + 8);
            }
            ctx.stroke();
          }
        }
        if (ch === '#' && !sol(c, r + 1)) {
          ctx.fillStyle = 'rgba(8,6,16,.35)';
          ctx.fillRect(x, y + TILE - 6, TILE, 6);
        }
        ctx.strokeStyle = INK_COLOR;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (!sol(c, r - 1) || ch !== '#') {
          ctx.moveTo(x, y + j(1));
          ctx.lineTo(x + TILE, y + j(2));
        }
        if (!sol(c, r + 1) || ch !== '#') {
          ctx.moveTo(x, y + TILE + j(3));
          ctx.lineTo(x + TILE, y + TILE + j(4));
        }
        if (!sol(c - 1, r) || ch !== '#') {
          ctx.moveTo(x + j(5), y);
          ctx.lineTo(x + j(6), y + TILE);
        }
        if (!sol(c + 1, r) || ch !== '#') {
          ctx.moveTo(x + TILE + j(7), y);
          ctx.lineTo(x + TILE + j(8), y + TILE);
        }
        ctx.stroke();
        if (ch === '%') {
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x + 6, y + 4);
          ctx.lineTo(x + 15, y + 14);
          ctx.lineTo(x + 10, y + 20);
          ctx.lineTo(x + 22, y + 29);
          ctx.moveTo(x + 26, y + 6);
          ctx.lineTo(x + 19, y + 13);
          ctx.stroke();
        } else if (ch === '&') {
          ctx.fillStyle = '#C9D2DA';
          for (const [px, py] of [
            [7, 7],
            [25, 7],
            [7, 25],
            [25, 25],
          ]) {
            ctx.beginPath();
            ctx.arc(x + px, y + py, 2.6, 0, 7);
            ctx.fill();
          }
        } else if ((c * 3 + r * 5) % 7 === 0) {
          ctx.fillStyle = 'rgba(246,235,203,.12)';
          ctx.fillRect(x + 8, y + 12, 10, 4);
        }
      } else if (ch === '~') {
        const k = runtime.crumbleTileTimers[r * 30 + c] || 0,
          sh = k > 0 ? Math.sin(gameState.time * 60) * 1.5 : 0;
        ctx.fillStyle = '#B8854A';
        ctx.fillRect(x + sh, y, TILE, 12);
        ctx.lineWidth = 3;
        ctx.strokeStyle = INK_COLOR;
        ctx.strokeRect(x + sh + 1, y + 1, TILE - 2, 10);
        ctx.beginPath();
        ctx.moveTo(x + sh + 10, y + 2);
        ctx.lineTo(x + sh + 13, y + 10);
        ctx.moveTo(x + sh + 22, y + 2);
        ctx.lineTo(x + sh + 19, y + 10);
        ctx.stroke();
      } else if (ch === '1' || ch === '2' || ch === '3') {
        const on = gameState.roomAnchors[ch],
          h = on ? 4 : 10;
        ctx.fillStyle = on ? '#2F8F8A' : '#7A5BA6';
        roundRectPath(x + 2, y + TILE - h, TILE - 4, h, 3);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = INK_COLOR;
        ctx.stroke();
        ctx.fillStyle = on ? '#2F8F8A' : '#7A5BA6';
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE - 20, 8, 0, 7);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#F6EBCB';
        ctx.font = '800 11px ' + FONT_BODY;
        ctx.textAlign = 'center';
        ctx.fillText(ch, x + TILE / 2, y + TILE - 16);
      } else if (ch === '^') {
        for (let k = 0; k < 2; k++) {
          const sx = x + k * 16;
          ctx.beginPath();
          ctx.moveTo(sx + 1, y + TILE);
          ctx.lineTo(sx + 8 + j(k), y + 8);
          ctx.lineTo(sx + 15, y + TILE);
          ctx.closePath();
          ctx.fillStyle = '#D0402E';
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = INK_COLOR;
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      } else if (ch === '|') {
        ctx.strokeStyle = INK_COLOR;
        ctx.lineCap = 'round';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(x + 8, y);
        ctx.lineTo(x + 8, y + TILE);
        ctx.moveTo(x + TILE - 8, y);
        ctx.lineTo(x + TILE - 8, y + TILE);
        ctx.stroke();
        ctx.strokeStyle = '#C99A55';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x + 8, y);
        ctx.lineTo(x + 8, y + TILE);
        ctx.moveTo(x + TILE - 8, y);
        ctx.lineTo(x + TILE - 8, y + TILE);
        ctx.stroke();
        ctx.strokeStyle = INK_COLOR;
        ctx.lineWidth = 7;
        ctx.beginPath();
        for (const q of [6, 22]) {
          ctx.moveTo(x + 8, y + q);
          ctx.lineTo(x + TILE - 8, y + q);
        }
        ctx.stroke();
        ctx.strokeStyle = '#E2B96F';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        for (const q of [6, 22]) {
          ctx.moveTo(x + 8, y + q);
          ctx.lineTo(x + TILE - 8, y + q);
        }
        ctx.stroke();
      } else if (isDoor(ch)) {
        const op = runtime.openDoors[ch.toLowerCase()];
        if (op) {
          ctx.setLineDash([4, 6]);
          ctx.strokeStyle = 'rgba(27,22,18,.45)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 4, y, TILE - 8, TILE);
          ctx.setLineDash([]);
        } else {
          ctx.fillStyle = '#D0402E';
          ctx.fillRect(x + 2, y, TILE - 4, TILE);
          ctx.fillStyle = '#F6EBCB';
          for (let k = 0; k < 3; k++) ctx.fillRect(x + 6 + k * 9, y, 4, TILE);
          ctx.strokeStyle = INK_COLOR;
          ctx.lineWidth = 4;
          ctx.strokeRect(x + 2, y, TILE - 4, TILE);
        }
      }
    }
  for (const p of runtime.plates) {
    const x = p.c * TILE,
      y = p.r * TILE,
      on = p.t > 0,
      h = on ? 4 : 9;
    ctx.fillStyle = on ? '#2F8F8A' : '#E2A93B';
    roundRectPath(x + 2, y + TILE - h, TILE - 4, h, 3);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK_COLOR;
    ctx.stroke();
    if (on) {
      ctx.beginPath();
      ctx.arc(
        x + TILE / 2,
        y + TILE - 14,
        13,
        -Math.PI / 2,
        -Math.PI / 2 + (p.t / PLATE_HOLD_TIME) * Math.PI * 2,
      );
      ctx.strokeStyle = '#2F8F8A';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }
  const locked = isBossAlive();
  for (let r = 0; r < 17; r++)
    for (let c = 0; c < 30; c++)
      if (runtime.grid[r][c] === 'E') {
        const cx = c * TILE + TILE / 2,
          cy = r * TILE + TILE / 2,
          pulse = 1 + Math.sin(gameState.time * 4) * 0.06;
        if (!locked) {
          const gl = ctx.createRadialGradient(cx, cy, 4, cx, cy, 50);
          gl.addColorStop(0, 'rgba(255,240,170,.9)');
          gl.addColorStop(1, 'rgba(255,240,170,0)');
          ctx.fillStyle = gl;
          ctx.fillRect(cx - 60, cy - 60, 120, 120);
        }
        ctx.globalAlpha = locked ? 0.45 : 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 15 * pulse, 22 * pulse, 0, 0, 7);
        ctx.fillStyle = locked ? '#9C9380' : '#F6EBCB';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = INK_COLOR;
        ctx.stroke();
        ctx.fillStyle = '#D0402E';
        ctx.beginPath();
        for (let k = 0; k < 10; k++) {
          const a = -Math.PI / 2 + (k * Math.PI) / 5,
            rad = k % 2 ? 4 : 9;
          ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }
}
/* le héros : petit fantôme en salopette de jean (cartoon 1930) */
