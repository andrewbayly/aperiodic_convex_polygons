// Exact construction of Tile(a,b) (a=97/50, b=4/5, d=1/5) and its five pieces, as complex points over E = Q(√3, l).
import { E, ONE, ZERO, ELL, ELL2, cadd, csub, cmul, cscale } from './field4.js';

const R = (p, q = 1) => E.rat(p, q);
const half = R(1, 2), s3 = E.s3(1, 1), s3h = E.s3(1, 2);
const Z = ZERO, O1 = ONE;
// direction vectors at k*30 degrees
const c30 = [O1, s3h, half, Z, half.neg(), s3h.neg(), O1.neg(), s3h.neg(), half.neg(), Z, half, s3h];
const s30 = [Z, half, s3h, O1, s3h, half, Z, half.neg(), s3h.neg(), O1.neg(), s3h.neg(), half.neg()];
const dir = (deg) => { const k = (((deg / 30) % 12) + 12) % 12; return [c30[k], s30[k]]; };

export const ANG = [90, 240, 90, 240, 90, 120, 180, 120, 270, 120, 90, 120, 270, 120];
const SEQ = 'a a b b a a a a b b a a b b'.split(' ');

const vsub = (p, q) => csub(p, q), vadd = (p, q) => cadd(p, q);
const dot = (p, q) => p[0].mul(q[0]).add(p[1].mul(q[1]));
const reflect = (p, A, B) => { const v = vsub(B, A), w = vsub(p, A); const t = dot(w, v).div(dot(v, v)); const proj = cscale(v, t); return vadd(A, vsub(vadd(proj, proj), w)); };

export function buildExact() {
  const par = (process.env.AB || '97/50,4/5,1/5').split(',').map((t) => t.split('/').map(Number));
  const [a, b, dd] = par.map(([p, q = 1]) => R(p, q));
  const heads = []; { let h = 0; for (let i = 0; i < 14; i++) { heads.push(((h % 360) + 360) % 360); h += 180 - ANG[(i + 1) % 14]; } }
  const V = [[Z, Z]];
  for (let i = 0; i < 14; i++) { const [cx, sx] = dir(heads[i]); const L = SEQ[i] === 'a' ? a : b; V.push(vadd(V[i], [cx.mul(L), sx.mul(L)])); }
  if (!(V[14][0].isZero() && V[14][1].isZero())) throw new Error('Tile(a,b) does not close');
  V.pop();
  const d11 = dir(heads[11]);
  const P = vadd(V[11], cscale(d11, dd));
  const bis = dir((heads[1] + ANG[1] / 2) % 360);
  const Q = vadd(V[1], cscale(bis, dd));
  const Rr = reflect(V[12], V[1], Q);
  const S = reflect(Q, V[3], Rr);
  const N = [...V, P, Q, Rr, S];
  const idx = { A: [0, 1, 15, 12, 13], B: [1, 2, 3, 16, 15], C: [3, 4, 5, 17, 16], D: [8, 9, 10, 11, 14], H: [6, 7, 8, 14, 12, 15, 16, 17] };
  const cross = (p, q) => p[0].mul(q[1]).sub(p[1].mul(q[0]));
  const strip = (f) => f.filter((p, i) => {
    const pa = f[(i + f.length - 1) % f.length], pb = f[(i + 1) % f.length];
    return !cross(vsub(p, pa), vsub(pb, p)).isZero(); // exactly collinear vertices removed
  });
  const pieces = Object.fromEntries(Object.entries(idx).map(([k, f]) => [k, strip(f.map((i) => N[i]))]));
  return { N, pieces, ELL2, ELL };
}
export const mirrorPoly = (f) => f.map(([x, y]) => [x.neg(), y]).reverse();
