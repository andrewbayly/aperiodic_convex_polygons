// Corona + pruning analysis for the Tile(a,b) pieces with reflections allowed (kinds P, Pb, H, Hb).
// Usage: node ab_analyze.js H|P [nodeBudget] [a] [b] [d]
//   H: reference heptagon.  Expect surviving coronas to contain the four cluster pentagons.
//   P: reference pentagon.  Each survivor should witness exactly one cluster role: (original or
//      mirrored cluster) x (which piece the reference plays), witnessed by the heptagon in position.
import { writeFileSync } from 'fs';
import { build, mirrorPoly } from './ab_kinds.js';
import { makeKind, makeTile, growCorona, growLayer, TAU } from './fengine.js';

const mode = process.argv[2] || 'H';
const budget = Number(process.argv[3] || 30000);
const a = Number(process.argv[4] || 1.94), b = Number(process.argv[5] || 0.8), dd = Number(process.argv[6] || 0.2);
const T = build(a, b, dd);
const { pieces } = T;
const kinds = {
  P: makeKind('P', pieces.A), Pb: makeKind('Pb', mirrorPoly(pieces.A)),
  H: makeKind('H', pieces.H), Hb: makeKind('Hb', mirrorPoly(pieces.H)),
};
const kindOf = { A: 'P', B: 'Pb', C: 'P', D: 'P', H: 'H' };
const tileOf = (name, pts) => makeTile(name, pts, makeKind(name, pts).corners);
const tiles = Object.fromEntries(Object.keys(pieces).map((k) => [k, tileOf(kindOf[k], pieces[k])]));

// rigid motion (rotation + translation, no reflection) taking polygon src onto dst, or null
function congruence(src, dst) {
  const n = src.length;
  if (dst.length !== n) return null;
  for (let s = 0; s < n; s++) {
    const a0 = src[0], a1 = src[1], b0 = dst[s], b1 = dst[(s + 1) % n];
    const la = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]), lb = Math.hypot(b1[0] - b0[0], b1[1] - b0[1]);
    if (Math.abs(la - lb) > 1e-6) continue;
    const th = Math.atan2(b1[1] - b0[1], b1[0] - b0[0]) - Math.atan2(a1[1] - a0[1], a1[0] - a0[0]);
    const c = Math.cos(th), sn = Math.sin(th);
    const g = (p) => { const x = p[0] - a0[0], y = p[1] - a0[1]; return [b0[0] + c * x - sn * y, b0[1] + sn * x + c * y]; };
    if (src.every((p, i) => { const q = g(p), r = dst[(s + i) % n]; return Math.hypot(q[0] - r[0], q[1] - r[1]) < 1e-6; })) return g;
  }
  return null;
}

const refPieceName = mode === 'H' ? 'H' : 'A';
const ref = tiles[refPieceName];
const roles = {}; // role name -> list of witness keys
if (mode === 'H') {
  roles.cluster = ['A', 'B', 'C', 'D'].map((k) => tiles[k].key);
} else {
  for (const [mname, m] of [['orig', (p) => p], ['mirr', mirrorPoly]]) {
    for (const X of ['A', 'B', 'C', 'D']) {
      const g = congruence(m(pieces[X]), ref.pts);
      if (!g) continue;
      const hp = m(pieces.H).map(g);
      roles[`${mname}:${X}`] = [makeTile('H', hp).key];
    }
  }
  console.log('roles for the reference pentagon:', Object.keys(roles).join(', '));
}

const t0 = Date.now();
const { results: seeds, nodes, truncated } = growCorona(ref, kinds, {});
console.log(`reference ${mode === 'H' ? 'heptagon' : 'pentagon'} (a=${a}, b=${b}, d=${dd}): ${seeds.length} first coronas (${nodes} nodes${truncated ? ', TRUNCATED' : ''})`);

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
writeFileSync(`ab_survivors_${mode}.json`, JSON.stringify(survivors.map((st) => st.tiles.map((t) => ({ kind: t.kind, pts: t.pts })))));
