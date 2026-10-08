import { construct, describe, canonical, strip, lenName } from './tiles.js';
import { U, psub, padd, reflectPoint, dirIndex, num, len2, cross, dot, pkey, peq, area2, mirrorX } from './geom.js';
import { K, kk } from './field.js';
const { V, b12 } = construct();
const S = reflectPoint(V[8], V[12], b12);
const T = reflectPoint(V[12], S, dirIndex(psub(V[1], S)));
const P = [...V, S, T]; // 14 = S, 15 = T
const segs = [];
for (let i = 0; i < 14; i++) segs.push([i, (i + 1) % 14]);
const interior = [[8,12],[14,12],[14,1],[15,14],[15,3],[15,6]];
segs.push(...interior);
// check no proper crossings and no vertex lying inside a segment
const properCross = (a,b,c,d)=>{const o=(p,q,r)=>cross(psub(q,p),psub(r,p)).sign();return o(a,b,c)*o(a,b,d)<0&&o(c,d,a)*o(c,d,b)<0;};
let bad=0;
for (let i=0;i<segs.length;i++) for (let j=i+1;j<segs.length;j++){
  const [a,b]=segs[i],[c,d]=segs[j];
  if (new Set([a,b,c,d]).size<4) continue;
  if (properCross(P[a],P[b],P[c],P[d])) {bad++;console.log('crossing',segs[i],segs[j]);}
}
for (const [a,b] of segs) for (let v=0;v<P.length;v++){ if(v===a||v===b)continue;
  if (cross(psub(P[b],P[a]),psub(P[v],P[a])).isZero() && dot(psub(P[v],P[a]),psub(P[b],P[a])).sign()>0 && dot(psub(P[v],P[b]),psub(P[a],P[b])).sign()>0){bad++;console.log('vertex',v,'lies inside segment',a,b);} }
console.log('problems:',bad);
// half-edge face traversal
const adj = P.map(()=>[]);
for (const [a,b] of segs){ adj[a].push(b); adj[b].push(a); }
const ang = (a,b)=>{ const k=dirIndex(psub(P[b],P[a])); if(k<0) throw new Error('off-lattice '+a+'-'+b); return k; };
for (let v=0;v<P.length;v++) adj[v].sort((x,y)=>ang(v,x)-ang(v,y));
const seen = new Set(); const faces = [];
for (let a=0;a<P.length;a++) for (const b of adj[a]){
  if (seen.has(a+'>'+b)) continue;
  const f=[]; let u=a,w=b;
  while(!seen.has(u+'>'+w)){ seen.add(u+'>'+w); f.push(u);
    // at w, take the next edge clockwise from the reverse direction => face on the left
    const list=adj[w]; const idx=list.indexOf(u); const nx=list[(idx-1+list.length)%list.length];
    u=w; w=nx; }
  faces.push(f);
}
const faceInfo = faces.map(f=>({f, a:area2(f.map(i=>P[i])).divInt(2)})).filter(x=>x.a.sign()>0);
console.log('bounded faces:', faceInfo.length);
const out = [];
for (const {f,a} of faceInfo){
  const pts=f.map(i=>P[i]); const poly=strip(pts); const d=describe(pts);
  out.push({f, n:poly.length, a, canon:canonical(d), d});
  console.log('face',f.join('-'),'corners',poly.length,'area',a.toString(),'~',a.val().toFixed(4));
  console.log('   ',d.map(c=>`${c.angle*15}°-${c.edge}`).join(' '));
}
const total = out.reduce((s,x)=>s.add(x.a),K.int(0));
console.log('total area',total.toString(),' tile area 3+3√3:', total.eq(kk(3,0,3,0)));

// congruence / chirality
const mirrorDesc = (poly)=>describe(poly.map(mirrorX).reverse());
const P5 = out.filter(x=>x.n===5), H6 = out.filter(x=>x.n===6);
console.log('pentagon canonical forms all equal (direct congruence):', new Set(P5.map(x=>x.canon)).size===1);
const pc = P5[0].canon, pm = canonical(mirrorDesc(P5[0].f.map(i=>P[i])));
console.log('pentagon mirror-symmetric (mirror image directly congruent):', pc===pm);
const hc = H6[0].canon, hm = canonical(mirrorDesc(H6[0].f.map(i=>P[i])));
console.log('hexagon mirror-symmetric:', hc===hm);
console.log('hexagon convex (all angles < 180):', H6[0].d.every(c=>c.angle<12));
console.log('pentagon convex:', P5[0].d.every(c=>c.angle<12));
console.log('hexagon area', H6[0].a.toString(), ' pentagon area', P5[0].a.toString());
