// Completeness spot-check against explicit ground-truth tilings.
// For tilings by two-piece cuts of a lattice tile (optionally with randomly shifted rows -> sliding contacts), compute the TRUE corona of
// each central piece (tiles having a vertex on its boundary) and check it appears among the engine's enumerated coronas.
// Usage: node completeness.js ../py2/cases.json [maxNodes]
import { readFileSync } from 'fs';
import { E, cadd, csub } from './field4.js';
import { makeKind, tileFromPoly, growCorona, wedgeAt, cf } from './engine.js';
const cases = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const MAXN = Number(process.argv[3] || 150000);
const toE = ([n0, n1, d]) => new E([BigInt(n0), BigInt(n1), 0n, 0n], BigInt(d));
const rat = (p, q = 1) => E.rat(p, q), s3 = E.s3(1, 1);
const vec = (x, y) => [x, y];
// lattices: [name, v1, v2, row-shift allowed along v1 (row index along v2)]
const LAT = {
  'regular hexagon': { v1: vec(rat(3, 2), s3.mul(rat(1, 2))), v2: vec(rat(0), s3), shift: false },
  '2x1 rectangle': { v1: vec(rat(2), rat(0)), v2: vec(rat(0), rat(1)), shift: true },
  'parallelogram 2x1 (60 deg)': { v1: vec(rat(2), rat(0)), v2: vec(rat(1, 2), s3.mul(rat(1, 2))), shift: true },
};
const key = (t) => t.key;
let total = 0, found = 0, missing = 0, inconclusive = 0;
for (const c of cases) {
  const m = c.name.match(/^cut of (.*) #(\d+)$/); if (!m) continue;
  const lat = LAT[m[1]]; if (!lat) continue;
  const own = c.kinds.filter((_, i) => i % 2 === 0); // only the two cut pieces themselves (no mirror kinds: keeps the enumeration finite)
  const polys = own.map((k) => k.pts.map(([x, y]) => [toE(x), toE(y)]));
  const kinds = own.map((k, i) => makeKind(k.name, polys[i]));
  const pieceIdx = [0, 1];
  const shifted = (p, d) => p.map((q) => cadd(q, d));
  const tileAt = (pi, d) => tileFromPoly(kinds[pieceIdx[pi]], shifted(polys[pieceIdx[pi]], d));
  const engineSets = [];
  let anyTrunc = false;
  for (let pi = 0; pi < 2; pi++) {
    const r = growCorona(tileAt(pi, vec(rat(0), rat(0))), kinds, { maxNodes: MAXN });
    if (r.truncated) anyTrunc = true;
    engineSets.push(new Set(r.results.map((st) => st.tiles.map(key).sort().join('|'))));
  }
  // ground-truth patches: rows j=-2..2 along v2, columns i=-3..3 along v1, row shifts s_j (rationals) when allowed
  const trials = lat.shift ? 6 : 1;
  for (let tr = 0; tr < trials; tr++) {
    const sh = []; for (let j = -2; j <= 2; j++) sh[j + 2] = lat.shift && tr > 0 ? rat(Math.floor(Math.random() * 12), 6 * 1) : rat(0);
    const org = (i, j) => { // lattice position of cell (i, j)
      const off = cadd(vec(lat.v1[0].mul(rat(i)), lat.v1[1].mul(rat(i))), vec(lat.v2[0].mul(rat(j)), lat.v2[1].mul(rat(j))));
      const s = sh[j + 2]; return cadd(off, vec(lat.v1[0].mul(s).mul(rat(1, 2)), lat.v1[1].mul(s).mul(rat(1, 2))));
    };
    const patch = [];
    for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) for (let pi = 0; pi < 2; pi++) patch.push({ i, j, pi, t: tileAt(pi, org(i, j)) });
    for (let pi = 0; pi < 2; pi++) {
      const core = patch.find((x) => x.i === 0 && x.j === 0 && x.pi === pi);
      // engine-style truth: a tile is placed iff it has a corner at a vertex v that lies on the core's boundary and is a vertex of an already placed
      // tile (a tile that only passes through v is a 'phantom' and is not placed).  Iterate to closure.
      const S = [core], nb = [];
      for (let changed = true; changed;) {
        changed = false;
        for (const x of patch) {
          if (x === core || nb.includes(x)) continue;
          const hit = x.t.pts.some((p) => wedgeAt(core.t, p, cf(p)) !== null && S.some((y) => y.t.pts.some((q) => q[0].eq(p[0]) && q[1].eq(p[1]))));
          if (hit) { nb.push(x); S.push(x); changed = true; }
        }
      }
      // translate everything so the core sits at its canonical position (cell 0 with zero offset)
      const o = org(0, 0), neg = vec(o[0].neg(), o[1].neg());
      const keys = [core, ...nb].map((x) => tileFromPoly(x.t.kind, shifted(x.t.pts, neg)).key).sort().join('|');
      total++;
      if (engineSets[pi].has(keys)) found++; else if (anyTrunc) inconclusive++; else { missing++; console.log('MISSING', c.name, 'piece', pi, 'trial', tr, 'neighbours', nb.length); }
    }
  }
  console.log(`${c.name}: engine sets ${engineSets.map((s) => s.size).join('/')}${anyTrunc ? ' (truncated)' : ''}; running totals found ${found}, missing ${missing}, inconclusive ${inconclusive} of ${total}`);
}
console.log(`TRUE coronas checked: ${total}; found in engine output: ${found}; missing (engine complete): ${missing}; inconclusive (engine truncated, not found): ${inconclusive}`);
