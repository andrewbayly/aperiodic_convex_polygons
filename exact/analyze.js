// Exact version of ab_analyze.js.  Usage: node analyze.js H|P [budget]
import { buildExact, mirrorPoly } from './ab_exact.js';
import { makeKind, tileFromPoly, growCorona, growLayer, polyKey, lenOf, stats } from './engine.js';
import { cadd, csub, cmul, cconj, ceq, cscale } from './field4.js';
const mode = process.argv[2] || 'H', budget = Number(process.argv[3] || 30000);
const { pieces } = buildExact();
const kinds = { P: makeKind('P', pieces.A), Pb: makeKind('Pb', mirrorPoly(pieces.A)), H: makeKind('H', pieces.H), Hb: makeKind('Hb', mirrorPoly(pieces.H)) };
const kindOf = { A: 'P', B: 'Pb', C: 'P', D: 'P', H: 'H' };
const tiles = Object.fromEntries(Object.keys(pieces).map(k => [k, tileFromPoly(makeKind(kindOf[k], pieces[k]), pieces[k])]));
const unit = (ev) => cscale(ev, lenOf(ev).inv());
function congruence(src, dst) { // exact rigid motion (no reflection) src -> dst
  const n = src.length; if (dst.length !== n) return null;
  for (let s = 0; s < n; s++) {
    const a0 = src[0], a1 = src[1], b0 = dst[s], b1 = dst[(s + 1) % n];
    const ea = csub(a1, a0), eb = csub(b1, b0);
    if (!lenOf(ea).eq(lenOf(eb))) continue;
    const rot = cmul(unit(eb), cconj(unit(ea)));
    const g = (p) => cadd(b0, cmul(rot, csub(p, a0)));
    if (src.every((p, i) => ceq(g(p), dst[(s + i) % n]))) return g;
  }
  return null;
}
const MB = mode.endsWith('b'), base = mode[0];  // 'Hb'/'Pb': whole picture mirrored
const M = MB ? mirrorPoly : (p => p);
const refPoly = M(pieces[base === 'H' ? 'H' : 'A']);
const ref = tileFromPoly(kinds[mode], refPoly);
const roles = {};
if (base === 'H') roles.cluster = ['A', 'B', 'C', 'D'].map(k => tileFromPoly(makeKind('x', M(pieces[k])), M(pieces[k])).key);
else for (const [mn, m] of [['orig', p => p], ['mirr', mirrorPoly]]) for (const X of ['A', 'B', 'C', 'D']) {
  const mm = p => M(m(p)); const g = congruence(mm(pieces[X]), ref.pts); if (!g) continue;
  roles[`${mn}:${X}`] = [polyKey(mm(pieces.H).map(g))];
}
console.log('roles:', Object.keys(roles).join(', '));
const t0 = Date.now();
const { results: seeds, nodes, truncated } = growCorona(ref, kinds, {});
console.log(`reference ${mode}: ${seeds.length} first coronas (${nodes} nodes${truncated ? ', TRUNCATED' : ''})`);
let dead = 0, alive = 0, undecided = 0, n = 0; const tally = new Map();
for (const st of seeds) {
  let isDead = false, trunc = false;
  for (let i = 0; i < st.tiles.length && !isDead; i++) {
    const r = growLayer(st, [st.tiles[i]], kinds, { maxNodes: budget });
    if (r.truncated) trunc = true; else if (!r.results.length) isDead = true;
  }
  if (++n % 50 === 0) console.log(`  ... ${n}/${seeds.length} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  if (isDead) { dead++; continue; }
  trunc ? undecided++ : alive++;
  const have = new Set(st.tiles.map(t => t.key));
  const hit = Object.keys(roles).filter(r => roles[r].every(k => have.has(k)));
  const tag = (hit.join('+') || 'none') + (trunc ? ' (budget hit)' : '');
  tally.set(tag, (tally.get(tag) || 0) + 1);
}
console.log(`dead ${dead}, alive ${alive}, undecided ${undecided}   ${((Date.now() - t0) / 1000).toFixed(0)}s`);
for (const [k, v] of [...tally.entries()].sort()) console.log(`  ${k}: ${v}`);
console.log('overlap tests: float-decided', stats.overlapFloat, 'exact-decided', stats.overlapExact);
