// Exact arithmetic in Q(√2, √3).
// An element is (n0 + n1·√2 + n2·√3 + n3·√6) / d with integer n_i and d > 0, kept in lowest terms.
// {1, √2, √3, √6} is linearly independent over Q, so the normalised form is unique and eq() is exact.

// MUL[i][j] = [coefficient, basis index] for basis_i * basis_j
const MUL = [
  [[1, 0], [1, 1], [1, 2], [1, 3]],
  [[1, 1], [2, 0], [1, 3], [2, 2]],
  [[1, 2], [1, 3], [3, 0], [3, 1]],
  [[1, 3], [2, 2], [3, 1], [6, 0]],
];
const BASIS = [1, Math.SQRT2, Math.sqrt(3), Math.sqrt(6)];
const NAMES = ['', '√2', '√3', '√6'];

const gcd = (a, b) => {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};

export class K {
  constructor(n, d = 1) {
    if (d < 0) { n = n.map((x) => -x); d = -d; }
    let g = d;
    for (const x of n) g = gcd(g, x);
    if (g > 1) { n = n.map((x) => x / g); d = d / g; }
    this.n = n.map((x) => x + 0); // + 0 turns -0 into 0
    this.d = d;
  }
  static int(k) { return new K([k, 0, 0, 0]); }
  add(o) { return new K(this.n.map((x, i) => x * o.d + o.n[i] * this.d), this.d * o.d); }
  sub(o) { return new K(this.n.map((x, i) => x * o.d - o.n[i] * this.d), this.d * o.d); }
  neg() { return new K(this.n.map((x) => -x), this.d); }
  mul(o) {
    const r = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      if (this.n[i] === 0) continue;
      for (let j = 0; j < 4; j++) {
        if (o.n[j] === 0) continue;
        const [c, k] = MUL[i][j];
        r[k] += c * this.n[i] * o.n[j];
      }
    }
    return new K(r, this.d * o.d);
  }
  divInt(m) { return new K(this.n, this.d * m); }
  eq(o) { return this.d === o.d && this.n.every((x, i) => x === o.n[i]); }
  isZero() { return this.n.every((x) => x === 0); }
  val() { return this.n.reduce((s, x, i) => s + x * BASIS[i], 0) / this.d; }
  sign() {
    if (this.isZero()) return 0;
    const v = this.val();
    if (Math.abs(v) < 1e-12) throw new Error('sign(): value too close to zero to trust: ' + this);
    return v > 0 ? 1 : -1;
  }
  key() { return this.n.join(',') + '/' + this.d; }
  toString() {
    const parts = [];
    this.n.forEach((x, i) => { if (x !== 0) parts.push(`${x}${NAMES[i]}`); });
    const s = parts.length ? parts.join(' + ').replace(/\+ -/g, '- ') : '0';
    return this.d === 1 ? s : `(${s})/${this.d}`;
  }
}

export const kk = (n0, n1, n2, n3, d = 1) => new K([n0, n1, n2, n3], d);
export const ZERO = K.int(0);
export const ONE = K.int(1);
export const S2 = kk(0, 1, 0, 0);
export const S3 = kk(0, 0, 1, 0);
export const S6 = kk(0, 0, 0, 1);
