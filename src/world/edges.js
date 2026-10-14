import { levels } from '../data/levels.js';
import { ENTB, EXITB, FL, LAST_HANDMADE_ROOM, NO_FLIP, OPPOSITE_SIDE, ROOM_POSITIONS } from './world.js';
// ---- liens
function rowsFor(i, s) {
  if (i <= LAST_HANDMADE_ROOM) {
    const es = NO_FLIP ? 'l' : FL[i] ? 'r' : 'l';
    const r = (s === es ? ENTB[i] : EXITB[i]) || [1, 13];
    return {
      r0: r[0],
      r1: r[1],
    };
  }
  return {
    r0: 1,
    r1: 13,
  };
}
export function horizontalEdge(a, b, xa = {}, xb = {}) {
  const [ax, ay] = ROOM_POSITIONS[a],
    [bx, by] = ROOM_POSITIONS[b];
  if (ay !== by || Math.abs(ax - bx) !== 1) throw new Error('lien horizontal impossible ' + a + '-' + b);
  let sa = bx > ax ? 'r' : 'l',
    sb = OPPOSITE_SIDE[sa];
  if (NO_FLIP) {
    if (a <= LAST_HANDMADE_ROOM && !xa.sec) sa = xa.fwd ? 'r' : 'l';
    if (b <= LAST_HANDMADE_ROOM && !xb.sec) sb = xb.fwd ? 'r' : 'l';
  } else {
    // une salle écrite à la main a son entrée du côté de son retournement
    const chk = (i, s, x) => {
      if (i <= LAST_HANDMADE_ROOM && !x.sec && !x.vert) {
        const es = FL[i] ? 'r' : 'l';
        const want = x.fwd ? OPPOSITE_SIDE[es] : es;
        if (s !== want) throw new Error('mauvais côté : salle ' + i + ' lien ' + s + ' attendu ' + want);
      }
    };
    chk(a, sa, xa);
    chk(b, sb, xb);
  }
  const ra = xa.sec
      ? {
          r0: 4,
          r1: 7,
        }
      : rowsFor(a, sa),
    rb = xb.sec
      ? {
          r0: 4,
          r1: 7,
        }
      : rowsFor(b, sb);
  levels[a].links.push({
    s: sa,
    ...ra,
    to: b,
    ...xa,
  });
  levels[b].links.push({
    s: sb,
    ...rb,
    to: a,
    ...xb,
  });
}
export function verticalEdge(u, d, o = {}) {
  const [ux, uy] = ROOM_POSITIONS[u],
    [dx, dy] = ROOM_POSITIONS[d];
  if (ux !== dx || dy !== uy + 1) throw new Error('lien vertical impossible ' + u + '|' + d);
  const base = {
    c0: o.c0,
    c1: o.c1,
    kind: o.kind || 'stairs',
  };
  if (o.lad || base.kind === 'ladder') base.lad = 1;
  if (o.gate) base.gate = o.gate;
  if (o.auto) base.auto = 1;
  if (o.boss !== undefined) base.boss = o.boss;
  levels[u].links.push({
    s: 'b',
    ...base,
    to: d,
    ...(o.fwd
      ? {
          fwd: 1,
        }
      : {}),
  });
  levels[d].links.push({
    s: 't',
    ...base,
    to: u,
  });
}
export const GATE_REQUIREMENTS = {
  dj: {
    all: [5],
  },
  gap: {
    all: [4, 5],
  },
};
export const edgeColumns = (y, kind) => {
  const A = y % 2 === 0;
  return kind === 'ladder' ? (A ? [5, 5] : [24, 24]) : A ? [4, 6] : [23, 25];
};

// ---- noms et indications des salles générées
export const CORRIDOR_NAMES = [
  'Galerie',
  'Couloir',
  'Passage',
  'Boyau',
  'Allée',
  'Souterrain',
  'Conduit',
  'Arcade',
  'Tunnel',
  'Coursive',
];
export const CORRIDOR_SUFFIXES = [
  'des Échos',
  'du Tic-Tac',
  'des Rouages',
  'des Reflets',
  'du Pendule',
  'des Cordes',
  'de la Poussière',
  'des Lanternes',
  'du Balancier',
  'des Chuchotis',
  'du Carillon',
  "de l'Horloger",
  'des Marionnettes',
  'du Phonographe',
  'des Ombres',
  'du Ruban',
  'des Bobines',
  'du Projecteur',
  'des Applaudissements',
  'du Rideau',
];
export const HINT_FREE = [''];
export const HINT_BY_TIER = {
  E: '',
  J: '',
  D: '',
  B: '',
  F: '',
};
export const HINT_BY_KIND = {
  ladder:
    "Une échelle ! Maintiens ↑ (ou le joystick vers le haut) pour monter, ↓ pour descendre, Saut pour lâcher l'échelle en sautant (avec ← / → pour sauter de côté).",
  stairs: '',
  dj: '',
  gap: '',
};

// choix des 4 salles d'approche d'une aile : elles n'exigent que des échos déjà possédés (O), dont le dernier gagné (newest)
