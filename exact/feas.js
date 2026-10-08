// Feasibility: exact coordinates of Tile(a,b) and the cut points in F = Q(sqrt3), using BigInt rationals.
class Fr { // rational
  constructor(n, d = 1n) { if (d < 0n) { n = -n; d = -d; } const g = gcd(n < 0n ? -n : n, d); this.n = g > 1n ? n / g : n; this.d = g > 1n ? d / g : d; }
  add(o) { return new Fr(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { return new Fr(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { return new Fr(this.n * o.n, this.d * o.d); }
  div(o) { return new Fr(this.n * o.d, this.d * o.n); }
  neg() { return new Fr(-this.n, this.d); }
  isZero() { return this.n === 0n; }
  eq(o) { return this.n === o.n && this.d === o.d; }
  val() { return Number(this.n) / Number(this.d); }
  toString() { return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`; }
}
function gcd(a, b) { while (b) [a, b] = [b, a % b]; return a; }
const R = (n, d = 1n) => new Fr(BigInt(n), BigInt(d));
// F = Q(sqrt3): x + y*sqrt3
class F {
  constructor(x, y) { this.x = x; this.y = y; }
  add(o) { return new F(this.x.add(o.x), this.y.add(o.y)); }
  sub(o) { return new F(this.x.sub(o.x), this.y.sub(o.y)); }
  mul(o) { return new F(this.x.mul(o.x).add(this.y.mul(o.y).mul(R(3))), this.x.mul(o.y).add(this.y.mul(o.x))); }
  scale(r) { return new F(this.x.mul(r), this.y.mul(r)); }
  neg() { return new F(this.x.neg(), this.y.neg()); }
  inv() { const nrm = this.x.mul(this.x).sub(this.y.mul(this.y).mul(R(3))); return new F(this.x.div(nrm), this.y.neg().div(nrm)); }
  div(o) { return this.mul(o.inv()); }
  isZero() { return this.x.isZero() && this.y.isZero(); }
  eq(o) { return this.x.eq(o.x) && this.y.eq(o.y); }
  val() { return this.x.val() + this.y.val() * Math.sqrt(3); }
  toString() { return `(${this.x} + ${this.y}√3)`; }
}
const fr = (x, y = 0) => new F(typeof x === 'object' ? x : R(x), typeof y === 'object' ? y : R(y));
const half = R(1, 2);
// 30-degree direction vectors: k*30deg for k = 0..11, entries in F
const c30 = [fr(1), fr(0, half), fr(half), fr(0), fr(half.neg()), fr(0, half.neg()), fr(-1), fr(0, half.neg()), fr(half.neg()), fr(0), fr(half), fr(0, half)];
// cos(30k) = [1, √3/2, 1/2, 0, -1/2, -√3/2, -1, -√3/2, -1/2, 0, 1/2, √3/2]
// sin(30k) = [0, 1/2, √3/2, 1, √3/2, 1/2, 0, -1/2, -√3/2, -1, -√3/2, -1/2]
const s30 = [fr(0), fr(half), fr(0, half), fr(1), fr(0, half), fr(half), fr(0), fr(half.neg()), fr(0, half.neg()), fr(-1), fr(0, half.neg()), fr(half.neg())];
const dir = (deg) => { const k = (((deg / 30) % 12) + 12) % 12; return [c30[k], s30[k]]; };
const ANG = [90,240,90,240,90,120,180,120,270,120,90,120,270,120];
const SEQ = 'a a b b a a a a b b a a b b'.split(' ');
const a = R(97, 50), b = R(4, 5), dd = R(1, 5);
const heads = []; { let h = 0; for (let i = 0; i < 14; i++) { heads.push(((h % 360) + 360) % 360); h += 180 - ANG[(i + 1) % 14]; } }
const V = [[fr(0), fr(0)]];
for (let i = 0; i < 14; i++) { const [cx, sx] = dir(heads[i]); const L = SEQ[i] === 'a' ? a : b; V.push([V[i][0].add(cx.scale(L)), V[i][1].add(sx.scale(L))]); }
console.log('closes:', V[14][0].isZero() && V[14][1].isZero()); V.pop();
const vsub = (p, q) => [p[0].sub(q[0]), p[1].sub(q[1])];
const vadd = (p, q) => [p[0].add(q[0]), p[1].add(q[1])];
const vscale = (p, s) => [p[0].mul(s), p[1].mul(s)];
const dot = (p, q) => p[0].mul(q[0]).add(p[1].mul(q[1]));
const cross = (p, q) => p[0].mul(q[1]).sub(p[1].mul(q[0]));
const reflect = (p, A, B) => { const v = vsub(B, A), w = vsub(p, A); const t = dot(w, v).div(dot(v, v)); const proj = vscale(v, t); return vadd(A, vsub(vadd(proj, proj), w)); };
const d11 = dir(heads[11]);
const P = [V[11][0].add(d11[0].scale(dd)), V[11][1].add(d11[1].scale(dd))];
const bis = dir((heads[1] + ANG[1] / 2) % 360);
const Q = [V[1][0].add(bis[0].scale(dd)), V[1][1].add(bis[1].scale(dd))];
const Rr = reflect(V[12], V[1], Q);
const S = reflect(Q, V[3], Rr);
const show = (n, p) => console.log(n, p[0].toString(), p[1].toString(), '≈', p[0].val().toFixed(4), p[1].val().toFixed(4));
show('P', P); show('Q', Q); show('R', Rr); show('S', S);
const N = [...V, P, Q, Rr, S];
const names = [...Array(14).keys()].map(String).concat(['P', 'Q', 'R', 'S']);
const sq = (i, j) => { const w = vsub(N[j], N[i]); return dot(w, w); };
const L = sq(12, 15);
console.log('|12-Q|^2 =', L.toString(), '≈', L.val().toFixed(6), ' sqrt ≈', Math.sqrt(L.val()).toFixed(6));
// classify each edge length^2 of the five pieces
const idx = { A: [0,1,15,12,13], B: [1,2,3,16,15], C: [3,4,5,17,16], D: [8,9,10,11,14], H: [6,7,8,14,12,15,16,17] };
const classes = new Map();
for (const [k, f] of Object.entries(idx)) for (let i = 0; i < f.length; i++) {
  const e = sq(f[i], f[(i+1)%f.length]);
  const key = e.toString();
  if (!classes.has(key)) classes.set(key, { e, ex: `${k}:${names[f[i]]}-${names[f[(i+1)%f.length]]}` });
}
for (const [key, { e, ex }] of classes) console.log('edge^2 =', key, '≈', e.val().toFixed(6), 'len ≈', Math.sqrt(e.val()).toFixed(5), ' e.g.', ex, ' ratio to L:', e.isZero() ? '-' : (e.div(L).y.isZero() ? e.div(L).x.toString() : 'not rational'));
// is L a square in F? try (x+y√3)^2 = L: N(L) must be a square
const nL = L.x.mul(L.x).sub(L.y.mul(L.y).mul(R(3)));
console.log('norm of L (x^2-3y^2) =', nL.toString());
