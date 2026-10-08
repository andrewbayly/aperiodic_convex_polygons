// Dump first coronas (and pruning survivors) as canonical strings. Usage: AB=a,b,d node dump.js H|P out.json
import { writeFileSync } from 'fs';
import { buildExact, mirrorPoly } from './ab_exact.js';
import { makeKind, tileFromPoly, growCorona, growLayer } from './engine.js';
const mode = process.argv[2] || 'H', out = process.argv[3] || `js_${mode}.json`;
const { pieces } = buildExact();
const kinds = { P: makeKind('P', pieces.A), Pb: makeKind('Pb', mirrorPoly(pieces.A)), H: makeKind('H', pieces.H), Hb: makeKind('Hb', mirrorPoly(pieces.H)) };
const ref = tileFromPoly(kinds[mode === 'H' ? 'H' : 'P'], mode === 'H' ? pieces.H : pieces.A);
export const ps = (e) => { const n = e.n, g = (x) => x; return `${n[0]}+${n[1]}s/${e.d}`; };
export const tstr = (t) => t.pts.map((p) => `${ps(p[0])},${ps(p[1])}`).sort().join(';');
const { results: seeds } = growCorona(ref, kinds, {});
const surv = [];
for (const st of seeds) {
  let dead = false;
  for (let i = 0; i < st.tiles.length && !dead; i++) { const r = growLayer(st, [st.tiles[i]], kinds, { maxNodes: 30000 }); if (!r.truncated && !r.results.length) dead = true; }
  if (!dead) surv.push(st);
}
writeFileSync(out, JSON.stringify({ coronas: seeds.map((st) => st.tiles.map(tstr).sort()), survivors: surv.map((st) => st.tiles.map(tstr).sort()) }));
console.log(mode, 'coronas', seeds.length, 'survivors', surv.length);
