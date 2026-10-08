// Float classification of one parameter point. Usage: node scan_point.js a b d  -> prints one JSON line
import { build, mirrorPoly } from './ab_kinds.js';
import { makeKind, makeTile, growCorona, growLayer } from './fengine.js';
const [a, b, d] = process.argv.slice(2, 5).map(Number);
const out = { a, b, d };
const done = (s, extra = {}) => { console.log(JSON.stringify({ ...out, status: s, ...extra })); process.exit(0); };
const area = (f) => Math.abs(f.reduce((s, p, i) => { const q = f[(i + 1) % f.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
const convex = (f) => f.every((p, i) => { const A = f[(i + f.length - 1) % f.length], B = f[(i + 1) % f.length]; return (p[0] - A[0]) * (B[1] - p[1]) - (p[1] - A[1]) * (B[0] - p[0]) > 1e-6; });
let T;
try { T = build(a, b, d); } catch (e) { done('buildfail'); }
const { pieces, V } = T;
const tot = Object.values(pieces).reduce((s, f) => s + area(f), 0), tile = area(V);
if (Math.abs(tot - tile) > 1e-6 * tile) done('areamismatch', { tot, tile });
if (!Object.values(pieces).every((f) => f.length >= 3 && area(f) > 1e-4 && convex(f))) done('nonconvex');
// congruence of A,B(mirror),C,D
const sig = (f) => { const n = f.length; const L = f.map((p, i) => Math.hypot(f[(i + 1) % n][0] - p[0], f[(i + 1) % n][1] - p[1])); return L; };
const kinds = { P: makeKind('P', pieces.A), Pb: makeKind('Pb', mirrorPoly(pieces.A)), H: makeKind('H', pieces.H), Hb: makeKind('Hb', mirrorPoly(pieces.H)) };
const budget = 20000, cap = 400000;
const kindOf = { A: 'P', B: 'Pb', C: 'P', D: 'P', H: 'H' };
const tiles = Object.fromEntries(Object.keys(pieces).map((k) => [k, makeTile(kindOf[k], pieces[k], makeKind(kindOf[k], pieces[k]).corners)]));
const t0 = Date.now();
function analyse(ref, kk, roleKeys) {
  const { results: seeds, truncated } = growCorona(ref, kk, { maxNodes: cap });
  if (truncated) return { trunc: true };
  let alive = 0, undecided = 0, bad = 0;
  for (const st of seeds) {
    let dead = false, tr = false;
    for (let i = 0; i < st.tiles.length && !dead; i++) { const r = growLayer(st, [st.tiles[i]], kk, { maxNodes: budget }); if (r.truncated) tr = true; else if (!r.results.length) dead = true; }
    if (dead) continue;
    if (tr) undecided++; else alive++;
    const have = new Set(st.tiles.map((t) => t.key));
    if (!roleKeys(have)) bad++;
  }
  return { seeds: seeds.length, alive, undecided, bad };
}
// monotile checks
const mono = [growCorona(tiles.A, { P: kinds.P, Pb: kinds.Pb }, { maxNodes: cap }), growCorona(tiles.H, { H: kinds.H, Hb: kinds.Hb }, { maxNodes: cap })];
out.monoP = mono[0].truncated ? -1 : mono[0].results.length; out.monoH = mono[1].truncated ? -1 : mono[1].results.length;
const hres = analyse(tiles.H, kinds, (have) => ['A', 'B', 'C', 'D'].every((k) => have.has(tiles[k].key)));
// P: survivors must contain H in cluster position for some role; approximate: require the true-cluster H present only for the reference being A (orig:A). Report only counts.
function congruence(src, dst) {
  const n = src.length; if (dst.length !== n) return null;
  for (let s = 0; s < n; s++) {
    const a0 = src[0], a1 = src[1], b0 = dst[s], b1 = dst[(s + 1) % n];
    if (Math.abs(Math.hypot(a1[0]-a0[0], a1[1]-a0[1]) - Math.hypot(b1[0]-b0[0], b1[1]-b0[1])) > 1e-6) continue;
    const th = Math.atan2(b1[1]-b0[1], b1[0]-b0[0]) - Math.atan2(a1[1]-a0[1], a1[0]-a0[0]);
    const c = Math.cos(th), sn = Math.sin(th);
    const g = (p) => { const x = p[0]-a0[0], y = p[1]-a0[1]; return [b0[0]+c*x-sn*y, b0[1]+sn*x+c*y]; };
    if (src.every((p, i) => { const q = g(p), r = dst[(s+i)%n]; return Math.hypot(q[0]-r[0], q[1]-r[1]) < 1e-6; })) return g;
  }
  return null;
}
const roleKeys = {};
for (const [mn, m] of [['orig', (p) => p], ['mirr', mirrorPoly]]) for (const X of ['A','B','C','D']) {
  const g = congruence(m(pieces[X]), tiles.A.pts); if (!g) continue;
  roleKeys[`${mn}:${X}`] = makeTile('H', m(pieces.H).map(g)).key;
}
const tally = {};
const pres = analyse(tiles.A, kinds, (have) => { const hit = Object.keys(roleKeys).filter((r) => have.has(roleKeys[r])); tally[hit.join('+') || 'none'] = (tally[hit.join('+') || 'none'] || 0) + 1; return hit.length === 1; });
pres.roles = tally;
out.H = hres; out.P = pres; out.sec = (Date.now() - t0) / 1000;
const ok = out.monoP === 0 && out.monoH === 0 && !hres.trunc && hres.bad === 0 && hres.undecided === 0 && hres.alive > 0 && !pres.trunc && pres.undecided === 0 && pres.bad === 0;
done(ok ? 'forced' : 'other');
