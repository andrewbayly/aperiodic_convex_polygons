// Inspect the surviving T0 coronas: what exactly surrounds T0, and how do the survivors differ?
import { writeFileSync } from 'fs';
import { construct, strip } from './tiles.js';
import { makeTile, growCorona, growLayer } from './engine.js';
import { num } from './geom.js';

const T = construct();
const { kinds, pieces } = T;
const core = makeTile('T0', pieces.D);
const ck = { A: 'T1', B: 'T1b', C: 'T1', E: 'T1b' };
const named = Object.fromEntries(Object.entries(ck).map(([k, kind]) => [makeTile(kind, strip(pieces[k])).key, k]));

const { results: seeds } = growCorona(core, kinds, {});
const alive = seeds.filter((st) => st.tiles.every((_, i) => growLayer(st, [st.tiles[i]], kinds, { maxNodes: 200000 }).results.length > 0));
console.log(`${alive.length} surviving coronas of T0`);
const f = (p) => num(p).map((v) => v.toFixed(3)).join(',');
alive.forEach((st, n) => {
  const extras = st.tiles.filter((t) => t !== core && !named[t.key]);
  console.log(`\nsurvivor ${n}: cluster tiles ${st.tiles.filter((t) => named[t.key]).map((t) => named[t.key]).join('')}  + ${extras.length} outside tiles; phantoms: ${st.phantoms.size}`);
  for (const t of extras) console.log(`   ${t.kind}  ${t.pts.map(f).join('  ')}`);
});
writeFileSync('survivors.json', JSON.stringify(alive.map((st) => st.tiles.map((t) => ({ kind: t.kind, role: named[t.key] || null, pts: t.pts.map((p) => [p.x.val(), p.y.val()]) })))));
