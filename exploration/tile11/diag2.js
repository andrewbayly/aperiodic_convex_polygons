import { construct, strip } from './tiles.js';
import { makeTile, growCorona, growLayer, gapsAt, wedgeAt } from './engine.js';
import { pkey, num } from './geom.js';
const T = construct(); const { kinds, pieces } = T;
const core = makeTile('T0', pieces.D);
const ck = {A:'T1',B:'T1b',C:'T1',E:'T1b'};
const keys = Object.entries(ck).map(([k,kind])=>makeTile(kind, strip(pieces[k])).key);
const { results } = growCorona(core, kinds, { allowPhantoms: false });
const cl = results.filter(s=>keys.every(k=>s.tiles.some(t=>t.key===k)));
console.log('cluster-containing coronas:', cl.length);
cl.forEach((st,i)=>{
  const extras = st.tiles.filter(t=>t!==core && !keys.includes(t.key));
  const r = growLayer(st, st.tiles, kinds, { maxNodes: 40000, allowPhantoms: true });
  console.log(i, 'extras:', extras.map(t=>t.kind+'@'+t.pts.map(p=>num(p).map(v=>v.toFixed(2)).join(',')).join(' ')).join(' | '), '-> layer2 nodes', r.nodes, 'results', r.results.length);
});
