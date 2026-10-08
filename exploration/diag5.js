// Sanity check: for each cluster piece X, does growCorona(X) produce coronas that contain the
// true neighbouring cluster pieces in their cluster positions?
import { construct, strip } from './tiles.js';
import { makeTile, growCorona } from './engine.js';

const T = construct();
const { kinds, pieces } = T;
const kindOf = { A: 'T1', B: 'T1b', C: 'T1', D: 'T0', E: 'T1b' };
const tiles = Object.fromEntries(Object.entries(kindOf).map(([k, kind]) => [k, makeTile(kind, strip(pieces[k]))]));

for (const X of Object.keys(tiles)) {
  const t0 = Date.now();
  const { results, nodes, truncated } = growCorona(tiles[X], kinds, { maxNodes: 300000 });
  const others = Object.keys(tiles).filter((k) => k !== X);
  const touching = others.filter((k) => {
    // pieces that actually share a boundary point with X in the cluster
    const px = new Set(strip(pieces[X]).map((p) => p.x.key() + '|' + p.y.key()));
    return strip(pieces[k]).some((p) => px.has(p.x.key() + '|' + p.y.key()));
  });
  const full = results.filter((st) => touching.every((k) => st.tiles.some((t) => t.key === tiles[k].key)));
  console.log(`corona of ${X}: ${results.length} coronas (${nodes} nodes${truncated ? ', TRUNCATED' : ''}, ${((Date.now() - t0) / 1000).toFixed(1)}s); ` +
    `pieces sharing a vertex with ${X}: ${touching.join('')}; coronas containing all of them: ${full.length}`);
}
