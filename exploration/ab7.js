import { readFileSync, writeFileSync } from 'fs';
import { tileAB } from './tab_lib.js';
const faces = JSON.parse(readFileSync('ab5_faces.json', 'utf8'));
const { V } = tileAB(1.94, 0.8);
const col = ['#9ec5e8', '#ffc9a0', '#9ec5e8', '#b8e0a8', '#9ec5e8']; // face 1 is the mirror pentagon, face 3 the heptagon
const lab = ['', '', '', '', ''];
const s = 55, pad = 40;
const xs = V.map(p=>p[0]), ys = V.map(p=>p[1]);
const minx = Math.min(...xs), maxy = Math.max(...ys);
const X = p => (p[0]-minx)*s+pad, Y = p => (maxy-p[1])*s+pad;
let body = '';
faces.forEach((f, k) => {
  body += `<polygon points="${f.map(p=>`${X(p).toFixed(1)},${Y(p).toFixed(1)}`).join(' ')}" fill="${col[k]}" stroke="#1b3a57" stroke-width="2" stroke-linejoin="round"/>`;
  const cx = f.reduce((a,p)=>a+p[0],0)/f.length, cy = f.reduce((a,p)=>a+p[1],0)/f.length;
  const name = k === 3 ? 'H' : k === 1 ? 'P̄' : 'P';
  body += `<text x="${X([cx,0]).toFixed(1)}" y="${(Y([0,cy])+5).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="${k===3?22:14}" font-weight="bold" fill="#1b3a57">${name}</text>`;
});
const W = (Math.max(...xs)-minx)*s+2*pad, H = (maxy-Math.min(...ys))*s+2*pad;
writeFileSync('tile_ab_pieces.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${(H+10).toFixed(0)}" viewBox="0 0 ${W.toFixed(0)} ${(H+10).toFixed(0)}"><rect width="100%" height="100%" fill="white"/>${body}</svg>`);
