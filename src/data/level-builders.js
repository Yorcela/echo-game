/* ---------- Niveaux : 30 colonnes x 17 lignes, sol à la ligne 14 ----------
   # mur  % mur fissuré (coup de tête)  & mur renforcé (coup de tête en Colosse)  ^ pics
   P départ  E sortie  a-z plaques  A-Z portes  * marcheur  @ boss */
export function build(f) {
  const g = [];
  for (let r = 0; r < 17; r++) {
    g.push([]);
    for (let c = 0; c < 30; c++) g[r].push(r == 0 || r >= 14 || c == 0 || c == 29 ? '#' : '.');
  }
  const s = (r, c, ch = '#') => {
      g[r][c] = ch;
    },
    h = (r, a, b, ch = '#') => {
      for (let c = a; c <= b; c++) g[r][c] = ch;
    },
    v = (c, a, b, ch = '#') => {
      for (let r = a; r <= b; r++) g[r][c] = ch;
    };
  f(s, h, v);
  return g.map((x) => x.join(''));
}
export const arena = (x) =>
  build((s, h, v) => {
    s(13, 2, 'P');
    s(13, 24, '@');
    s(13, 28, 'E');
    x && x(s, h, v);
  });
