import { writeFileSync } from 'fs';
import { construct } from './tiles.js';
import { num, psub, reflectPoint, dirIndex } from './geom.js';
const { V, b12 } = construct();
const S = reflectPoint(V[8], V[12], b12), T = reflectPoint(V[12], S, dirIndex(psub(V[1], S)));
const P = [...V, S, T].map(num);
const faces = { A:[0,1,14,12,13], B:[1,2,3,15,14], C:[3,4,5,6,15], D:[8,9,10,11,12], H:[6,7,8,12,14,15] };
const fill = { A:'#9ec5e8', B:'#9ec5e8', C:'#9ec5e8', D:'#9ec5e8', H:'#b8e0a8' };
const s=80, pad=40;
const xs=P.map(p=>p[0]), ys=P.map(p=>p[1]);
const minx=Math.min(...xs), maxy=Math.max(...ys);
const X=p=>(p[0]-minx)*s+pad, Y=p=>(maxy-p[1])*s+pad;
let body='';
for (const [k,f] of Object.entries(faces)) {
  const pts=f.map(i=>P[i]);
  body+=`<polygon points="${pts.map(p=>`${X(p).toFixed(1)},${Y(p).toFixed(1)}`).join(' ')}" fill="${fill[k]}" stroke="#1b3a57" stroke-width="2" stroke-linejoin="round"/>`;
  const cx=pts.reduce((a,p)=>a+p[0],0)/pts.length, cy=pts.reduce((a,p)=>a+p[1],0)/pts.length;
  body+=`<text x="${X([cx,0]).toFixed(1)}" y="${(Y([0,cy])+6).toFixed(1)}" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="bold" fill="#1b3a57">${k==='H'?'H':k}</text>`;
}
const W=(Math.max(...xs)-minx)*s+2*pad, H=(maxy-Math.min(...ys))*s+2*pad;
writeFileSync('q2.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H.toFixed(0)}" viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}"><rect width="100%" height="100%" fill="white"/>${body}</svg>`);
