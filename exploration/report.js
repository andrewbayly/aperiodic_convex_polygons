// Enumerate angle-level vertex stars, then cross-check against the stars that occur inside
// the Tile(1,1) cluster. Writes stars.json.
import { writeFileSync } from 'fs';
import { construct } from './tiles.js';
import { cornerTypes, enumerateStars, actualStar } from './stars.js';

const T = construct();
const types = cornerTypes(T.kinds);
const { A, B } = enumerateStars(types);
const angDeg = (c) => c.angle * 15;
const show = (st) => st.seq.map((c) => `${c.id}(${angDeg(c)}°)`).join(' ');

const byLen = (n) => A.filter((s) => s.seq.length === n);
console.log('corner types:', types.map((t) => `${t.id}=${angDeg(t)}°`).join('  '));
console.log('\nType A (360° from corners):');
for (const n of [3, 4]) {
  const all = byLen(n);
  console.log(`  ${n} corners: ${all.length} cyclic arrangements, ${all.filter((s) => s.e2e).length} edge-to-edge consistent`);
}
console.log('Type B (180° of corners + straight tile / T-junction):');
console.log(`  ${B.length} arrangements, ${B.filter((s) => s.e2e).length} with the two corners matching along their shared ray`);

// Tile(1,1) cluster: stars at the interior vertices P, R and the T-junction S.
console.log('\nStars occurring inside the Tile(1,1) cluster:');
const polys = Object.values(T.pieces);
const Aset = new Map(A.map((s) => [s.key, s]));
const Bset = new Map(B.map((s) => [s.key, s]));
for (const [name, O] of [['P', T.P], ['R', T.R], ['S', T.S]]) {
  const st = actualStar(O, polys, T.kinds);
  const found = st.type === 'A' ? Aset.get(st.key) : st.type === 'B' ? Bset.get(st.key) : null;
  console.log(`  ${name}: type ${st.type}  ${st.items.map((it) => `${it.id}(${it.angle * 15}°)`).join(' ')}  ` +
    `in enumeration: ${found ? 'yes' : 'NO'}  edge-to-edge: ${found ? found.e2e : '-'}`);
}

console.log('\nEdge-to-edge-consistent type A stars:');
for (const s of A.filter((x) => x.e2e)) console.log('  ' + show(s));
console.log('Edge-consistent type B stars:');
for (const s of B.filter((x) => x.e2e)) console.log('  S | ' + show(s));

writeFileSync('stars.json', JSON.stringify({
  cornerTypes: types,
  A: A.map((s) => ({ key: s.key, e2e: s.e2e, angles: s.seq.map(angDeg) })),
  B: B.map((s) => ({ key: s.key, e2e: s.e2e, angles: s.seq.map(angDeg) })),
}, null, 1));
