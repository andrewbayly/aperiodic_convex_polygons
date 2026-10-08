// Exact planar geometry on the 15° lattice of directions.
import { K, kk, ZERO, ONE } from './field.js';

export const pt = (x, y) => ({ x, y });
export const padd = (p, q) => pt(p.x.add(q.x), p.y.add(q.y));
export const psub = (p, q) => pt(p.x.sub(q.x), p.y.sub(q.y));
export const pneg = (p) => pt(p.x.neg(), p.y.neg());
export const pscale = (p, s) => pt(p.x.mul(s), p.y.mul(s));
export const cross = (p, q) => p.x.mul(q.y).sub(p.y.mul(q.x));
export const dot = (p, q) => p.x.mul(q.x).add(p.y.mul(q.y));
export const len2 = (p) => dot(p, p);
export const peq = (p, q) => p.x.eq(q.x) && p.y.eq(q.y);
export const pkey = (p) => p.x.key() + '|' + p.y.key();
export const num = (p) => [p.x.val(), p.y.val()];

// U[k] = (cos 15k°, sin 15k°), k = 0..23, computed exactly by repeated rotation.
const C15 = kk(0, 1, 0, 1, 4); // (√6 + √2)/4
const S15 = kk(0, -1, 0, 1, 4); // (√6 - √2)/4
const rot15 = (p) => pt(p.x.mul(C15).sub(p.y.mul(S15)), p.x.mul(S15).add(p.y.mul(C15)));
export const U = (() => {
  const u = [pt(ONE, ZERO)];
  for (let k = 1; k < 24; k++) u.push(rot15(u[k - 1]));
  if (!peq(rot15(u[23]), u[0])) throw new Error('direction table does not close');
  return u;
})();

// Index k (0..23) such that v is a positive multiple of U[k], or -1.
export function dirIndex(v) {
  for (let k = 0; k < 24; k++) {
    if (cross(v, U[k]).isZero() && dot(v, U[k]).sign() > 0) return k;
  }
  return -1;
}

// Twice the signed area (positive for counter-clockwise).
export function area2(poly) {
  let s = ZERO;
  for (let i = 0; i < poly.length; i++) s = s.add(cross(poly[i], poly[(i + 1) % poly.length]));
  return s;
}

// Reflect p in the line through lp with direction U[kdir].
export function reflectPoint(p, lp, kdir) {
  const w = psub(p, lp);
  const u = U[kdir];
  const proj = pscale(u, dot(w, u));
  return padd(lp, psub(padd(proj, proj), w));
}

export const mirrorX = (p) => pt(p.x, p.y.neg()); // reflect in the x-axis
