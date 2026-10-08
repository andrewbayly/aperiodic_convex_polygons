import { writeFileSync } from 'fs';
import { tileAB, drawSVG, HEAD, dirVec, ANG } from './tab_lib.js';
const a = 1.94, b = 0.8;
const { V } = tileAB(a, b);
const u = dirVec(HEAD[11]);
const P = [V[11][0] + 0.2 * u[0], V[11][1] + 0.2 * u[1]];
const w = dirVec((HEAD[1] + ANG[1] / 15 / 2) % 24);
const Q = [V[1][0] + 0.2 * w[0], V[1][1] + 0.2 * w[1]];
const dist = (p, q) => Math.hypot(p[0]-q[0], p[1]-q[1]);
const reflLine = (p, A, B) => { const L = dist(A, B); const d = [(B[0]-A[0])/L, (B[1]-A[1])/L];
  const x = p[0]-A[0], y = p[1]-A[1]; const t = x*d[0] + y*d[1]; return [A[0] + 2*t*d[0] - x, A[1] + 2*t*d[1] - y]; };
const R = reflLine(V[12], V[1], Q);
const S = reflLine(Q, V[3], R);
console.log('line 3-R: |3-R| =', dist(V[3], R).toFixed(4), ' direction (deg) =', (Math.atan2(R[1]-V[3][1], R[0]-V[3][0]) * 180 / Math.PI).toFixed(3));
console.log('S', S.map(x => x.toFixed(4)));
console.log('|3-Q| =', dist(V[3], Q).toFixed(4), ' |3-S| =', dist(V[3], S).toFixed(4), ' |R-Q| =', dist(R, Q).toFixed(4), ' |R-S| =', dist(R, S).toFixed(4));
const inside = (q) => { let c = false; for (let i = 0; i < 14; i++) { const A = V[i], B = V[(i+1)%14]; if ((A[1] > q[1]) !== (B[1] > q[1]) && q[0] < (B[0]-A[0])*(q[1]-A[1])/(B[1]-A[1]) + A[0]) c = !c; } return c; };
console.log('S inside tile:', inside(S));
const onEdge = V.map((A, i) => { const B = V[(i+1)%14]; const cr = (B[0]-A[0])*(S[1]-A[1]) - (B[1]-A[1])*(S[0]-A[0]); const t = ((S[0]-A[0])*(B[0]-A[0]) + (S[1]-A[1])*(B[1]-A[1])) / dist(A,B)**2; return Math.abs(cr) < 1e-9 && t > -1e-9 && t < 1 + 1e-9 ? i : -1; }).filter(i => i >= 0);
console.log('S on boundary edges:', onEdge.length ? onEdge.join(',') : 'none');
const ext = (A, B, f) => [A[0] + f*(B[0]-A[0]), A[1] + f*(B[1]-A[1])];
writeFileSync('tile_ab_S.svg', drawSVG({ V, a, b,
  points: [{ name: 'P', xy: P }, { name: 'Q', xy: Q, color: '#7048e8' }, { name: 'R', xy: R, color: '#2b8a3e', dx: 8, dy: -8 }, { name: 'S', xy: S, color: '#d9480f', dx: -16, dy: -8 }],
  lines: [{ from: V[1], to: ext(V[1], Q, 22), color: '#868e96', dash: '4,3' }, { from: V[3], to: R, color: '#868e96', dash: '4,3' }, { from: Q, to: S, color: '#d9480f', dash: '2,3' }],
  caption: 'S = reflection of Q in line 3-R' }));
{
  const A = V[5], B = V[6];
  const L = dist(A, B);
  console.log('edge 5-6: length', L.toFixed(4), 'V5', A.map(x=>x.toFixed(4)), 'V6', B.map(x=>x.toFixed(4)));
  console.log('S is', dist(A, S).toFixed(4), 'from vertex 5 and', dist(S, B).toFixed(4), 'from vertex 6');
}
