import { strip } from './tiles.js';
import { makeTile, growCorona, growLayer } from './engine.js';
import { kinds, kindOf, pieces } from './qkinds.js';
const tiles = Object.fromEntries(Object.keys(pieces).map((k) => [k, makeTile(kindOf[k], strip(pieces[k]))]));
const { results } = growCorona(tiles.H, kinds, {});
const alive = results.filter(st => st.tiles.every((_, i) => growLayer(st, [st.tiles[i]], kinds, { maxNodes: 200000 }).results.length > 0));
const st = alive.find(s => s.tiles.slice(1).every(t => t.kind === 'Hx'));
console.log('six-hexagon corona found:', !!st);
// Each outer hexagon: how many completions of its own corona?
for (let i = 1; i < st.tiles.length; i++) {
  const r = growLayer(st, [st.tiles[i]], kinds, { maxNodes: 500000 });
  console.log(`neighbour ${i}: completions ${r.results.length} nodes ${r.nodes} trunc ${r.truncated}`);
}
// full second layer
const t0 = Date.now();
const r = growLayer(st, st.tiles, kinds, { maxNodes: 3_000_000 });
console.log(`second layer (all ${st.tiles.length} tiles surrounded): results ${r.results.length}, nodes ${r.nodes}, truncated ${r.truncated}, ${((Date.now()-t0)/1000).toFixed(1)}s`);
