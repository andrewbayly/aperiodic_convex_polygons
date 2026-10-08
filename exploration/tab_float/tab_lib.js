// Tile(a,b) numeric construction (a, b are plain numbers). Directions are exact lattice directions.
import { U, num } from './geom.js';
export const ANG = [90,240,90,240,90,120,180,120,270,120,90,120,270,120];
export const SEQ = 'a a b b a a a a b b a a b b'.split(' ');
export const HEAD = (() => { const hs = []; let h = 0; for (let i = 0; i < 14; i++) { hs.push(((h % 24) + 24) % 24); h += 12 - ANG[(i + 1) % 14] / 15; } return hs; })();
export const dirVec = (k) => num(U[k]);
export function tileAB(a, b) {
  const V = [[0, 0]];
  SEQ.forEach((s, i) => { const L = s === 'a' ? a : b; const u = dirVec(HEAD[i]); const p = V[i]; V.push([p[0] + L * u[0], p[1] + L * u[1]]); });
  return { V: V.slice(0, 14), len: SEQ.map((s) => (s === 'a' ? a : b)) };
}
export function drawSVG({ V, a, b, points = [], lines = [], file, caption = '' }) {
  const s = 55, pad = 40;
  const all = [...V, ...points.map((p) => p.xy)];
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const minx = Math.min(...xs), maxy = Math.max(...ys);
  const W = (Math.max(...xs) - minx) * s + 2 * pad, H = (maxy - Math.min(...ys)) * s + 2 * pad;
  const X = (p) => (p[0] - minx) * s + pad, Y = (p) => (maxy - p[1]) * s + pad;
  const poly = V.map((p) => `${X(p).toFixed(1)},${Y(p).toFixed(1)}`).join(' ');
  let edges = '';
  V.forEach((p, i) => { const q = V[(i + 1) % 14]; const col = SEQ[i] === 'a' ? '#d9480f' : '#1c7ed6';
    edges += `<line x1="${X(p).toFixed(1)}" y1="${Y(p).toFixed(1)}" x2="${X(q).toFixed(1)}" y2="${Y(q).toFixed(1)}" stroke="${col}" stroke-width="3.5" stroke-linecap="round"/>`; });
  const extra = lines.map((l) => `<line x1="${X(l.from).toFixed(1)}" y1="${Y(l.from).toFixed(1)}" x2="${X(l.to).toFixed(1)}" y2="${Y(l.to).toFixed(1)}" stroke="${l.color || '#555'}" stroke-width="2.5"${l.dash ? ` stroke-dasharray="${l.dash}"` : ''}/>`).join('');
  const lab = V.map((p, i) => `<circle cx="${X(p).toFixed(1)}" cy="${Y(p).toFixed(1)}" r="3" fill="#333"/><text x="${(X(p) + 6).toFixed(1)}" y="${(Y(p) - 6).toFixed(1)}" font-family="sans-serif" font-size="12" fill="#222">${i}</text>`).join('');
  const pts = points.map((p) => `<circle cx="${X(p.xy).toFixed(1)}" cy="${Y(p.xy).toFixed(1)}" r="5" fill="${p.color || '#c92a2a'}" stroke="white" stroke-width="1.5"/><text x="${(X(p.xy) + (p.dx ?? 8)).toFixed(1)}" y="${(Y(p.xy) + (p.dy ?? 16)).toFixed(1)}" font-family="sans-serif" font-size="14" font-weight="bold" fill="${p.color || '#c92a2a'}">${p.name}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${(H + 30).toFixed(0)}" viewBox="0 0 ${W.toFixed(0)} ${(H + 30).toFixed(0)}"><rect width="100%" height="100%" fill="white"/><polygon points="${poly}" fill="#e9f2fb"/>${edges}${extra}${lab}${pts}<text x="${pad}" y="${(H + 18).toFixed(0)}" font-family="sans-serif" font-size="12" fill="#444">a = ${a}, b = ${b}${caption ? '   ' + caption : ''}</text></svg>`;
}
