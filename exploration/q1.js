import { construct } from './tiles.js';
import { U, psub, reflectPoint, dirIndex, num, len2, cross, dot, pkey, peq } from './geom.js';
const { V, b12 } = construct();
console.log('bisector of 12 direction index', b12, '=', b12*15, 'deg');
const S = reflectPoint(V[8], V[12], b12);
console.log('S exact:', S.x.toString(), '|', S.y.toString(), ' ~', num(S).map(v=>v.toFixed(4)));
const f=(a,b)=>{const d=psub(b,a);return {k:dirIndex(d),len2:len2(d).toString(),len:Math.sqrt(len2(d).val()).toFixed(4)}};
console.log('8-12',f(V[8],V[12]),' S-12',f(S,V[12]),' S-1',f(S,V[1]));
// is S on a vertex or the boundary?
console.log('S equals a vertex?', V.some(v=>peq(v,S)));
// reflect 12 in line S-1: general line -> try lattice direction, else float
const k = dirIndex(psub(V[1],S)) ;
console.log('dir S->1 index', k);
let T;
if (k>=0) T = reflectPoint(V[12], S, k);
console.log('T exact:', T && T.x.toString(), '|', T && T.y.toString(), T && num(T).map(v=>v.toFixed(4)));
const show=(n,a,b)=>console.log(n, 'len', Math.sqrt(len2(psub(a,b)).val()).toFixed(4), 'dirIdx', dirIndex(psub(b,a)));
show('T-S',T,S); show('T-3',T,V[3]); show('T-6',T,V[6]);
const inside=(Q)=>{let c=false;const n=14;for(let i=0;i<n;i++){const a=num(V[i]),b=num(V[(i+1)%n]);const q=num(Q);if((a[1]>q[1])!=(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
console.log('S inside tile:',inside(S),' T inside tile:',inside(T));
console.log(JSON.stringify({S:num(S),T:num(T)}));
