import { writeFileSync } from 'fs';
import { tileAB, drawSVG, HEAD, dirVec, ANG } from './tab_lib.js';
const a = 1.94, b = 0.8;
const { V } = tileAB(a, b);
const u = dirVec(HEAD[11]);
const P = [V[11][0] + 0.2 * u[0], V[11][1] + 0.2 * u[1]];
const w = dirVec((HEAD[1] + ANG[1] / 15 / 2) % 24);
const Q = [V[1][0] + 0.2 * w[0], V[1][1] + 0.2 * w[1]];
// reflect V12 in the line through V1 and Q
const refl = (p, o, d) => { const x = p[0]-o[0], y = p[1]-o[1]; const t = x*d[0] + y*d[1];
  return [o[0] + 2*t*d[0] - x, o[1] + 2*t*d[1] - y]; };
const R = refl(V[12], V[1], w);
const dist = (p, q) => Math.hypot(p[0]-q[0], p[1]-q[1]);
console.log('R', R.map(x => x.toFixed(4)));
console.log('|1-12| =', dist(V[1], V[12]).toFixed(4), ' |1-R| =', dist(V[1], R).toFixed(4));
console.log('|Q-12| =', dist(Q, V[12]).toFixed(4), ' |Q-R| =', dist(Q, R).toFixed(4));
const inside = (q) => { let c = false; for (let i = 0; i < 14; i++) { const A = V[i], B = V[(i+1)%14]; if ((A[1] > q[1]) !== (B[1] > q[1]) && q[0] < (B[0]-A[0])*(q[1]-A[1])/(B[1]-A[1]) + A[0]) c = !c; } return c; };
console.log('R inside tile:', inside(R));
// is R on any edge / vertex?
const onEdge = V.map((A, i) => { const B = V[(i+1)%14]; const cr = (B[0]-A[0])*(R[1]-A[1]) - (B[1]-A[1])*(R[0]-A[0]); const t = ((R[0]-A[0])*(B[0]-A[0]) + (R[1]-A[1])*(B[1]-A[1])) / dist(A,B)**2; return Math.abs(cr) < 1e-9 && t > -1e-9 && t < 1 + 1e-9 ? i : -1; }).filter(i => i >= 0);
console.log('R on boundary edges:', onEdge.length ? onEdge.join(',') : 'none');
writeFileSync('tile_ab_R.svg', drawSVG({ V, a, b,
  points: [{ name: 'P', xy: P }, { name: 'Q', xy: Q, color: '#7048e8' }, { name: 'R', xy: R, color: '#2b8a3e', dx: 8, dy: -8 }],
  lines: [{ from: V[1], to: [V[1][0] + 4.5 * w[0], V[1][1] + 4.5 * w[1]], color: '#868e96', dash: '4,3' }, { from: V[12], to: R, color: '#2b8a3e', dash: '2,3' }],
  caption: 'R = reflection of 12 in line 1-Q' }));
