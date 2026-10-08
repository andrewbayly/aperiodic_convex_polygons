import { strip } from './tiles.js';
import { makeTile, growCorona, growLayer } from './engine.js';
import { kinds, kindOf, pieces } from './qkinds.js';
import { num } from './geom.js';
const tiles = Object.fromEntries(Object.keys(pieces).map((k) => [k, makeTile(kindOf[k], strip(pieces[k]))]));
const named = Object.fromEntries(['A','B','C','D'].map(k=>[tiles[k].key,k]));
const ref = tiles.H;
const { results } = growCorona(ref, kinds, {});
const alive = results.filter(st => st.tiles.every((_, i) => growLayer(st, [st.tiles[i]], kinds, { maxNodes: 200000 }).results.length > 0));
const f = (p)=>num(p).map(v=>v.toFixed(3)).join(',');
alive.forEach((st,n)=>{
  const inC = st.tiles.filter(t=>named[t.key]).map(t=>named[t.key]).join('');
  console.log(`survivor ${n}: ${st.tiles.length-1} neighbours, cluster pentagons present: ${inC||'-'}, phantoms ${st.phantoms.size}`);
  for (const t of st.tiles.slice(1)) console.log(`   ${t.kind} ${named[t.key]||'(not in cluster)'}  ${t.pts.map(f).join('  ')}`);
});
