// Exact checks of the construction and of the 5-piece decomposition of Tile(1,1).
import { K, kk, S3, ONE } from './field.js';
import { pkey, num, area2, cross, psub } from './geom.js';
import { construct, canonical, describe, LEN } from './tiles.js';

let failures = 0;
const check = (label, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? '  ' + extra : ''}`);
  if (!ok) failures++;
};

const T = construct(); // throws if any construction step (P, R, S) fails its exact check
const { V, P, R, S, pieces, kinds, tile11Fine } = T;

// Coordinates, in closed form
check('P = (√3, 3-√3)', P.x.eq(S3) && P.y.eq(K.int(3).sub(S3)), `${num(P).map((v) => v.toFixed(4))}`);
check('R = ((3+√3)/2, (3-√3)/2)', R.x.eq(kk(3, 0, 1, 0, 2)) && R.y.eq(kk(3, 0, -1, 0, 2)), `${num(R).map((v) => v.toFixed(4))}`);
check('S = (3, 3-√3)', S.x.eq(K.int(3)) && S.y.eq(P.y), `${num(S).map((v) => v.toFixed(4))}`);

// Areas (exact)
const area = (poly) => area2(poly).divInt(2);
const areaTile = area(V);
check('area Tile(1,1) = 3 + 3√3', areaTile.eq(kk(3, 0, 3, 0)), String(areaTile));
const aT0 = area(pieces.D);
const aT1 = area(pieces.A);
check('area T0 = 4√3 - 6', aT0.eq(kk(-6, 0, 4, 0)), String(aT0));
check('area T1 = (9 - √3)/4', aT1.eq(kk(9, 0, -1, 0, 4)), String(aT1));
const sumAreas = Object.values(pieces).map(area).reduce((s, a) => s.add(a));
check('five piece areas sum to Tile(1,1)', sumAreas.eq(areaTile));

// Congruence classes
const cn = Object.fromEntries(Object.entries(pieces).map(([k, p]) => [k, canonical(describe(p))]));
check('A ≅ C (same chirality)', cn.A === cn.C);
check('B ≅ E (same chirality)', cn.B === cn.E);
check('A and B are mirror images, not direct copies', cn.A !== cn.B);
check('T1bar (mirror of A) ≅ B directly', canonical(kinds.T1b.corners) === cn.B);
check('D is not congruent to the others', new Set([cn.A, cn.B, cn.D]).size === 3);

// Edge-for-edge reassembly: directed edges of the pieces, after cancelling shared (opposite) edges,
// must be exactly the directed boundary edges of Tile(1,1).
const dEdges = new Map();
const bump = (p, q, s) => {
  const fwd = pkey(p) + '>' + pkey(q);
  const rev = pkey(q) + '>' + pkey(p);
  if (dEdges.get(rev) > 0) { dEdges.set(rev, dEdges.get(rev) - 1); return; }
  dEdges.set(fwd, (dEdges.get(fwd) || 0) + 1);
};
for (const poly of Object.values(pieces)) {
  for (let i = 0; i < poly.length; i++) bump(poly[i], poly[(i + 1) % poly.length]);
}
const remaining = [...dEdges.entries()].filter(([, c]) => c > 0).map(([k]) => k).sort();
const expected = tile11Fine.map((p, i) => pkey(p) + '>' + pkey(tile11Fine[(i + 1) % tile11Fine.length])).sort();
check('unmatched piece edges = boundary of Tile(1,1)', JSON.stringify(remaining) === JSON.stringify(expected), `${remaining.length} boundary edges`);
check('no edge is used more than once in the same direction', [...dEdges.values()].every((c) => c <= 1));

// Describe the protiles
for (const kd of Object.values(kinds)) {
  console.log(`${kd.name}: ` + kd.corners.map((c) => `${c.angle * 15}° -${c.edge}-`).join(' '));
}
console.log('lengths:', Object.entries(LEN).map(([n, v]) => `${n}=${v}≈${v.val().toFixed(4)}`).join('  '));

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
