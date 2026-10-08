// Grow successive layers around a fixed T0 and track how many patches contain the cluster tiles A, B, C, E.
import { writeFileSync } from 'fs';
import { construct, strip } from './tiles.js';
import { makeTile, growCorona, growLayer } from './engine.js';

const T = construct();
const { kinds, pieces } = T;
const core = makeTile('T0', pieces.D);
const clusterKind = { A: 'T1', B: 'T1b', C: 'T1', E: 'T1b' };
const clusterKeys = Object.fromEntries(
  Object.entries(clusterKind).map(([k, kind]) => [k, makeTile(kind, strip(pieces[k])).key]),
);
const present = (st) => {
  const have = new Set(st.tiles.map((t) => t.key));
  return Object.entries(clusterKeys).filter(([, k]) => have.has(k)).map(([n]) => n).join('');
};
const hasCluster = (st) => present(st) === 'ABCE';

const maxLayers = Number(process.argv[2] || 3);
const cap = Number(process.argv[3] || 200000);
const opts = { maxNodes: 5_000_000, allowPhantoms: true };

let t0 = Date.now();
let { results: states } = growCorona(core, kinds, opts);
console.log(`layer 1: ${states.length} patches, ${states.filter(hasCluster).length} contain A,B,C,E  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
const history = [states];

for (let layer = 2; layer <= maxLayers; layer++) {
  t0 = Date.now();
  const next = [];
  let withPhantom = 0;
  let truncated = 0;
  for (const st of states) {
    const inner = st.tiles; // every tile in the patch must be fully surrounded
    const { results, truncated: tr } = growLayer(st, inner, kinds, opts);
    if (tr) truncated++;
    for (const r of results) {
      if ([...r.phantoms.values()].length) withPhantom++;
      next.push(r);
    }
    if (next.length > cap) { console.log(`  cap of ${cap} patches reached, stopping layer ${layer}`); break; }
  }
  const ok = next.filter(hasCluster).length;
  const survivors = new Set();
  console.log(`layer ${layer}: ${next.length} patches from ${states.length} parents; ${ok} contain A,B,C,E; ` +
    `with phantoms: ${withPhantom}; truncated searches: ${truncated}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  const byPresent = new Map();
  for (const st of next) byPresent.set(present(st) || '-', (byPresent.get(present(st) || '-') || 0) + 1);
  console.log('  cluster tiles present in survivors:', JSON.stringify(Object.fromEntries(byPresent)));
  history.push(next);
  states = next;
  if (!states.length) break;
}

// Which layer-1 patches survive to the last layer computed?
const lastLayer = history.length;
console.log(`\ncomputed ${lastLayer} layers`);
