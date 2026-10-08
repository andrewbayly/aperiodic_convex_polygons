import { writeFileSync } from 'fs';
import { tileAB, drawSVG, HEAD, dirVec, ANG } from './tab_lib.js';
const a = 1.94, b = 0.8;
const { V } = tileAB(a, b);
const u = dirVec(HEAD[11]);
const P = [V[11][0] + 0.2 * u[0], V[11][1] + 0.2 * u[1]];
// interior bisector at vertex 1: direction of outgoing edge rotated CCW by half the interior angle
const k = (HEAD[1] + ANG[1] / 15 / 2) % 24;
const w = dirVec(k);
const Q = [V[1][0] + 0.2 * w[0], V[1][1] + 0.2 * w[1]];
console.log('bisector direction at 1:', k * 15, 'deg (edge 1-2 heading', HEAD[1] * 15, '+ half of', ANG[1], ')');
console.log('Q', Q.map(x => x.toFixed(4)), 'dist from 1', Math.hypot(Q[0]-V[1][0], Q[1]-V[1][1]).toFixed(4));
// check Q is inside the tile and the bisector splits the angle: angles to edges 1-0 and 1-2
const ang = (p) => Math.atan2(p[1]-V[1][1], p[0]-V[1][0]) * 180 / Math.PI;
const toNext = ang(V[2]), toPrev = ang(V[0]), toQ = ang(Q);
const norm = x => ((x % 360) + 360) % 360;
console.log('angle from edge 1-2 to bisector (CCW):', norm(toQ - toNext).toFixed(2), '; from bisector to edge 1-0 (CCW):', norm(toPrev - toQ).toFixed(2));
const inside = (q) => { let c = false; for (let i = 0; i < 14; i++) { const A = V[i], B = V[(i+1)%14]; if ((A[1] > q[1]) !== (B[1] > q[1]) && q[0] < (B[0]-A[0])*(q[1]-A[1])/(B[1]-A[1]) + A[0]) c = !c; } return c; };
console.log('Q inside tile:', inside(Q));
writeFileSync('tile_ab_PQ.svg', drawSVG({ V, a, b, points: [{ name: 'P', xy: P }, { name: 'Q', xy: Q, color: '#7048e8', dx: 8, dy: 16 }], lines: [{ from: V[1], to: [V[1][0] + 1.0 * w[0], V[1][1] + 1.0 * w[1]], color: '#868e96', dash: '4,3' }], caption: 'dashed: bisector at vertex 1' }));
