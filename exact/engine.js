// Exact corona engine over E = Q(√3, l).  Every geometric decision is exact; floating point is used only as a
// prefilter whose answer is accepted when it is clear by a wide margin (TOL), otherwise the exact test decides.
import { E, ONE, ZERO, isqrt, cadd, csub, cmul, cconj, ceq, ckey, cscale, C_PI, ELL, ELL2, angleLess, angleLessEq } from './field4.js';

export const TAU = 2 * Math.PI, PI = Math.PI, TOL = 1e-6;
const mod = (x) => ((x % TAU) + TAU) % TAU;
export const cf = (z) => [z[0].f(), z[1].f()];
export const argf = (z) => mod(Math.atan2(z[1].f(), z[0].f()));
const crossE = (p, q) => p[0].mul(q[1]).sub(p[1].mul(q[0]));
const dotE = (p, q) => p[0].mul(q[0]).add(p[1].mul(q[1]));
const norm2 = (p) => dotE(p, p);

// ---- exact edge length: rational r or r*ell ----
function ratSqrt(q) { // q rational E (n0/d), returns rational E or null
  if (!q.isRational() || q.n[0] < 0n) return null;
  const p = q.n[0], d = q.d; const sp = isqrt(p), sd = isqrt(d);
  return sp * sp === p && sd * sd === d ? E.rat(Number(sp), Number(sd)) : null;
}
// square root inside Q(sqrt3) (elements with n2 = n3 = 0): (p + q√3)^2 = x + y√3  <=> x = p^2+3q^2, y = 2pq
function sqrtF(u) {
  if (u.n[2] !== 0n || u.n[3] !== 0n) return null;
  const x = E.rat(0).add(new E([u.n[0], 0n, 0n, 0n], u.d)), y = new E([u.n[1], 0n, 0n, 0n], u.d);
  const Nn = ratSqrt(x.mul(x).sub(y.mul(y).mulInt(3n)));
  if (!Nn) return null;
  if (y.isZero()) { const r = ratSqrt(x); if (r) return r; const r3 = ratSqrt(x.div(E.int(3))); return r3 ? r3.mul(E.s3(1, 1)) : null; }
  for (const sg of [Nn, Nn.neg()]) {
    const p2 = x.add(sg).div(E.int(2)); const p = ratSqrt(p2);
    if (p && !p.isZero()) return p.add(y.div(E.int(2).mul(p)).mul(E.s3(1, 1)));
  }
  return null;
}
export function lenOf(ev) {
  const n2 = norm2(ev);
  const r = ratSqrt(n2); if (r) return r;
  const r2 = ratSqrt(n2.div(ELL2)); if (r2) return r2.mul(ELL);
  const f = sqrtF(n2); if (f) return f.sign() < 0 ? f.neg() : f; // length must be positive
  throw new Error('edge length not rational, rational*ell, or in Q(sqrt3): ' + n2.toString());
}
const unit = (ev) => cscale(ev, lenOf(ev).inv());

// ---- kinds ----
export function makeKind(name, pts) {
  const n = pts.length;
  const u = pts.map((p, j) => unit(csub(pts[(j + 1) % n], p)));
  const corners = pts.map((p, j) => {
    const start = u[j], end = [u[(j + n - 1) % n][0].neg(), u[(j + n - 1) % n][1].neg()];
    const ang = cmul(end, cconj(start));
    if (ang[1].sign() <= 0) throw new Error(`kind ${name}: corner ${j} not convex/CCW`);
    return { start, end, ang, af: argf(start), angf: argf(ang) };
  });
  return { name, poly: pts, n, corners, pf: pts.map(cf) };
}

// ---- placed tiles (exact data materialised lazily) ----
export class Tile {
  constructor(kind, i, O, g0) {
    this.kind = kind; this.i = i; this.O = O; this.g0 = g0;
    const Of = cf(O), g0a = argf(g0);
    const delta = g0a - kind.corners[i].af, c = Math.cos(delta), s = Math.sin(delta);
    const b = kind.pf[i];
    this.fpts = kind.pf.map((p) => { const x = p[0] - b[0], y = p[1] - b[1]; return [Of[0] + c * x - s * y, Of[1] + s * x + c * y]; });
    const xs = this.fpts.map((p) => p[0]), ys = this.fpts.map((p) => p[1]);
    this.bb = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    this._X = null; this._key = null;
  }
  get X() {
    if (this._X) return this._X;
    const k = this.kind, base = k.poly[this.i];
    const rot = cmul(this.g0, cconj(k.corners[this.i].start));
    const pts = k.poly.map((p) => cadd(this.O, cmul(rot, csub(p, base))));
    const wedges = k.corners.map((c, j) => ({ start: cmul(rot, c.start), end: cmul(rot, c.end), rel: c.ang, lenf: c.angf }));
    for (const w of wedges) { w.af = argf(w.start); w.ef = argf(w.end); }
    return (this._X = { pts, wedges, vkeys: pts.map(ckey) });
  }
  get pts() { return this.X.pts; }
  get key() { return this._key ?? (this._key = this.X.vkeys.slice().sort().join(';')); }
  get kindName() { return this.kind.name; }
}
export const polyKey = (pts) => pts.map(ckey).sort().join(';');

