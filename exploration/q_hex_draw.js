import { writeFileSync } from 'fs';
import { strip } from './tiles.js';
import { makeTile, growCorona, growLayer } from './engine.js';
import { kinds, pieces } from './qkinds.js';
import { padd, pscale, num } from './geom.js';
import { K, kk } from './field.js';
const hk = { Hx: kinds.Hx };
const H = makeTile('Hx', strip(pieces.H));
let { results: states } = growCorona(H, hk, {});
for (let L = 2; L <= 4; L++) { const nx = []; for (const st of states) nx.push(...growLayer(st, st.tiles, hk, { maxNodes: 2_000_000 }).results); states = nx; }
const patch = states.find(s => new Set(s.tiles.map(t => t.vinfo[0].dN)).size === 2);
const o0 = H.vinfo[0].dN;
const other = patch.tiles.find(t => t.vinfo[0].dN !== o0);
const v1 = { x: kk(-3, 0, 0, 0, 2), y: kk(0, 0, 1, 0, 2) };
const v2 = { x: kk(1, 0, -3, 0, 2), y: kk(3, 0, -3, 0, 2) };
const shift = (t, v) => t.pts.map(p => num(padd(p, v)));
const polys = [];
for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
  const v = padd(pscale(v1, K.int(i)), pscale(v2, K.int(j)));
  polys.push({ c: 0, i, j, pts: shift(H, v) });
  polys.push({ c: 1, i, j, pts: shift(other, v) });
}
const [x0, x1, y0, y1] = [-2.5, 6.5, -2.0, 5.5];
const s = 80;
const X = p => (p[0] - x0) * s, Y = p => (y1 - p[1]) * s;
const W = (x1 - x0) * s, Hh = (y1 - y0) * s;
const col = ['#9ec5e8', '#ffc9a0'];
let body = '';
for (const t of polys) {
  const cx = t.pts.reduce((a, p) => a + p[0], 0) / 6, cy = t.pts.reduce((a, p) => a + p[1], 0) / 6;
  if (cx < x0 - 1 || cx > x1 + 1 || cy < y0 - 1 || cy > y1 + 1) continue;
  const isCell = t.i === 0 && t.j === 0;
  body += `<polygon points="${t.pts.map(p => `${X(p).toFixed(1)},${Y(p).toFixed(1)}`).join(' ')}" fill="${col[t.c]}" stroke="#1b3a57" stroke-width="${isCell ? 3 : 1.5}" stroke-linejoin="round"/>`;
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}"><defs><clipPath id="c"><rect width="${W}" height="${Hh}"/></clipPath></defs><rect width="100%" height="100%" fill="white"/><g clip-path="url(#c)">${body}</g><text x="12" y="${Hh - 12}" font-family="sans-serif" font-size="13" fill="#444">Hexagon of Q tiling the plane periodically: blue = one orientation, orange = rotated 180°. Bold outline: one lattice cell (two hexagons).</text></svg>`;
writeFileSync('hex_tiling.svg', svg);
console.log('ok', polys.length);
