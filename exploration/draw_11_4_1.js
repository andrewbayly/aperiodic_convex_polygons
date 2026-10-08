import { writeFileSync } from 'fs';
import { build } from './ab_kinds.js';
const { V, N, pieces } = build(...(process.env.AB||"11,4,1").split(",").map(Number));
const names = [...Array(14).keys()].map(String).concat(['P', 'Q', 'R', 'S']);
const idx = { A: [0,1,15,12,13], B: [1,2,3,16,15], C: [3,4,5,17,16], D: [8,9,10,11,14], H: [6,7,8,14,12,15,16,17] };
const col = { A: '#9ec5e8', B: '#ffc9a0', C: '#9ec5e8', D: '#9ec5e8', H: '#b8e0a8' };
const lab = { A: 'T1', B: 'T1̄', C: 'T1', D: 'T1', H: 'T0' };
const s = Number(process.env.S||22), pad = 45;
const xs = N.map(p => p[0]), ys = N.map(p => p[1]);
const minx = Math.min(...xs), maxy = Math.max(...ys);
const X = p => (p[0] - minx) * s + pad, Y = p => (maxy - p[1]) * s + pad;
let body = '';
for (const [k, f] of Object.entries(idx)) {
  const pts = f.map(i => N[i]);
  body += `<polygon points="${pts.map(p => `${X(p).toFixed(1)},${Y(p).toFixed(1)}`).join(' ')}" fill="${col[k]}" stroke="#1b3a57" stroke-width="2" stroke-linejoin="round"/>`;
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  body += `<text x="${X([cx, 0]).toFixed(1)}" y="${(Y([0, cy]) + 6).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="${k === 'H' ? 26 : 16}" font-weight="bold" fill="#1b3a57">${lab[k]}</text>`;
}
// vertex labels (outward offset from centroid)
const gx = V.reduce((a, p) => a + p[0], 0) / V.length, gy = V.reduce((a, p) => a + p[1], 0) / V.length;
N.forEach((p, i) => {
  const dx = p[0] - gx, dy = p[1] - gy, L = Math.hypot(dx, dy) || 1;
  const inner = i >= 14;
  const off = inner ? 0 : 13;
  const tx = X(p) + (dx / L) * off + (inner ? 7 : 0), ty = Y(p) - (dy / L) * off + (inner ? -6 : 4);
  body += `<circle cx="${X(p).toFixed(1)}" cy="${Y(p).toFixed(1)}" r="${inner ? 3.5 : 2.5}" fill="${inner ? '#c0392b' : '#1b3a57'}"/>`;
  body += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="${inner ? '#c0392b' : '#333'}">${names[i]}</text>`;
});
const W = (Math.max(...xs) - minx) * s + 2 * pad, H = (maxy - Math.min(...ys)) * s + 2 * pad;
writeFileSync(`tile_${process.env.TAG||'11_4_1'}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H.toFixed(0)}" viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}"><rect width="100%" height="100%" fill="white"/>${body}</svg>`);
console.log(W, H);