// ---- overlap ----
function axisMax(A, B) { // float: for each edge axis of A, max normalised cross of B's vertices
  const n = A.fpts.length; let anySep = false, anyAmb = false;
  for (let j = 0; j < n; j++) {
    const a = A.fpts[j], b = A.fpts[(j + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    let mx = -Infinity;
    for (const v of B.fpts) { const c = (dx * (v[1] - a[1]) - dy * (v[0] - a[0])) / L; if (c > mx) mx = c; if (mx > TOL) break; }
    if (mx < -TOL) anySep = true; else if (mx <= TOL) anyAmb = true;
  }
  return { anySep, anyAmb };
}
function exactSeparates(A, B) {
  const n = A.fpts.length, P = A.pts, Q = B.pts;
  for (let j = 0; j < n; j++) {
    const a = A.fpts[j], b = A.fpts[(j + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    let ok = true, e = null;
    for (let m = 0; m < Q.length && ok; m++) {
      const v = B.fpts[m];
      const c = (dx * (v[1] - a[1]) - dy * (v[0] - a[0])) / L;
      if (c > TOL) { ok = false; break; }
      if (c < -TOL) continue;
      e ??= csub(P[(j + 1) % n], P[j]);
      if (crossE(e, csub(Q[m], P[j])).sign() > 0) ok = false;
    }
    if (ok) return true;
  }
  return false;
}
export let stats = { overlapExact: 0, overlapFloat: 0 };
export function interiorsOverlap(X, Y) {
  if (X.bb[2] <= Y.bb[0] - TOL || Y.bb[2] <= X.bb[0] - TOL || X.bb[3] <= Y.bb[1] - TOL || Y.bb[3] <= X.bb[1] - TOL) return false;
  const a = axisMax(X, Y), b = axisMax(Y, X);
  if (a.anySep || b.anySep) { stats.overlapFloat++; return false; }
  if (!a.anyAmb && !b.anyAmb) { stats.overlapFloat++; return true; }
  stats.overlapExact++;
  return !(exactSeparates(X, Y) || exactSeparates(Y, X));
}

// ---- wedges at a point ----
export function wedgeAt(t, O, Of) {
  const n = t.fpts.length;
  const bx = t.bb;
  if (Of[0] < bx[0] - TOL || Of[0] > bx[2] + TOL || Of[1] < bx[1] - TOL || Of[1] > bx[3] + TOL) return null;
  const X = () => t.X;
  for (let j = 0; j < n; j++) {
    const q = t.fpts[j];
    if (Math.abs(q[0] - Of[0]) < TOL && Math.abs(q[1] - Of[1]) < TOL && ceq(X().pts[j], O)) return X().wedges[j];
  }
  for (let j = 0; j < n; j++) {
    const a = t.fpts[j], b = t.fpts[(j + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    const cr = (dx * (Of[1] - a[1]) - dy * (Of[0] - a[0])) / L;
    if (cr < -TOL) return null;
    if (cr > TOL) continue;
    const P = X().pts, e = csub(P[(j + 1) % n], P[j]), w = csub(O, P[j]);
    const sg = crossE(e, w).sign();
    if (sg < 0) return null;
    if (sg > 0) continue;
    const s = dotE(w, e).sign(), s2 = dotE(w, e).sub(dotE(e, e)).sign();
    if (s > 0 && s2 < 0) { const c = X().wedges[j]; return { start: c.start, end: [c.start[0].neg(), c.start[1].neg()], af: c.af, ef: mod(c.af + PI), lenf: PI, rel: C_PI }; }
    return null;
  }
  return null;
}

function distVsLen(cur, nx) { // sign of (angle from cur.start to nx.start) - cur.len
  const d = mod(nx.af - cur.af);
  if (d > TOL && d < TAU - TOL && Math.abs(d - cur.lenf) > TOL) return d > cur.lenf ? 1 : -1;
  const relD = cmul(nx.start, cconj(cur.start));
  if (ceq(relD, cur.rel)) return 0;
  return angleLess(relD, cur.rel) ? -1 : 1;
}

export function gapsAt(O, Of, key, state) {
  const w = [];
  for (const t of state.tiles) { const x = wedgeAt(t, O, Of); if (x) w.push(x); }
  { const e = state.phantoms.get(key); if (e) for (const x of e.list) w.push(x); }
  if (!w.length) return null;
  w.sort((p, q) => p.af - q.af);
  const gaps = [];
  for (let i = 0; i < w.length; i++) {
    const cur = w[i], nx = w[(i + 1) % w.length];
    let c;
    if (w.length === 1) c = 1; else c = distVsLen(cur, nx);
    if (c < 0) return 'bad';
    if (c > 0) {
      const g = { start: cur.end, end: nx.start, wf: mod(nx.af - cur.ef) };
      if (w.length === 1) g.wf = mod(cur.af - cur.ef);
      gaps.push(g);
    }
  }
  return gaps;
}

function gapAtLeast(g, ang, angf) { // corner angle <= gap width ?
  if (angf < g.wf - TOL) return true;
  if (angf > g.wf + TOL) return false;
  const relW = cmul(g.end, cconj(g.start));
  return angleLessEq(ang, relW);
}
function gapIsStraight(g) { // width >= pi ?
  if (g.wf > PI + TOL) return true;
  if (g.wf < PI - TOL) return false;
  const relW = cmul(g.end, cconj(g.start));
  return !angleLess(relW, C_PI);
}

export function cornerTypes(kinds) {
  const out = [];
  for (const kd of Object.values(kinds)) kd.corners.forEach((c, i) => out.push({ kind: kd, i, ang: c.ang, angf: c.angf }));
  return out;
}

// A phantom wedge stands for a not-yet-placed tile whose edge runs straight through a point.  When a placed tile realises
// exactly that straight wedge, the phantom IS that tile and must be dropped, otherwise the point looks over-covered.
function consumePhantoms(phantoms, tile) {
  let out = phantoms;
  for (const [k, e] of phantoms) {
    const w = wedgeAt(tile, e.O, e.Of);
    if (!w || !ceq(w.end, [w.start[0].neg(), w.start[1].neg()])) continue;
    const keep = e.list.filter((x) => !ceq(x.start, w.start));
    if (keep.length !== e.list.length) { if (out === phantoms) out = new Map(phantoms); out.set(k, { O: e.O, Of: e.Of, list: keep }); }
  }
  return out;
}

export function growLayer(start, inner, kinds, { maxNodes = 2_000_000, allowPhantoms = true } = {}) {
  const types = cornerTypes(kinds);
  const results = [];
  let nodes = 0, truncated = false;
  const onInner = (O, Of) => inner.some((t) => wedgeAt(t, O, Of) !== null);

  function frontier(state) {
    let best = null;
    const seen = new Set();
    for (const t of state.tiles) {
      const X = t.X;
      for (let j = 0; j < X.pts.length; j++) {
        const k = X.vkeys[j];
        if (seen.has(k)) continue;
        seen.add(k);
        const v = X.pts[j], vf = t.fpts[j];
        if (!onInner(v, vf)) continue;
        const g = gapsAt(v, vf, k, state);
        if (g === 'bad') return { bad: true };
        if (!g || !g.length) continue;
        for (const gap of g) if (!best || gap.wf < best.w - 1e-9 || (Math.abs(gap.wf - best.w) < 1e-9 && k < best.k)) best = { O: v, k, gap, w: gap.wf };
      }
    }
    return best;
  }

  function rec(state) {
    if (++nodes > maxNodes) { truncated = true; return; }
    const f = frontier(state);
    if (f && f.bad) return;
    if (!f) { results.push(state); return; }
    const tried = new Set();
    for (const ty of types) {
      if (!gapAtLeast(f.gap, ty.ang, ty.angf)) continue;
      const tile = new Tile(ty.kind, ty.i, f.O, f.gap.start);
      if (state.tiles.some((Y) => interiorsOverlap(tile, Y))) continue;
      if (tried.has(tile.key)) continue; // symmetric tile reached through another corner: same polygon, same state
      tried.add(tile.key);
      rec({ tiles: [...state.tiles, tile], phantoms: consumePhantoms(state.phantoms, tile) });
    }
    if (allowPhantoms && gapIsStraight(f.gap)) {
      const ph = new Map(state.phantoms);
      const g0 = f.gap.start;
      const af = argf(g0);
      const prev = ph.get(f.k);
      ph.set(f.k, { O: f.O, Of: cf(f.O), list: [...(prev ? prev.list : []), { start: g0, end: [g0[0].neg(), g0[1].neg()], af, ef: mod(af + PI), lenf: PI, rel: C_PI }] });
      rec({ tiles: state.tiles, phantoms: ph });
    }
  }
  rec(start);
  return { results, nodes, truncated };
}

export function growCorona(core, kinds, opts = {}) {
  return growLayer({ tiles: [core], phantoms: new Map() }, [core], kinds, opts);
}

export function tileFromPoly(kind, pts) {
  // place the kind's own polygon (corner 0 at pts[0], unrotated)
  return new Tile(kind, 0, pts[0], kind.corners[0].start);
}
