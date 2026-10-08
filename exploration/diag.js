import { construct, strip } from './tiles.js';
import { makeTile, growCorona, growLayer } from './engine.js';
const T = construct(); const { kinds, pieces } = T;
const core = makeTile('T0', pieces.D);
const ck = {A:'T1',B:'T1b',C:'T1',E:'T1b'};
const keys = Object.entries(ck).map(([k,kind])=>makeTile(kind, strip(pieces[k])).key);
const { results } = growCorona(core, kinds, { allowPhantoms: false });
const pick = [results.find(s=>keys.every(k=>s.tiles.some(t=>t.key===k))), results[0], results[60]];
for (const [i, st] of pick.entries()) {
  for (const ph of [false, true]) {
    const t0 = Date.now();
    const r = growLayer(st, st.tiles, kinds, { maxNodes: 300000, allowPhantoms: ph });
    console.log(`state ${i} (${st.tiles.length} tiles) phantoms=${ph}: nodes=${r.nodes} results=${r.results.length} truncated=${r.truncated} ${((Date.now()-t0)/1000).toFixed(1)}s`);
  }
}
