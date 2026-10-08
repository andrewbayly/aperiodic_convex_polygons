import { strip } from './tiles.js';
import { makeTile, growCorona, growLayer } from './engine.js';
import { kinds, pieces } from './qkinds.js';
const hk = { Hx: kinds.Hx };
const H = makeTile('Hx', strip(pieces.H));
let { results: states } = growCorona(H, hk, {});
console.log('layer 1 (hexagon-only coronas):', states.length);
for (let L = 2; L <= 4; L++) {
  const next = [];
  const cap = 4000;
  for (const st of states) {
    const r = growLayer(st, st.tiles, hk, { maxNodes: 2_000_000 });
    next.push(...r.results);
    if (next.length > cap) break;
  }
  console.log(`layer ${L}: ${next.length} patches${next.length > cap ? ' (capped)' : ''}, tiles in first: ${next[0] ? next[0].tiles.length : 0}`);
  if (!next.length) break;
  // keep a diverse sample to bound cost
  states = next.slice(0, 300);
}
