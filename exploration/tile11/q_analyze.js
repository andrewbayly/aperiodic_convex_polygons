// Corona + pruning analysis for Q = {Pn, Hx} (direct copies only).
// Usage: node q_analyze.js H|P [nodeBudget]
//   H: reference hexagon. Expect every surviving corona to contain the cluster pentagons A,B,C,D.
//   P: reference pentagon. Each survivor should witness exactly one cluster role (A,B,C or D),
//      witnessed by the hexagon sitting in that role's cluster position.
import { writeFileSync } from 'fs';
import { strip } from './tiles.js';
import { makeTile, growCorona, growLayer, rotPt } from './engine.js';
import { pkey, padd, psub } from './geom.js';
import { kinds, kindOf, pieces } from './qkinds.js';

const tile = (k) => makeTile(kindOf[k], strip(pieces[k]));
const tiles = Object.fromEntries(Object.keys(pieces).map((k) => [k, tile(k)]));

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

const mode = process.argv[2] || 'H';
const budget = Number(process.argv[3] || 30000);
const ref = mode === 'H' ? tiles.H : tiles.A;

// witness tiles per role
const roles = {};
if (mode === 'H') {
  roles.cluster = ['A', 'B', 'C', 'D'].map((k) => tiles[k].key);
} else {
  for (const r of ['A', 'B', 'C', 'D']) {
    const g = congruence(tiles[r], ref);
    roles[r] = [makeTile('Hx', strip(pieces.H).map(g)).key];
  }
}

const t0 = Date.now();
const { results: seeds, nodes, truncated } = growCorona(ref, kinds, {});
console.log(`reference ${mode === 'H' ? 'hexagon' : 'pentagon'}: ${seeds.length} first coronas (${nodes} nodes${truncated ? ', TRUNCATED' : ''})`);

let dead = 0, alive = 0, undecided = 0, n = 0;
const tally = new Map();
const survivors = [];
for (const st of seeds) {
  let isDead = false, trunc = false;
  for (let i = 0; i < st.tiles.length && !isDead; i++) {
    const r = growLayer(st, [st.tiles[i]], kinds, { maxNodes: budget });
    if (r.truncated) trunc = true;
    else if (!r.results.length) isDead = true;
  }
  if (++n % 500 === 0) console.log(`  ... ${n}/${seeds.length} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  if (isDead) { dead++; continue; }
  if (trunc) undecided++; else alive++;
  const have = new Set(st.tiles.map((t) => t.key));
  const hit = Object.keys(roles).filter((r) => roles[r].every((k) => have.has(k)));
  const tag = (hit.join('+') || 'none') + (trunc ? ' (budget hit)' : '');
  tally.set(tag, (tally.get(tag) || 0) + 1);
  survivors.push(st);
}
console.log(`dead ${dead}, alive ${alive}, undecided ${undecided}   ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log('surviving coronas by witnessed role:');
for (const [k, v] of [...tally.entries()].sort()) console.log(`  ${k}: ${v}`);

writeFileSync(`q_survivors_${mode}.json`, JSON.stringify(survivors.map((st) => st.tiles.map((t) => ({
  kind: t.kind, pts: t.pts.map((p) => [p.x.val(), p.y.val()]),
})))));
