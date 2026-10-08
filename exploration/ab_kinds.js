// Pieces of Tile(a,b) cut by the construction:
//   P on edge 11-12 at distance d from vertex 11; Q on the bisector of vertex 1 at distance d;
//   R = vertex 12 reflected in line 1-Q;  S = Q reflected in line 3-R;
//   segments 8-P, 12-Q, 1-Q, Q-R, R-3, R-S.
// Node indices: 0..13 tile vertices, 14 = P, 15 = Q, 16 = R, 17 = S.
import { tileAB, HEAD, dirVec, ANG } from './tab_lib.js';

const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const reflLine = (p, A, B) => {
  const L = dist(A, B); const d = [(B[0] - A[0]) / L, (B[1] - A[1]) / L];
  const x = p[0] - A[0], y = p[1] - A[1]; const t = x * d[0] + y * d[1];
  return [A[0] + 2 * t * d[0] - x, A[1] + 2 * t * d[1] - y];
};

export function stripCollinear(f, tol = 1e-9) {
  return f.filter((p, i) => {
    const a = f[(i + f.length - 1) % f.length], b = f[(i + 1) % f.length];
    return Math.abs((p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0])) > tol;
  });
}
export const mirrorPoly = (f) => f.map(([x, y]) => [-x, y]).reverse();

export function build(a = 1.94, b = 0.8, d = 0.2) {
  const { V } = tileAB(a, b);
  const u = dirVec(HEAD[11]);
  const P = [V[11][0] + d * u[0], V[11][1] + d * u[1]];
  const w = dirVec((HEAD[1] + ANG[1] / 15 / 2) % 24);
  const Q = [V[1][0] + d * w[0], V[1][1] + d * w[1]];
  const R = reflLine(V[12], V[1], Q);
  const S = reflLine(Q, V[3], R);
  const N = [...V, P, Q, R, S];
  const idx = {
    A: [0, 1, 15, 12, 13],
    B: [1, 2, 3, 16, 15],   // the mirror-image pentagon (P-bar)
    C: [3, 4, 5, 17, 16],
    D: [8, 9, 10, 11, 14],
    H: [6, 7, 8, 14, 12, 15, 16, 17],
  };
  const pieces = Object.fromEntries(Object.entries(idx).map(([k, f]) => [k, stripCollinear(f.map((i) => N[i]))]));
  return { a, b, d, V, N, pieces };
}
