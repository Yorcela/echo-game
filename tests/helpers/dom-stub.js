// Stubs DOM/canvas minimalistes pour exécuter le jeu sous Node (tests de non-régression).
export function installStubs(g) {
  const noop = () => {};
  const mkCtx = (canvas) => new Proxy({ canvas }, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'measureText') return (s) => ({ width: String(s).length * 7 });
      if (/^create(Linear|Radial)Gradient$|^createPattern$/.test(String(k))) return () => ({ addColorStop: noop });
      if (k === 'getImageData') return () => ({ data: [] });
      return noop;
    },
    set(t, k, v) { t[k] = v; return true; },
  });
  const mkEl = (tag) => {
    const el = {
      tagName: tag, width: 300, height: 150, style: {}, dataset: {}, children: [], hidden: false, value: '',
      classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
      addEventListener: noop, removeEventListener: noop, appendChild: noop, remove: noop, focus: noop, blur: noop,
      setAttribute: noop, getAttribute: () => null, querySelector: () => null, querySelectorAll: () => [],
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 544 }),
      setPointerCapture: noop, releasePointerCapture: noop, firstElementChild: null,
    };
    let ctx; el.getContext = () => (ctx ||= mkCtx(el));
    return el;
  };
  const els = {};
  g.document = {
    getElementById: (id) => (els[id] ||= mkEl('div#' + id)),
    createElement: (t) => mkEl(t), querySelector: () => null, querySelectorAll: () => [],
    addEventListener: noop, body: mkEl('body'), documentElement: mkEl('html'),
  };
  const store = new Map();
  g.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
  g.Image = class { };
  g.matchMedia = () => ({ matches: false, addEventListener: noop });
  g.getComputedStyle = () => ({ display: 'block' });
  g.requestAnimationFrame = noop;
  g.addEventListener = noop;
  g.innerWidth = 1100; g.innerHeight = 700;
  g.window = g;
}

// Générateur pseudo-aléatoire déterministe (remplace Math.random) : reproductible entre ancien et nouveau code.
export function seedRandom(seed) {
  let s = seed >>> 0 || 1;
  Math.random = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

// Scénario déterministe rejoué sur l'ancien et le nouveau code ; renvoie un résumé comparable.
export function runScenario(T) {
  const out = {};
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
  for (const seed of [11, 222, 3333]) {
    T.S.seed = seed; T.buildWorld(seed); T.S.blue = T.pickBlue(seed);
    const rooms = T.LV.map((l) => (l && l.rows ? l.rows.join('') : ''));
    const rec = { n: T.LV.length, world: hash(rooms.join('|')), order: hash(JSON.stringify(T.ORDER)) , runs: [] };
    const picks = [0, 1, 5, 8, 12, 20, 33, 43, 50, 70, 99].filter((i) => i < T.LV.length);
    for (const room of picks) {
      seedRandom(seed * 7919 + room);
      T.resetAll(); T.S.seed = seed; T.buildWorld(seed); T.S.blue = T.pickBlue(seed);
      T.load(room); T.S.mode = 'play';
      const trace = [];
      for (let f = 0; f < 900; f++) {
        T.I.r = f % 220 < 130 ? 1 : 0; T.I.l = f % 220 >= 160 ? 1 : 0; T.I.jp = f % 47 === 0 ? 1 : 0; T.I.jh = f % 47 < 22 ? 1 : 0;
        T.step(1 / 60);
        if (f % 30 === 0) trace.push([Math.round(T.P.x), Math.round(T.P.y), T.S.hp, T.S.mode, T.S.cur]);
        if (T.S.mode !== 'play') { T.S.mode = 'play'; }
      }
      rec.runs.push([room, hash(JSON.stringify(trace))]);
    }
    out[seed] = rec;
  }
  return out;
}
