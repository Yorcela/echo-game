// Sprites des boss (PNG détourés), chargés depuis src/assets/sprites/<clé>.png.
// Vite les inline dans le fichier final (voir vite.config.js).
import { BCRI, BINFO, BRUN, WINFO } from '../data/sprite-metrics.js';

const urls = import.meta.glob('../assets/sprites/*.png', { eager: true, query: '?url', import: 'default' });

export const SPR = {};
if (typeof Image !== 'undefined') {
  for (const [file, url] of Object.entries(urls)) {
    const img = new Image();
    img.src = url;
    SPR[file.split('/').pop().replace('.png', '')] = img;
  }
}

/** Le sprite `k` est-il chargé et utilisable ? */
export function sprOK(k) {
  const i = SPR[k];
  return !!(i && i.complete && i.naturalWidth > 0);
}

export { BCRI, BINFO, BRUN, WINFO };
