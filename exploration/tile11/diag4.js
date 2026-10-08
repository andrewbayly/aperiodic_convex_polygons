import { construct, strip } from './tiles.js';
import { makeTile, growCorona, growLayer } from './engine.js';
import { num } from './geom.js';

const T = construct();
const { kinds, pieces } = T;
const core = makeTile('T0', pieces.D);
const ck = { A: 'T1', B: 'T1b', C: 'T1', E: 'T1b' };
const keys = Object.entries(ck).map(([k, kind]) => makeTile(kind, strip(pieces[k])).key);
const { results } = growCorona(core, kinds, { allowPhantoms: false });
const st = results.find((s) => keys.every((k) => s.tiles.some((t) => t.key === k)));
const f2 = (p) => num(p).map((v) => v.toFixed(3)).join(',');
let n = 0;
const r = growLayer(st, st.tiles, kinds, {
  maxNodes: 1000,
  trace: (state, f, log) => {
    if (n++ < 12) console.log(`depth ${state.tiles.length - st.tiles.length} frontier ${f2(f.O)} gap start=${f.g0} len=${f.w}: ${log.join('; ') || '(no candidate fits the gap)'}`);
  },
});
console.log('results', r.results.length, 'nodes', r.nodes);
