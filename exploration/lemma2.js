// Lemma 2 check: every T1 / T1bar tile lies in a cluster.
// For a reference tile X (A for T1, B for T1bar), enumerate its coronas, prune coronas that contain a
// tile which cannot be fully surrounded, and classify the survivors by which cluster role X plays
// (witnessed by a T0 in the right position).
import { construct, strip } from './tiles.js';
import { makeTile, growCorona, growLayer, rotPt } from './engine.js';
import { pkey, padd, psub } from './geom.js';

const T = construct();
const { kinds, pieces } = T;
const kindOf = { A: 'T1', B: 'T1b', C: 'T1', D: 'T0', E: 'T1b' };
const tiles = Object.fromEntries(Object.entries(kindOf).map(([k, kind]) => [k, makeTile(kind, strip(pieces[k]))]));

// Rigid motion (rotation by 15°·delta, then translation) taking tile `src` onto tile `dst`.
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

const refName = process.argv[2] || 'A'; // A -> T1 (roles A, C), B -> T1b (roles B, E)
const roles = refName === 'A' ? ['A', 'C'] : ['B', 'E'];
const ref = tiles[refName];
const budget = Number(process.argv[3] || 30000);

// Position of the cluster's T0 if `ref` plays role r.
const t0For = {};
for (const r of roles) {
  const g = congruence(tiles[r], ref); // maps role tile onto the reference position
  t0For[r] = makeTile('T0', tiles.D.pts.map(g)).key;
}

const t0 = Date.now();
const { results: seeds } = growCorona(ref, kinds, {});
console.log(`reference tile ${refName} (${ref.kind}): ${seeds.length} first coronas; roles ${roles.join(',')}`);
let alive = 0, dead = 0, undecided = 0;
const tally = new Map();
let n = 0;
for (const st of seeds) {
  let isDead = false, trunc = false;
  for (let i = 0; i < st.tiles.length && !isDead; i++) {
    const r = growLayer(st, [st.tiles[i]], kinds, { maxNodes: budget });
    if (r.truncated) trunc = true;
    else if (!r.results.length) isDead = true;
  }
  if (++n % 100 === 0) console.log(`  ... ${n}/${seeds.length}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  if (isDead) { dead++; continue; }
  if (trunc) undecided++; else alive++;
  const have = new Set(st.tiles.map((t) => t.key));
  const which = roles.filter((r) => have.has(t0For[r])).join('') || 'none';
  tally.set(which + (trunc ? ' (budget hit)' : ''), (tally.get(which + (trunc ? ' (budget hit)' : '')) || 0) + 1);
}
console.log(`dead ${dead}, alive ${alive}, undecided ${undecided}   ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log('surviving coronas by role witnessed by a T0 in cluster position:');
for (const [k, v] of tally) console.log(`  ${k}: ${v}`);
