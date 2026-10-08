import { writeFileSync } from 'fs';
import { construct } from './tiles.js';
import { num, pt } from './geom.js';
import { K, kk } from './field.js';
const { V } = construct();
const pts = V.map(num);
const S_ = [1.5, Math.sqrt(3)/2], T_ = [(3+Math.sqrt(3))/2, (3-Math.sqrt(3))/2];
const Sc=60, pad=40;
const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
const minx=Math.min(...xs), maxx=Math.max(...xs), miny=Math.min(...ys), maxy=Math.max(...ys);
const W=(maxx-minx)*Sc*1.33+2*pad, H=(maxy-miny)*Sc*1.33+2*pad, s=Sc*1.33;
const X=p=>((p[0]-minx)*s+pad), Y=p=>((maxy-p[1])*s+pad);
const poly=pts.map(p=>`${X(p).toFixed(1)},${Y(p).toFixed(1)}`).join(' ');
const line=(a,b,c,w=2.5,d)=>`<line x1="${X(a).toFixed(1)}" y1="${Y(a).toFixed(1)}" x2="${X(b).toFixed(1)}" y2="${Y(b).toFixed(1)}" stroke="${c}" stroke-width="${w}"${d?` stroke-dasharray="${d}"`:''}/>`;
const dot=(p,n,c,dx=8,dy=-8)=>`<circle cx="${X(p).toFixed(1)}" cy="${Y(p).toFixed(1)}" r="5" fill="${c}" stroke="white" stroke-width="1.5"/><text x="${(X(p)+dx).toFixed(1)}" y="${(Y(p)+dy).toFixed(1)}" font-family="sans-serif" font-size="14" font-weight="bold" fill="${c}">${n}</text>`;
const lab=pts.map((p,i)=>`<circle cx="${X(p).toFixed(1)}" cy="${Y(p).toFixed(1)}" r="3" fill="#333"/><text x="${(X(p)+6).toFixed(1)}" y="${(Y(p)-6).toFixed(1)}" font-family="sans-serif" font-size="11" fill="#555">${i}</text>`).join('');
const b12 = [pts[12][0]+Math.cos(-Math.PI/12)*1.2, pts[12][1]+Math.sin(-Math.PI/12)*1.2];
const extra =
  line(pts[12], b12, '#868e96', 1, '4,3') +
  line(pts[8],pts[12],'#2b8a3e') + line(S_,pts[12],'#2b8a3e') +
  line(S_,pts[1],'#d9480f') +
  line(T_,S_,'#7048e8') + line(T_,pts[3],'#1c7ed6') + line(T_,pts[6],'#c92a2a') +
  dot(S_,'S','#d9480f',-16,16) + dot(T_,'T','#7048e8',8,18);
writeFileSync('q1.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H.toFixed(0)}" viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}"><rect width="100%" height="100%" fill="white"/><polygon points="${poly}" fill="#9ec5e8" stroke="#1b3a57" stroke-width="2" stroke-linejoin="round"/>${extra}${lab}</svg>`);
