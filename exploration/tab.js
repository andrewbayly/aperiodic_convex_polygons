import { writeFileSync } from 'fs';
import { K, ZERO } from './field.js';
import { U, pt, padd, pscale, num, cross, psub } from './geom.js';
const ANG = [90,240,90,240,90,120,180,120,270,120,90,120,270,120];
const SEQ = 'a a b b a a a a b b a a b b'.split(' ');
// edge i goes from vertex i to i+1 with heading h_i (in 15° units)
const heading = []; let h = 0;
for (let i = 0; i < 14; i++) { heading.push(((h % 24) + 24) % 24); h += 12 - ANG[(i + 1) % 14] / 15; }
console.log('final turn closes direction:', ((h % 24) + 24) % 24 === 0);
// symbolic: sum of a-edge unit vectors and of b-edge unit vectors
let sa = pt(ZERO, ZERO), sb = pt(ZERO, ZERO);
SEQ.forEach((s, i) => { if (s === 'a') sa = padd(sa, U[heading[i]]); else sb = padd(sb, U[heading[i]]); });
console.log('sum of a-edge directions =', sa.x.toString(), '|', sa.y.toString());
console.log('sum of b-edge directions =', sb.x.toString(), '|', sb.y.toString());
console.log('closes for ALL a,b:', sa.x.isZero() && sa.y.isZero() && sb.x.isZero() && sb.y.isZero());
console.log('headings (deg):', heading.map(k => k * 15).join(' '));
// numeric polygon
const a = 1.94, b = 0.8;
const V = [[0, 0]]; 
SEQ.forEach((s, i) => { const L = s === 'a' ? a : b; const u = num(U[heading[i]]); const p = V[i]; V.push([p[0] + L * u[0], p[1] + L * u[1]]); });
console.log('closure residual at a=1.94,b=0.8:', V[14].map(v => v.toExponential(2)).join(', '));
const P = V.slice(0, 14);
// simplicity
const o = (p, q, r) => (q[0]-p[0])*(r[1]-p[1]) - (q[1]-p[1])*(r[0]-p[0]);
let cr = 0;
for (let i = 0; i < 14; i++) for (let j = i + 2; j < 14; j++) { if (i === 0 && j === 13) continue;
  const A = P[i], B = P[(i+1)%14], C = P[j], D = P[(j+1)%14];
  if (o(A,B,C)*o(A,B,D) < 0 && o(C,D,A)*o(C,D,B) < 0) cr++; }
console.log('self-intersections:', cr);
let ar = 0; for (let i = 0; i < 14; i++) { const p = P[i], q = P[(i+1)%14]; ar += p[0]*q[1]-q[0]*p[1]; }
console.log('signed area:', (ar/2).toFixed(4));
// check interior angles numerically
const angs = P.map((p, i) => { const pv = P[(i+13)%14], nx = P[(i+1)%14];
  const d1 = Math.atan2(pv[1]-p[1], pv[0]-p[0]), d2 = Math.atan2(nx[1]-p[1], nx[0]-p[0]);
  return (((d1 - d2) * 180 / Math.PI) % 360 + 360) % 360; });
console.log('interior angles:', angs.map(x => x.toFixed(1)).join(' '));
// draw
const s = 55, pad = 40;
const xs = P.map(p=>p[0]), ys = P.map(p=>p[1]);
const minx = Math.min(...xs), maxy = Math.max(...ys);
const W = (Math.max(...xs)-minx)*s + 2*pad, H = (maxy-Math.min(...ys))*s + 2*pad;
const X = p => (p[0]-minx)*s+pad, Y = p => (maxy-p[1])*s+pad;
const poly = P.map(p => `${X(p).toFixed(1)},${Y(p).toFixed(1)}`).join(' ');
let edges = '';
P.forEach((p, i) => { const q = P[(i+1)%14]; const col = SEQ[i]==='a' ? '#d9480f' : '#1c7ed6';
  edges += `<line x1="${X(p).toFixed(1)}" y1="${Y(p).toFixed(1)}" x2="${X(q).toFixed(1)}" y2="${Y(q).toFixed(1)}" stroke="${col}" stroke-width="3.5" stroke-linecap="round"/>`; });
const lab = P.map((p, i) => `<circle cx="${X(p).toFixed(1)}" cy="${Y(p).toFixed(1)}" r="3" fill="#333"/><text x="${(X(p)+6).toFixed(1)}" y="${(Y(p)-6).toFixed(1)}" font-family="sans-serif" font-size="12" fill="#222">${i}</text>`).join('');
writeFileSync('tile_ab.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${(H+30).toFixed(0)}" viewBox="0 0 ${W.toFixed(0)} ${(H+30).toFixed(0)}"><rect width="100%" height="100%" fill="white"/><polygon points="${poly}" fill="#e9f2fb" stroke="none"/>${edges}${lab}<text x="${pad}" y="${(H+18).toFixed(0)}" font-family="sans-serif" font-size="12" fill="#444"><tspan fill="#d9480f" font-weight="bold">a = 1.94</tspan>   <tspan fill="#1c7ed6" font-weight="bold">b = 0.8</tspan>   (edges 0→1, 1→2, ... in order a a b b a a a a b b a a b b)</text></svg>`);
console.log('wrote tile_ab.svg');
