// Render the protiles T0, T1, T1bar with angle and edge-length labels -> protiles.svg
import { writeFileSync } from 'fs';
import { construct, LEN } from './tiles.js';
import { num } from './geom.js';

const T = construct();
const S = 150; // pixels per unit length
const fills = { T0: '#b8e0a8', T1: '#9ec5e8', T1b: '#ffc9a0' };
const titles = { T0: 'T₀', T1: 'T₁', T1b: 'T₁̄' };

let x0 = 40;
let body = '';
let maxH = 0;
const pad = 50;

for (const kd of Object.values(T.kinds)) {
  const pts = kd.poly.map(num);
  const minx = Math.min(...pts.map((p) => p[0])), maxx = Math.max(...pts.map((p) => p[0]));
  const miny = Math.min(...pts.map((p) => p[1])), maxy = Math.max(...pts.map((p) => p[1]));
  const tx = (p) => [x0 + (p[0] - minx) * S, pad + 30 + (maxy - p[1]) * S];
  const P = pts.map(tx);
  const cx = P.reduce((s, p) => s + p[0], 0) / P.length;
  const cy = P.reduce((s, p) => s + p[1], 0) / P.length;
  body += `<polygon points="${P.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="${fills[kd.name]}" stroke="#1b3a57" stroke-width="2" stroke-linejoin="round"/>`;
  kd.corners.forEach((c, i) => {
    const p = P[i], q = P[(i + 1) % P.length];
    // angle label, pulled toward the centroid
    const vx = cx - p[0], vy = cy - p[1], vl = Math.hypot(vx, vy);
    body += `<text x="${(p[0] + (vx / vl) * 34).toFixed(1)}" y="${(p[1] + (vy / vl) * 34 + 4).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#1b3a57">${c.angle * 15}°</text>`;
    // edge label, pushed outward (polygon is CCW in math coordinates; screen y is flipped)
    const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    const dx = q[0] - p[0], dy = q[1] - p[1], dl = Math.hypot(dx, dy);
    const nx = dy / dl, ny = -dx / dl; // outward normal in screen coords for a CCW (math) polygon
    const val = LEN[c.edge].val().toFixed(3);
    body += `<text x="${(mx - nx * 16).toFixed(1)}" y="${(my - ny * 16 + 4).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="#7a2e0e">${c.edge}<tspan font-weight="normal" fill="#555"> ${val}</tspan></text>`;
  });
  body += `<text x="${cx.toFixed(1)}" y="${(cy + 6).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="bold" fill="#1b3a57">${titles[kd.name]}</text>`;
  maxH = Math.max(maxH, (maxy - miny) * S);
  x0 += (maxx - minx) * S + 90;
}

const legend = 'a = (3√2−√6)/2    b = 2√3−2    c = 4−2√3    d = 2√3−3    (edge lengths; unlabelled "1" = 1)';
const W = x0, H = maxH + pad * 2 + 60;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H.toFixed(0)}" viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}"><rect width="100%" height="100%" fill="white"/>${body}<text x="40" y="${(H - 20).toFixed(0)}" font-family="sans-serif" font-size="13" fill="#444">${legend}</text></svg>`;
writeFileSync('protiles.svg', svg);
console.log('wrote protiles.svg', W.toFixed(0) + 'x' + H.toFixed(0));
