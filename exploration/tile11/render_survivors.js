// Draw the four surviving coronas of T0 (output of survivors.js).
import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('survivors.json', 'utf8'));
const fill = { T0: '#8fd17a', T1: '#9ec5e8', T1b: '#ffc9a0' };
const S = 62;
const panelW = 400, panelH = 330;
let body = '';
data.forEach((tiles, n) => {
  const ox = (n % 2) * panelW + 30, oy = Math.floor(n / 2) * panelH + 40;
  const X = (p) => (ox + (p[0] + 0.3) * S).toFixed(1);
  const Y = (p) => (oy + (4.0 - p[1]) * S).toFixed(1);
  body += `<text x="${ox}" y="${oy - 14}" font-family="sans-serif" font-size="14" font-weight="bold" fill="#222">survivor ${n + 1}</text>`;
  for (const t of tiles) {
    const outside = t.role === null && t.kind !== 'T0';
    const pts = t.pts.map((p) => `${X(p)},${Y(p)}`).join(' ');
    body += `<polygon points="${pts}" fill="${fill[t.kind]}" fill-opacity="${outside ? 0.45 : 1}" stroke="#1b3a57" stroke-width="${outside ? 1.2 : 2}" ${outside ? 'stroke-dasharray="5,3"' : ''} stroke-linejoin="round"/>`;
    const cx = t.pts.reduce((s, p) => s + p[0], 0) / t.pts.length;
    const cy = t.pts.reduce((s, p) => s + p[1], 0) / t.pts.length;
    const label = t.kind === 'T0' ? 'T₀' : t.role || '';
    if (label) body += `<text x="${X([cx])}" y="${(Number(Y([0, cy])) + 5).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="bold" fill="#1b3a57">${label}</text>`;
  }
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${panelW * 2}" height="${panelH * 2 + 20}" viewBox="0 0 ${panelW * 2} ${panelH * 2 + 20}"><rect width="100%" height="100%" fill="white"/>${body}<text x="30" y="${panelH * 2 + 6}" font-family="sans-serif" font-size="12" fill="#555">Solid: cluster tiles A, B, C, E around T₀. Dashed: the two outside neighbours, which vary between survivors.</text></svg>`;
writeFileSync('survivors.svg', svg);
console.log('wrote survivors.svg');
