// Exact arithmetic in E = Q(√3, l) with l^2 = M0 + M1·√3 (integers). Here l = 50·ℓ where ℓ = |Q-12|.
// Basis {1, √3, l, √3·l}; element = (n0 + n1√3 + n2 l + n3 √3 l) / d with BigInt n_i and d > 0.
export const M0 = 15279n, M1 = -4680n;

const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
export function isqrt(n) {
  if (n < 0n) throw new Error('isqrt of negative');
  if (n < 2n) return n;
  let x = 1n << BigInt((n.toString(2).length + 1) >> 1);
  for (;;) { const y = (x + n / x) >> 1n; if (y >= x) return x; x = y; }
}

// high-precision constants (scaled by 10^60)
const SC = 10n ** 60n;
const S3H = isqrt(3n * SC * SC);
const L2H = M0 * SC + M1 * S3H; // l^2 scaled
const LH = isqrt(L2H * SC); // l scaled
const SQ3 = Math.sqrt(3), LF = Number(LH) / 1e60;

export class E {
  constructor(n, d = 1n) {
    if (d < 0n) { n = n.map((x) => -x); d = -d; }
    let g = d;
    for (const x of n) { if (g === 1n) break; g = gcd(g, x); }
    if (g > 1n) { n = n.map((x) => x / g); d = d / g; }
    this.n = n; this.d = d; this._f = undefined; this._k = undefined;
  }
  static int(k) { return new E([BigInt(k), 0n, 0n, 0n]); }
  static rat(p, q = 1) { return new E([BigInt(p), 0n, 0n, 0n], BigInt(q)); }
  static s3(p = 1, q = 1) { return new E([0n, BigInt(p), 0n, 0n], BigInt(q)); }
  add(o) { const a = this.d, b = o.d; return new E(this.n.map((x, i) => x * b + o.n[i] * a), a * b); }
  sub(o) { const a = this.d, b = o.d; return new E(this.n.map((x, i) => x * b - o.n[i] * a), a * b); }
  neg() { return new E(this.n.map((x) => -x), this.d); }
  mul(o) {
    const [a0, a1, b0, b1] = this.n, [c0, c1, d0, d1] = o.n;
    // A = a0 + a1√3, B = b0 + b1√3, C = c0 + c1√3, D = d0 + d1√3;  (A + B l)(C + D l) = (AC + BD·M) + (AD + BC) l
    const fm = (x0, x1, y0, y1) => [x0 * y0 + 3n * x1 * y1, x0 * y1 + x1 * y0];
    const AC = fm(a0, a1, c0, c1), BD = fm(b0, b1, d0, d1), AD = fm(a0, a1, d0, d1), BC = fm(b0, b1, c0, c1);
    const BDM = fm(BD[0], BD[1], M0, M1);
    return new E([AC[0] + BDM[0], AC[1] + BDM[1], AD[0] + BC[0], AD[1] + BC[1]], this.d * o.d);
  }
  mulInt(k) { return new E(this.n.map((x) => x * k), this.d); }
  inv() {
    if (this.isZero()) throw new Error('division by zero');
    const cl = new E([this.n[0], this.n[1], -this.n[2], -this.n[3]], this.d); // conjugate over F
    const p = this.mul(cl); // in F
    const cs = new E([p.n[0], -p.n[1], 0n, 0n], p.d);
    const q = p.mul(cs); // rational: n[0]/d
    // 1/this = cl * cs / q
    const num = cl.mul(cs);
    return new E(num.n.map((x) => x * q.d), num.d * q.n[0]);
  }
  div(o) { return this.mul(o.inv()); }
  isZero() { return this.n[0] === 0n && this.n[1] === 0n && this.n[2] === 0n && this.n[3] === 0n; }
  isRational() { return this.n[1] === 0n && this.n[2] === 0n && this.n[3] === 0n; }
  eq(o) { return this.d === o.d && this.n[0] === o.n[0] && this.n[1] === o.n[1] && this.n[2] === o.n[2] && this.n[3] === o.n[3]; }
  key() { return this._k ?? (this._k = this.n.join(',') + '/' + this.d); }
  f() {
    if (this._f !== undefined) return this._f;
    const [n0, n1, n2, n3] = this.n;
    return (this._f = (Number(n0) + Number(n1) * SQ3 + Number(n2) * LF + Number(n3) * SQ3 * LF) / Number(this.d));
  }
  sign() {
    if (this.isZero()) return 0;
    const [n0, n1, n2, n3] = this.n;
    const v = this.f();
    const mag = (Math.abs(Number(n0)) + Math.abs(Number(n1)) * 1.75 + Math.abs(Number(n2)) * LF + Math.abs(Number(n3)) * 1.75 * LF) / Number(this.d);
    if (Math.abs(v) > 1e-9 * mag) return v > 0 ? 1 : -1;
    const V = n0 * SC + n1 * S3H + n2 * LH + (n3 * S3H * LH) / SC;
    const err = ((n0 < 0n ? -n0 : n0) + (n1 < 0n ? -n1 : n1) + (n2 < 0n ? -n2 : n2) + (n3 < 0n ? -n3 : n3)) * 4n + 16n;
    if (V > err) return 1;
    if (V < -err) return -1;
    throw new Error('sign(): nonzero element indistinguishable from zero: ' + this.toString());
  }
  toString() { const nm = ['', '√3', 'l', '√3·l']; const p = []; this.n.forEach((x, i) => { if (x !== 0n) p.push(`${x}${nm[i]}`); }); return `(${p.join(' + ') || '0'})/${this.d}`; }
}
export const ZERO = E.int(0), ONE = E.int(1), MINUS_ONE = E.int(-1);
// ℓ = |Q-12| = l / 50
export const ELL = E.rat(1, 50).mul(new E([0n, 0n, 1n, 0n]));
export const ELL2 = ELL.mul(ELL);

// ---- complex numbers over E, as [re, im] ----
export const cadd = (a, b) => [a[0].add(b[0]), a[1].add(b[1])];
export const csub = (a, b) => [a[0].sub(b[0]), a[1].sub(b[1])];
export const cmul = (a, b) => [a[0].mul(b[0]).sub(a[1].mul(b[1])), a[0].mul(b[1]).add(a[1].mul(b[0]))];
export const cconj = (a) => [a[0], a[1].neg()];
export const ceq = (a, b) => a[0].eq(b[0]) && a[1].eq(b[1]);
export const cnorm2 = (a) => a[0].mul(a[0]).add(a[1].mul(a[1]));
export const cscale = (a, s) => [a[0].mul(s), a[1].mul(s)];
export const ckey = (a) => a[0].key() + '|' + a[1].key();
export const C_ONE = [ONE, ZERO], C_PI = [MINUS_ONE, ZERO];

// angle ordering for unit complex numbers with argument in [0, 2π)
const half = (z) => { const si = z[1].sign(); return si > 0 || (si === 0 && z[0].sign() > 0) ? 0 : 1; };
export function angleLess(a, b) {
  const ha = half(a), hb = half(b);
  if (ha !== hb) return ha < hb;
  return a[0].mul(b[1]).sub(a[1].mul(b[0])).sign() > 0;
}
export const angleLessEq = (a, b) => ceq(a, b) || angleLess(a, b);
