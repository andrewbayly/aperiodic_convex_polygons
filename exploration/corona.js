// Enumerate all coronas of a fixed T0 and compare them with the Tile(1,1) cluster.
import { construct } from './tiles.js';
import { makeTile, growCorona } from './engine.js';
import { pkey } from './geom.js';

const T = construct();
const { kinds, pieces } = T;

// T0 sits exactly where piece D sits in the cluster; the other cluster tiles are A, B, C, E.
const core = makeTile('T0', pieces.D);
const clusterKind = { A: 'T1', B: 'T1b', C: 'T1', E: 'T1b' };
const strip = (poly) => poly; // pieces C and E contain collinear points; strip below
import { strip as stripPoly } from './tiles.js';
const cluster = Object.fromEntries(
  Object.entries(clusterKind).map(([k, kind]) => [k, makeTile(kind, stripPoly(pieces[k]))]),
);

const mode = process.argv[2] || 'phantoms';
const t0 = Date.now();
const { results, nodes, truncated } = growCorona(core, kinds, { allowPhantoms: mode !== 'nophantoms' });
console.log(`mode=${mode}  search nodes=${nodes}${truncated ? '  (TRUNCATED)' : ''}  coronas=${results.length}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);

const keys = Object.fromEntries(Object.entries(cluster).map(([k, t]) => [k, t.key]));
let withAll = 0;
const missCount = { A: 0, B: 0, C: 0, E: 0 };
const noPhantom = [];
const summary = new Map();
for (const st of results) {
  const have = new Set(st.tiles.map((t) => t.key));
  const hasAll = Object.values(keys).every((k) => have.has(k));
  if (hasAll) withAll++;
  for (const [n, k] of Object.entries(keys)) if (!have.has(k)) missCount[n]++;
  const nPh = [...st.phantoms.values()].reduce((s, a) => s + a.length, 0);
  if (!nPh) noPhantom.push(st);
  const sig = `${st.tiles.length - 1} tiles, ${nPh} phantoms, cluster tiles present: ${Object.entries(keys).filter(([, k]) => have.has(k)).map(([n]) => n).join('') || '-'}`;
  summary.set(sig, (summary.get(sig) || 0) + 1);
}
console.log(`coronas containing all of A,B,C,E in cluster position: ${withAll} / ${results.length}`);
console.log('coronas missing each cluster tile:', JSON.stringify(missCount));
console.log(`coronas with no phantom (fully anchored): ${noPhantom.length}`);
console.log('breakdown:');
for (const [s, c] of [...summary.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`  ${c}\t${s}`);

import('fs').then(({ writeFileSync }) => {
  const dump = results.map((st) => ({
    tiles: st.tiles.slice(1).map((t) => ({ kind: t.kind, pts: t.pts.map((p) => [p.x.val(), p.y.val()]) })),
    phantoms: [...st.phantoms.entries()].map(([k, w]) => ({ at: k, wedges: w })),
  }));
  writeFileSync('coronas.json', JSON.stringify(dump));
});
