import { writeFileSync } from 'fs';
import { tileAB, drawSVG, HEAD, dirVec, ANG, SEQ } from './tab_lib.js';
const a = 1.94, b = 0.8;
const { V } = tileAB(a, b);
const dist = (p, q) => Math.hypot(p[0]-q[0], p[1]-q[1]);
const u = dirVec(HEAD[11]);
const P = [V[11][0] + 0.2 * u[0], V[11][1] + 0.2 * u[1]];
const w = dirVec((HEAD[1] + ANG[1] / 15 / 2) % 24);
const Q = [V[1][0] + 0.2 * w[0], V[1][1] + 0.2 * w[1]];
const reflLine = (p, A, B) => { const L = dist(A, B); const d = [(B[0]-A[0])/L, (B[1]-A[1])/L]; const x = p[0]-A[0], y = p[1]-A[1]; const t = x*d[0] + y*d[1]; return [A[0] + 2*t*d[0] - x, A[1] + 2*t*d[1] - y]; };
const R = reflLine(V[12], V[1], Q);
const S = reflLine(Q, V[3], R);
// nodes: 0-13 vertices, 14=P, 15=Q, 16=R, 17=S
const N = [...V, P, Q, R, S];
const names = [...Array(14).keys()].map(String).concat(['P', 'Q', 'R', 'S']);
const segs = [];
// boundary with P between 11,12 and S between 5,6
const ring = [0,1,2,3,4,5,17,6,7,8,9,10,11,14,12,13];
for (let i = 0; i < ring.length; i++) segs.push([ring[i], ring[(i+1)%ring.length]]);
const inter = [[8,14],[12,15],[1,15],[15,16],[16,3],[16,17]];
segs.push(...inter);
// crossings / T-junction checks
const o = (p, q, r) => (q[0]-p[0])*(r[1]-p[1]) - (q[1]-p[1])*(r[0]-p[0]);
let bad = 0;
for (let i = 0; i < segs.length; i++) for (let j = i+1; j < segs.length; j++) {
  const [A,B] = segs[i], [C,D] = segs[j];
  if (new Set([A,B,C,D]).size < 4) continue;
  if (o(N[A],N[B],N[C])*o(N[A],N[B],N[D]) < -1e-12 && o(N[C],N[D],N[A])*o(N[C],N[D],N[B]) < -1e-12) { bad++; console.log('crossing', segs[i].map(k=>names[k]), segs[j].map(k=>names[k])); }
}
for (const [A,B] of segs) for (let v = 0; v < N.length; v++) { if (v===A||v===B) continue; const L = dist(N[A],N[B]);
  const t = ((N[v][0]-N[A][0])*(N[B][0]-N[A][0]) + (N[v][1]-N[A][1])*(N[B][1]-N[A][1])) / L**2;
  if (Math.abs(o(N[A],N[B],N[v])) < 1e-9 && t > 1e-9 && t < 1-1e-9) { bad++; console.log('node', names[v], 'inside segment', names[A], names[B]); } }
console.log('problems:', bad);
// faces
const adj = N.map(() => []);
for (const [A,B] of segs) { adj[A].push(B); adj[B].push(A); }
const ang = (A,B) => Math.atan2(N[B][1]-N[A][1], N[B][0]-N[A][0]);
adj.forEach((l, v) => l.sort((x,y) => ang(v,x) - ang(v,y)));
const seen = new Set(); const faces = [];
for (let A = 0; A < N.length; A++) for (const B of adj[A]) { if (seen.has(A+'>'+B)) continue;
  const f = []; let x = A, y = B;
  while (!seen.has(x+'>'+y)) { seen.add(x+'>'+y); f.push(x); const l = adj[y]; const i = l.indexOf(x); const nx = l[(i - 1 + l.length) % l.length]; x = y; y = nx; }
  faces.push(f); }
const area = f => f.reduce((s, v, i) => { const p = N[v], q = N[f[(i+1)%f.length]]; return s + p[0]*q[1] - q[0]*p[1]; }, 0) / 2;
const bounded = faces.filter(f => area(f) > 1e-9);
console.log('bounded faces:', bounded.length, ' total area', bounded.reduce((s,f)=>s+area(f),0).toFixed(4), ' tile area', area([...Array(14).keys()]).toFixed(4));
const interior = (f, i) => { const p = N[f[i]], pv = N[f[(i+f.length-1)%f.length]], nx = N[f[(i+1)%f.length]];
  const d1 = Math.atan2(pv[1]-p[1], pv[0]-p[0]), d2 = Math.atan2(nx[1]-p[1], nx[0]-p[0]); return ((((d1-d2)*180/Math.PI)%360)+360)%360; };
const cols = ['#9ec5e8','#ffc9a0','#b8e0a8','#e5b8e8','#ffe08a','#c9c9c9','#f4a6a6'];
let polys = '';
bounded.forEach((f, k) => {
  const corners = f.map((v, i) => ({ v, ang: interior(f, i) })).filter(c => Math.abs(c.ang - 180) > 1e-6);
  console.log(`face ${k}: ${f.map(v=>names[v]).join('-')}  sides ${corners.length}  area ${area(f).toFixed(4)}  angles ${corners.map(c=>c.ang.toFixed(0)).join(',')}`);
  polys += { f, k };
});
writeFileSync('ab5_faces.json', JSON.stringify(bounded.map(f => f.map(v => N[v]))));
const s = 55, pad = 40;
const xs = V.map(p=>p[0]), ys = V.map(p=>p[1]);
const minx = Math.min(...xs), maxy = Math.max(...ys);
const X = p => (p[0]-minx)*s+pad, Y = p => (maxy-p[1])*s+pad;
let body = '';
bounded.forEach((f, k) => { body += `<polygon points="${f.map(v=>`${X(N[v]).toFixed(1)},${Y(N[v]).toFixed(1)}`).join(' ')}" fill="${cols[k%cols.length]}" fill-opacity="0.55" stroke="none"/>`; });
const W = (Math.max(...xs)-minx)*s+2*pad, H = (maxy-Math.min(...ys))*s+2*pad;
writeFileSync('tile_ab_lines.svg', drawSVG({ V, a, b,
  points: [{ name: 'P', xy: P }, { name: 'Q', xy: Q, color: '#7048e8' }, { name: 'R', xy: R, color: '#2b8a3e', dx: 8, dy: -8 }, { name: 'S', xy: S, color: '#d9480f', dx: 8, dy: 4 }],
  lines: inter.map(([A,B]) => ({ from: N[A], to: N[B], color: '#222' })), caption: 'lines: 8-P, 12-Q, 1-Q, Q-R, R-3, R-S' }));
