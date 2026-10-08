// Tile(1,1), the construction of P, R, S, the five pieces, and the protiles T0, T1, T1bar.
import { ZERO, ONE, S3, K, kk } from './field.js';
import {
  U, pt, padd, psub, cross, dot, len2, peq, dirIndex, reflectPoint, mirrorX,
} from './geom.js';

export const ANGLES = [90, 240, 90, 240, 90, 120, 180, 120, 270, 120, 90, 120, 270, 120];

// Edge lengths: all edges of Tile(1,1) are 1; the cut lines introduce a, b, c, d.
export const LEN = {
  '1': ONE,
  a: kk(0, 3, 0, -1, 2), // (3√2 - √6)/2 ≈ 0.897
  b: kk(-2, 0, 2, 0), // 2√3 - 2 ≈ 1.464
  c: kk(4, 0, -2, 0), // 4 - 2√3 ≈ 0.536
  d: kk(-3, 0, 2, 0), // 2√3 - 3 ≈ 0.464
};
const LEN2 = Object.entries(LEN).map(([name, v]) => [name, v.mul(v)]);

export function lenName(v) {
  const l2 = len2(v);
  for (const [name, s] of LEN2) if (l2.eq(s)) return name;
  throw new Error('edge length not in {1,a,b,c,d}: ' + l2);
}

export function buildTile11() {
  let h = 0;
  let p = pt(ZERO, ZERO);
  const V = [p];
  for (let i = 0; i < 14; i++) {
    p = padd(p, U[((h % 24) + 24) % 24]);
    V.push(p);
    h += 12 - ANGLES[(i + 1) % 14] / 15; // turning angle in 15° units
  }
  if (!peq(V[14], V[0]) || ((h % 24) + 24) % 24 !== 0) throw new Error('Tile(1,1) does not close');
  return V.slice(0, 14);
}

// Remove vertices with a straight (180°) angle.
export function strip(poly) {
  const n = poly.length;
  return poly.filter((p, i) => {
    const a = poly[(i + n - 1) % n];
    const b = poly[(i + 1) % n];
    return !cross(psub(p, a), psub(b, p)).isZero();
  });
}

// Corner list of a counter-clockwise polygon: interior angle in 15° units, name of the
// edge leaving the corner, and the direction index of that edge.
export function describe(poly) {
  const q = strip(poly);
  const n = q.length;
  return q.map((p, i) => {
    const nx = q[(i + 1) % n];
    const pv = q[(i + n - 1) % n];
    const dN = dirIndex(psub(nx, p));
    const dP = dirIndex(psub(pv, p));
    if (dN < 0 || dP < 0) throw new Error('edge direction not on the 15° lattice');
    return { angle: (dP - dN + 24) % 24, edge: lenName(psub(nx, p)), startDir: dN };
  });
}

export function canonical(desc) {
  const n = desc.length;
  let best = null;
  for (let r = 0; r < n; r++) {
    const s = Array.from({ length: n }, (_, j) => `${desc[(j + r) % n].angle}${desc[(j + r) % n].edge}`).join(' ');
    if (best === null || s < best) best = s;
  }
  return best;
}

export function construct() {
  const V = buildTile11();

  // Interior bisector direction index at vertex i.
  const dirNext = (i) => dirIndex(psub(V[(i + 1) % 14], V[i]));
  const bis = (i) => {
    const u = ANGLES[i] / 15;
    if (u % 2) throw new Error('odd angle, bisector off the 15° lattice');
    return (dirNext(i) + u / 2) % 24;
  };
  const b1 = bis(1);
  const b12 = bis(12);

  // P = intersection of bisectors at vertices 1 and 12. Closed form, verified exactly below.
  const P = pt(S3, K.int(3).sub(S3));
  const onRay = (X, O, k) => cross(psub(X, O), U[k]).isZero() && dot(psub(X, O), U[k]).sign() > 0;
  if (!onRay(P, V[1], b1) || !onRay(P, V[12], b12)) throw new Error('P is not on both bisectors');

  // P-8 collinear with edge 8-9.
  if (!cross(psub(V[9], V[8]), psub(P, V[8])).isZero()) throw new Error('P, 8, 9 not collinear');

  // R = reflection of vertex 12 in line P-1 (which has direction b1).
  const R = reflectPoint(V[12], V[1], b1);

  // S = reflection of P in line R-3. R-3 must be a unit edge.
  const k3 = dirIndex(psub(V[3], R));
  if (k3 < 0 || !len2(psub(V[3], R)).eq(ONE)) throw new Error('R-3 is not a unit vector on the lattice');
  const S = reflectPoint(P, R, k3);
  // S lies on edge 6-7 strictly between the endpoints.
  const e = psub(V[7], V[6]);
  const w = psub(S, V[6]);
  const t = dot(w, e).val() / dot(e, e).val();
  if (!cross(e, w).isZero() || !(t > 0 && t < 1)) throw new Error('S is not strictly inside edge 6-7');

  const pieces = {
    A: [V[0], V[1], P, V[12], V[13]],
    B: [V[1], V[2], V[3], R, P],
    C: [V[3], V[4], V[5], V[6], S, R],
    D: [R, S, V[7], V[8], P],
    E: [P, V[8], V[9], V[10], V[11], V[12]],
  };
  // Tile(1,1) with S inserted on edge 6-7 so boundary edges can be compared with the pieces.
  const tile11Fine = [...V.slice(0, 7), S, ...V.slice(7)];

  const mk = (name, poly) => ({ name, poly: strip(poly), corners: describe(poly) });
  const T1 = mk('T1', pieces.A);
  const T0 = mk('T0', pieces.D);
  const T1b = mk('T1b', pieces.A.map(mirrorX).reverse());
  return { V, P, R, S, b1, b12, pieces, tile11Fine, kinds: { T0, T1, T1b } };
}
