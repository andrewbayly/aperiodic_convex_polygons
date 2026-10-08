import { construct, strip } from './tiles.js';
import { makeTile, growCorona, gapsAt } from './engine.js';
import { pkey, num } from './geom.js';

const T = construct();
const { kinds, pieces } = T;
const core = makeTile('T0', pieces.D);
const ck = { A: 'T1', B: 'T1b', C: 'T1', E: 'T1b' };
const keys = Object.entries(ck).map(([k, kind]) => makeTile(kind, strip(pieces[k])).key);
const { results } = growCorona(core, kinds, { allowPhantoms: false });
const st = results.find((s) => keys.every((k) => s.tiles.some((t) => t.key === k)));
const f2 = (p) => num(p).map((v) => v.toFixed(3)).join(',');
const seen = new Set();
for (const t of st.tiles) {
  for (const v of t.pts) {
    const k = pkey(v);
    if (seen.has(k)) continue;
    seen.add(k);
    const g = gapsAt(v, st);
    console.log(f2(v), 'gaps(15° units)', JSON.stringify(g));
  }
}
