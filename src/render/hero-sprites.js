// Héros en images complètes (atlas par couleur de salopette) : une image par état et par temps, retournée selon le sens.
import { ctx } from '../core/canvas.ts';
import { SPRITES, isSpriteReady } from './sprites.js';
import atlas from '../data/hero-atlas.json';

export const OUTFITS = ['blue', 'yellow', 'brown', 'purple', 'red'];
const OUTFIT_BY_COLOR = { '#2F8F8A': 'red', '#E2A93B': 'yellow', '#7A5BA6': 'purple', '#7B4A2E': 'brown' };
/** Teinte de la salopette : bleue normalement, brune en Colosse, et celle de l'écho pour un clone. */
export const outfitOf = (b, o) =>
  b.big ? 'brown' : OUTFIT_BY_COLOR[o.jean] || OUTFIT_BY_COLOR[o.col] || 'blue';
export const heroSpritesReady = (outfit) => isSpriteReady('hero-atlas-' + outfit);

const SCALE = (31 * 1.5) / 150; // ×1,5 : // hauteur de l'image debout (≈150 px) → ≈31 unités de jeu pour un héros de 28
const cycle = (list, u) => list[Math.floor((((u % 1) + 1) % 1) * list.length) % list.length];

/** Choisit l'image selon l'état du corps. st : { b, t, ph, run, air, up, lad, hit, swim, hurt, cq } */
export function frameFor(st) {
  const { b, t } = st;
  if (b.dash > 0) return cycle(['dash0', 'dash1'], t * 12);
  if (st.swim)
    return cycle(['swim0', 'swim1', 'swim2', 'swim3', 'swim4'], Math.abs(b.vx) > 8 ? t * 3.5 : t * 1.2);
  if (st.lad)
    return cycle(['ladder0', 'ladder1', 'ladder2', 'ladder3'], Math.abs(b.vy) > 4 || b.lc ? st.cq * 0.9 : 0);
  if (st.hit) return cycle(['punch0', 'punch1', 'punch2', 'punch3'], 1 - Math.min(1, b.hit / 0.2));
  if (st.hurt) return t % 0.5 < 0.25 ? 'hurt0' : 'hurt1';
  if (!b.g && !st.lad && b.ws && b.wc > 0 && b.vy > 0) return cycle(['wall0', 'wall1'], t * 6);
  if (st.air) return st.up ? 'jump' : b.vy > 120 ? 'fall' : 'jump';
  if (st.run) return 'run' + (((Math.floor(st.ph / (Math.PI / 4)) % 8) + 8) % 8);
  return t % 3.4 < 0.14 ? 'idle3' : 'idle0';
}
export function drawHeroSprites(st) {
  const { outfit, b } = st;
  const key = frameFor(st),
    m = atlas[key] || atlas.idle0,
    im = SPRITES['hero-atlas-' + outfit];
  const w = m[2] * SCALE,
    h = m[3] * SCALE;
  // pieds en (0,0) ; le dessin regarde vers la droite, retourné quand le héros va à gauche (le repère est déjà orienté)
  ctx.drawImage(im, m[0], m[1], m[2], m[3], -w * 0.5 + (key.startsWith('run') ? 1.5 : 0), -h + 0.8, w, h);
  return b;
}
