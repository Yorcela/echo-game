import { ARENA, KING, N, ORDER, POOL, handLevels, levels } from '../data/levels.js';
import { genRoom, rngf } from './generator.js';
import { HUB } from '../state/state.js';
import {
  ALC1,
  ALC2,
  BNAME,
  ENEMY,
  FL,
  GCELLS,
  HLAST,
  NF,
  PATCH2,
  POS,
  REST_AT,
  SLOTS,
  TIER_AT,
  WORLD,
  ZONE_OF,
  cellAt,
  rev,
  setCh,
  swapLR,
} from './world.js';
import { GA, GATE_KIND, GN, HFREE, HKIND, HTIER, edgeCols, hEdge, vEdge } from './edges.js';
// choix des 4 salles d'approche d'une aile : elles n'exigent que des échos déjà possédés (O), dont le dernier gagné (newest)
function chooseApproach(r, O, newest, used, rnd) {
  if (r === 1)
    return [N.pont1, N.pont2, N.pont3, N.pont4].map((x) => ({
      r: x,
      need: [],
      d: 0,
    }));
  const fits = POOL.filter((p) => (p.multi || !used.has(p)) && p.need.every((e) => O.has(e)));
  const pickOf = (a) => a[Math.floor(rnd() * a.length)];
  const chosen = [],
    cov = new Set();
  const take = (p) => {
    chosen.push(p);
    if (!p.multi) used.add(p);
    p.need.forEach((e) => cov.add(e));
  };
  for (let k = 0; k < 2; k++) {
    const c = fits.filter((p) => p.need.includes(newest) && (p.multi || !chosen.includes(p)));
    if (c.length) take(pickOf(c));
  }
  while (chosen.length < 4) {
    const c = fits.filter((p) => p.multi || !chosen.includes(p));
    if (!c.length) break;
    let best = -1,
      bl = [];
    for (const p of c) {
      const g = p.need.filter((e) => !cov.has(e)).length;
      if (g > best) {
        best = g;
        bl = [p];
      } else if (g === best) bl.push(p);
    }
    take(pickOf(bl));
  }
  while (chosen.length < 4)
    chosen.push({
      gen: 'F',
      need: [],
      d: 0,
      multi: 1,
    });
  chosen.forEach((p) => (p._o = rnd()));
  chosen.sort((a, b) => a.d - b.d || a._o - b._o);
  return chosen;
}
function prepHand(l, i) {
  l.rows = l.rows.slice();
  let sw = 0;
  if (l.rev && !NF) {
    l.rows = l.rows.map(rev);
    sw++;
  }
  for (let r = 0; r < 17; r++) if (l.rows[r].includes('E')) l.rows[r] = l.rows[r].replace(/E/g, '.');
  for (const [r, c0, c1, ch] of PATCH2[l.name] || []) for (let c = c0; c <= c1; c++) setCh(l, r, c, ch);
  // portes et murs renforcés sur toute la hauteur : le double saut ne doit pas les contourner
  if (l.need && !l.boss && !l.noExt)
    for (let c = 1; c < 29; c++) {
      const ch = l.rows[13][c];
      if ((ch >= 'A' && ch <= 'Z' && ch !== 'E' && ch !== 'P') || ch === '&') {
        let r0 = 13;
        while (r0 > 1 && l.rows[r0 - 1][c] === ch) r0--;
        for (let r = 1; r < r0; r++) if (l.rows[r][c] === '.') setCh(l, r, c, ch);
      }
    }
  {
    const en = (ENEMY[l.name] || []).slice();
    for (let r = 0; r < 17; r++)
      if (l.rows[r].includes('*')) l.rows[r] = l.rows[r].replace(/\*/g, () => en.shift() || '+');
  }
  if (l.name === 'Pics en rafale') setCh(l, 13, 22, '?');
  if (l.name === 'Les petites bêtes')
    l.plug = {
      to: 39,
      cells: [
        [4, 29],
        [5, 29],
        [6, 29],
        [7, 29],
      ],
    };
  if (!l.boss && l.links.some((k) => k.s === 't')) {
    for (const [r, c0, c1] of [
      [12, 4, 5],
      [10, 0, 2],
      [8, 4, 6],
      [6, 0, 2],
      [4, 4, 6],
      [2, 0, 2],
    ])
      for (let c = c0; c <= c1; c++) if (l.rows[r][c] === '.') setCh(l, r, c, '#');
  }
  if (FL[i]) {
    l.rows = l.rows.map(rev);
    l.flip = 1;
    if (l.sym) l.rows = l.rows.map((r) => r.replace(/[@$]/g, (q) => (q === '@' ? '$' : '@')));
    sw++;
    if (l.plug) l.plug.cells = l.plug.cells.map(([r, c]) => [r, 29 - c]);
  }
  if (sw % 2 && l.hint) l.hint = swapLR(l.hint);
  for (const k of l.links)
    if (k.s === 'l' || k.s === 'r') {
      const col = k.s === 'l' ? 0 : 29;
      for (let r = k.r0; r <= k.r1; r++) setCh(l, r, col, '.');
    }
  if (l.plug) for (const [r, c] of l.plug.cells) setCh(l, r, c, '&');
  if (l.boss) l.bossIdx = i;
}
// tests : installe une salle du catalogue (par son nom) en salle 0, avec une sortie à droite
export function installRoom(name) {
  const r = [...Object.values(N), ...handLevels, KING].find((x) => x && x.name === name && x.rows);
  if (!r) throw new Error('salle inconnue : ' + name);
  const l = {
    ...r,
    rows: r.rows.slice(),
    links: [
      {
        s: 'r',
        r0: 1,
        r1: 13,
        to: HUB,
        fwd: 1,
      },
    ],
    pos: POS[0],
  };
  const pe = POOL.find((p) => p.r && p.r.name === name);
  if (pe) l.need = pe.need.slice();
  levels[0] = l;
  prepHand(l, 0);
  return 0;
}
export function buildWorld(seed) {
  seed = seed | 0;
  const rnd = rngf(seed ^ 0x2545f491);
  levels.length = 0;
  WORLD.seed = seed;
  WORLD.ranks = [];
  WORLD.perm = [];
  const mk = (r) => ({
    ...r,
    rows: r.rows.slice(),
    links: [],
  });
  // 1. contenu des salles à la main
  const H = [];
  [handLevels[0], handLevels[1], handLevels[2], N.bestioles, N.briques].forEach((r, i) => (H[i] = mk(r)));
  H[5] = mk(ARENA.t);
  H[39] = mk(ALC1);
  H[40] = mk(ALC2);
  const perm = SLOTS.map((_, k) => k);
  for (let k = perm.length - 1; k > 0; k--) {
    const j = Math.floor(rnd() * (k + 1));
    [perm[k], perm[j]] = [perm[j], perm[k]];
  }
  const used = new Set(),
    O = new Set(),
    plan = [];
  for (let r = 1; r <= 7; r++) {
    const gain = ORDER[r],
      slot = SLOTS[perm[r - 1]],
      newest = ORDER[r - 1];
    if (r >= 2) O.add(newest);
    const ap = chooseApproach(r, O, newest, used, rnd);
    H[slot.b] = mk(ARENA[gain]);
    ap.forEach((p, j) => {
      const i = slot.ap[j];
      H[i] = p.gen
        ? {
            name: '',
            hint: '',
            rows: [],
            links: [],
            genFill: p.gen,
            need: p.need.slice(),
          }
        : mk(p.r);
      H[i].need = p.need.slice();
      H[i].zoneG = gain;
    });
    H[slot.b].zoneG = gain;
    plan.push({
      r,
      gain,
      slot,
      gate:
        r === 1
          ? {
              t: 1,
            }
          : {
              pw: newest,
            },
      ap: ap.map((p) => (p.r ? p.r.name : '(couloir ' + p.gen + ')')),
    });
  }
  for (let i = 0; i <= HLAST; i++) {
    if (!H[i]) throw new Error('salle manquante ' + i);
    levels[i] = H[i];
  }
  levels[HUB] = {
    name: 'Hall des Échos',
    hint: '',
    rows: [],
    hub: true,
    bench: true,
    links: [],
  };
  GCELLS.forEach((o) => {
    if (o.skip) return;
    levels[o.i] = {
      name: '',
      hint: '',
      rows: [],
      gen: 1,
      pos: [o.x, o.y],
      links: [],
    };
  });
  levels.forEach((l, i) => {
    l.pos = POS[i];
  });
  WORLD.perm = perm;
  WORLD.ranks = plan.map((p) => ({
    r: p.r,
    gain: p.gain,
    boss: p.slot.b,
    from: p.slot.from,
    ap: p.slot.ap,
    gate: p.gate,
    names: p.ap,
  }));

  // 2. liens
  {
    const strip = (a, b) => {
      for (let i = a; i < b; i++)
        hEdge(
          i,
          i + 1,
          {
            fwd: 1,
          },
          {},
        );
    };
    hEdge(HUB, 0, {}, {});
    strip(0, 2);
    {
      const c = FL[2] ? [1, 3] : [26, 28];
      vEdge(2, 3, {
        c0: c[0],
        c1: c[1],
        kind: 'stairs',
        auto: 1,
        fwd: 1,
      });
      const c2 = FL[3] ? [1, 3] : [26, 28];
      vEdge(3, 4, {
        c0: c2[0],
        c1: c2[1],
        kind: 'stairs',
        auto: 1,
        fwd: 1,
      });
    }
    hEdge(
      2,
      40,
      {
        sec: 1,
      },
      {
        sec: 1,
      },
    );
    hEdge(
      3,
      39,
      {
        sec: 1,
      },
      {
        sec: 1,
      },
    );
    hEdge(
      4,
      5,
      {
        fwd: 1,
      },
      {},
    );
    for (const p of plan) {
      const ch = [...p.slot.ap, p.slot.b];
      hEdge(
        p.slot.from,
        ch[0],
        {
          gate: p.gate,
        },
        {},
      );
      for (let k = 0; k < ch.length - 1; k++)
        hEdge(
          ch[k],
          ch[k + 1],
          {
            fwd: 1,
          },
          {},
        );
    }
    hEdge(cellAt(6, 9), cellAt(7, 9));
    hEdge(cellAt(7, 9), cellAt(8, 9));
    for (let x = 0; x < 12; x++) {
      hEdge(cellAt(x, 0), cellAt(x + 1, 0));
      hEdge(cellAt(x, 8), cellAt(x + 1, 8));
    }
    for (const [a, b] of [
      [
        [0, 2],
        [1, 2],
      ],
      [
        [11, 2],
        [12, 2],
      ],
      [
        [11, 4],
        [12, 4],
      ],
      [
        [11, 6],
        [12, 6],
      ],
      [
        [0, 6],
        [1, 6],
      ],
      [
        [1, 6],
        [2, 6],
      ],
      [
        [5, 7],
        [6, 7],
      ],
    ])
      hEdge(cellAt(...a), cellAt(...b));
    const SPINE = ['gap', 'ladder', 'stairs', 'stairs', 'ladder', 'stairs', 'ladder', 'stairs', 'stairs'];
    const vs = (x, y, kind) => {
      const u = cellAt(x, y),
        d = cellAt(x, y + 1);
      if (u === undefined || d === undefined) throw new Error('puits ' + x + ',' + y);
      const c = edgeCols(y, kind);
      vEdge(u, d, {
        c0: c[0],
        c1: c[1],
        kind,
        gate: GATE_KIND[kind],
      });
    };
    SPINE.forEach((k, y) => vs(6, y, k));
    ['stairs', 'ladder', 'stairs', 'ladder', 'dj', 'stairs', 'ladder', 'stairs'].forEach((k, y) =>
      vs(0, y, k),
    );
    ['ladder', 'stairs', 'dj', 'stairs', 'gap', 'ladder', 'stairs', 'stairs'].forEach((k, y) => vs(12, y, k));
    for (const [k, b] of Object.entries(REST_AT)) {
      if (b < 0) continue;
      const [x, y] = k.split(',').map(Number);
      if (cellAt(x, y + 1) !== b) throw new Error('boss ' + b + ' pas sous la salle de repos ' + k);
      vEdge(cellAt(x, y), b, {
        c0: -1,
        c1: -1,
        kind: 'ladder',
        lad: 1,
        boss: b,
        fwd: 0,
      });
      levels[b].links[levels[b].links.length - 1].gate = {
        cl: b,
      };
      levels[cellAt(x, y)].links[levels[cellAt(x, y)].links.length - 1].gate = {
        cl: b,
      };
    }
  }

  // 3. transformation des salles écrites à la main (retournement, remplissage, escaliers, ennemis…)
  levels.forEach((l, i) => {
    if (i > HLAST || l.genFill) return;
    prepHand(l, i);
  });
  // colonne de l'échelle de chaque boss : la plus centrale dont les lignes 1..13 sont vides
  const ladderCol = (rows) => {
    const cs = [];
    for (let c = 4; c <= 26; c++) {
      let ok = true;
      for (let r = 1; r <= 13 && ok; r++) if (rows[r][c] !== '.') ok = false;
      if (ok) cs.push(c);
    }
    cs.sort((a, b) => Math.abs(a - 14) - Math.abs(b - 14));
    if (!cs.length) throw new Error('pas de place pour une échelle');
    return cs[0];
  };
  for (const [k, b] of Object.entries(REST_AT)) {
    if (b < 0) continue;
    const col = ladderCol(levels[b].rows);
    const [x, y] = k.split(',').map(Number);
    const lk1 = levels[b].links.find((q) => q.lad && q.s === 't'),
      lk2 = levels[cellAt(x, y)].links.find((q) => q.lad && q.s === 'b');
    lk1.c0 = lk1.c1 = lk2.c0 = lk2.c1 = col;
  }

  // 4. salles générées (couloirs, puits, repos) + couloirs d'approche
  const used2 = {};
  const nameOf = (o, tier, vt, restB) => {
    let nm,
      k = 0;
    do {
      nm = GN[(o.x * 3 + o.y * 5 + k) % GN.length] + ' ' + GA[(o.x * 7 + o.y * 11 + k * 3) % GA.length];
      k++;
    } while (used2[nm]);
    used2[nm] = 1;
    if (restB !== undefined) {
      nm = restB > 0 ? 'Repos ' + BNAME[levels[restB].gain] : 'Alcôve de repos';
    } else if (vt.length) {
      const a = vt.find((q) => q.s === 't') || vt[0];
      nm = (a.kind === 'ladder' ? 'Puits ' : 'Cheminée ') + GA[(o.x * 5 + o.y * 7) % GA.length];
      if (used2[nm]) nm += ' ' + (o.x + o.y);
      used2[nm] = 1;
    }
    return nm;
  };
  GCELLS.forEach((o) => {
    if (o.skip) return;
    const l = levels[o.i],
      key = o.x + ',' + o.y,
      restB = REST_AT[key];
    l.rest = restB !== undefined;
    l.bench = l.rest;
    l.tier = TIER_AT[key] || 'F';
    const sd = o.fresh ? o.i * 7919 + 13 : (42 + o.k) * 7919 + 13;
    const sp = {
      links: l.links,
      tier: l.tier,
      rest: l.rest,
      seed: sd,
      crabs: l.rest ? 0 : l.tier === 'F' || l.tier === 'E' ? 1 + ((42 + o.k) % 2) : 0,
    };
    const g = genRoom(sp);
    l.rows = g.rows;
    l.hs = g.hs;
    const vt = l.links.filter((q) => q.s === 't' || q.s === 'b');
    const nm = nameOf(o, l.tier, vt, restB);
    let hint;
    if (l.rest)
      hint =
        "Salle de repos : approche-toi du lit puis appuie sur Entrée (ou touche le lit sur mobile) pour dormir : cœurs et Temps (5 s / 10 s) rechargés en entier, mais 20 s s'ajoutent au chrono. Le statut sauvegarde la partie." +
        (restB > 0 ? " L'échelle ouverte descend jusqu'à la salle du boss." : '');
    else if (vt.length) {
      const a = vt.find((q) => q.s === 't') || vt[0];
      hint = HKIND[a.kind] || '';
    } else hint = l.tier === 'F' ? HFREE[(42 + o.k) % HFREE.length] : HTIER[l.tier];
    l.name = nm;
    l.hint = hint;
  });
  // salles d'approche remplies par le générateur (couloirs à obstacle de palier)
  levels.forEach((l, i) => {
    if (i > HLAST || !l.genFill) return;
    const g = genRoom({
      links: l.links,
      tier: l.genFill,
      rest: false,
      seed: i * 104729 + (seed & 0xffff),
      crabs: l.genFill === 'F' ? 1 : 0,
    });
    l.rows = g.rows;
    l.hs = g.hs;
    l.gen = 1;
    l.tier = l.genFill;
    l.name = GN[i % GN.length] + ' ' + GA[(i * 7 + (seed & 15)) % GA.length];
    l.hint = l.tier === 'F' ? HFREE[i % HFREE.length] : HTIER[l.tier];
  });
  // Hall des Échos (départ au centre, arène du Roi à la fin)
  {
    const l = levels[HUB];
    const g = genRoom({
      links: l.links,
      tier: 'F',
      rest: true,
      seed: 4141,
    });
    const rows = g.rows.map((r) => r.replace('=', '.').replace('P', '.'));
    const a = rows[13].split('');
    a[14] = 'P';
    rows[13] = a.join('');
    l.rows = rows;
    l.hs = [];
    l.zone = 0;
  }
  // zones de décor : celle du boss de l'aile ; les couloirs générés prennent celle de la salle écrite la plus proche
  levels.forEach((l, i) => {
    if (i > HLAST) return;
    l.zone = i <= 5 || i === 39 || i === 40 || l.zoneG === undefined ? 0 : ZONE_OF[l.zoneG];
  });
  levels.forEach((l, i) => {
    if (i <= HLAST) return;
    if (i === HUB) {
      l.zone = 0;
      return;
    }
    let best = 99,
      z = 0;
    for (let j = 0; j <= HLAST; j++) {
      const d = Math.abs(POS[j][0] - POS[i][0]) + Math.abs(POS[j][1] - POS[i][1]);
      if (d < best) {
        best = d;
        z = levels[j].zone;
      }
    }
    l.zone = z;
  });
  for (let i = 0; i < levels.length; i++)
    for (const k of levels[i].links) {
      const o = levels[k.to].links.find((q) => q.to === i);
      if (!o) throw new Error('lien sans retour ' + i + '>' + k.to);
    }
  return levels;
}
