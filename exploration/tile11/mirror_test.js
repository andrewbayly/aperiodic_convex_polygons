// Allow the mirror image of T0 (call it T0m) as a fourth kind. Then every tile should still lie in a
// cluster, but now a cluster may be a copy of Tile(1,1) or of its mirror image.
// Usage: node mirror_test.js A|B|D [nodeBudget]
//   A: reference T1 (roles A, C from a T0, roles Bm, Em from a T0m)
//   B: reference T1bar (roles B, E from a T0, roles Am, Cm from a T0m)
//   D: reference T0 (which coronas survive; do any contain a T0m?)
import { construct, strip, describe } from './tiles.js';
import { makeTile, growCorona, growLayer, rotPt } from './engine.js';
import { pkey, padd, psub, mirrorX } from './geom.js';

const T = construct();
const { kinds, pieces } = T;
const mirrorPts = (pts) => pts.map(mirrorX).reverse();
const mkKind = (name, pts) => ({ name, poly: strip(pts), corners: describe(pts) });
const kindsExt = { ...kinds, T0m: mkKind('T0m', mirrorPts(pieces.D)) };

const kindOf = { A: 'T1', B: 'T1b', C: 'T1', D: 'T0', E: 'T1b' };
const tiles = Object.fromEntries(Object.entries(kindOf).map(([k, kind]) => [k, makeTile(kind, strip(pieces[k]))]));
const mirrored = (k, kind) => makeTile(kind, strip(mirrorPts(pieces[k])));

function congruence(src, dst) {
  const target = new Set(dst.pts.map(pkey));
  for (let d = 0; d < 24; d++) {
    const rot = src.pts.map((p) => rotPt(p, d));
    for (const q of dst.pts) {
      const tau = psub(q, rot[0]);
      if (rot.every((p) => target.has(pkey(padd(p, tau))))) return (p) => padd(rotPt(p, d), tau);
    }
  }
  throw new Error('tiles are not directly congruent');
}

const refName = process.argv[2] || 'A';
const budget = Number(process.argv[3] || 30000);
const ref = tiles[refName];

// roles: name -> key of the T0 / T0m tile that witnesses it, when `ref` plays that role.
const roles = {};
if (refName === 'A' || refName === 'B') {
  const same = refName === 'A' ? ['A', 'C'] : ['B', 'E'];
  const other = refName === 'A' ? ['B', 'E'] : ['A', 'C'];
  for (const r of same) {
    const g = congruence(tiles[r], ref);
    roles[r] = makeTile('T0', tiles.D.pts.map(g)).key;
  }
  for (const r of other) {
    const m = mirrored(r, kindOf[refName]); // mirror image of piece r has the same shape as ref
    const g = congruence(m, ref);
    roles[r + 'm'] = makeTile('T0m', mirrorPts(pieces.D).map(g)).key;
  }
}

const t0 = Date.now();
const { results: seeds } = growCorona(ref, kindsExt, {});
console.log(`reference ${refName} (${ref.kind}), kinds ${Object.keys(kindsExt).join(',')}: ${seeds.length} first coronas`);
let dead = 0, alive = 0, undecided = 0;
const tally = new Map();
const clusterKeys = ['A', 'B', 'C', 'E'].map((k) => tiles[k].key);
let n = 0;
for (const st of seeds) {
  let isDead = false, trunc = false;
  for (let i = 0; i < st.tiles.length && !isDead; i++) {
    const r = growLayer(st, [st.tiles[i]], kindsExt, { maxNodes: budget });
    if (r.truncated) trunc = true;
    else if (!r.results.length) isDead = true;
  }
  if (++n % 500 === 0) console.log(`  ... ${n}/${seeds.length}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  if (isDead) { dead++; continue; }
  if (trunc) undecided++; else alive++;
  const have = new Set(st.tiles.map((t) => t.key));
  let tag;
  if (refName === 'D') {
    const hasAll = clusterKeys.every((k) => have.has(k));
    const nm = st.tiles.filter((t) => t.kind === 'T0m').length;
    tag = `cluster A,B,C,E present: ${hasAll}; T0m neighbours: ${nm}`;
  } else {
    tag = Object.keys(roles).filter((r) => have.has(roles[r])).join('+') || 'none';
  }
  if (trunc) tag += ' (budget hit)';
  tally.set(tag, (tally.get(tag) || 0) + 1);
}
console.log(`dead ${dead}, alive ${alive}, undecided ${undecided}   ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log('surviving coronas by witnessed role:');
for (const [k, v] of [...tally.entries()].sort()) console.log(`  ${k}: ${v}`);
