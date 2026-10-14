// Sprites des boss (PNG détourés), chargés depuis src/assets/sprites/<clé>.png.
// Vite les inline dans le fichier final (voir vite.config.js).
export {
  BOLT_CROUCH_METRICS,
  BOLT_RUN_METRICS,
  BOLT_SPRITE_METRICS,
  WITCH_SPRITE_METRICS,
} from '../data/sprite-metrics.js';
const urls = import.meta.glob('../assets/sprites/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});
export const SPRITES = {};
if (typeof Image !== 'undefined') {
  for (const [file, url] of Object.entries(urls)) {
    const img = new Image();
    img.src = url;
    SPRITES[file.split('/').pop().replace('.png', '')] = img;
  }
}

/** Le sprite `k` est-il chargé et utilisable ? */
export function isSpriteReady(k) {
  const i = SPRITES[k];
  return !!(i && i.complete && i.naturalWidth > 0);
}
