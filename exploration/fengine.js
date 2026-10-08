// Floating-point (tolerance-based) patch-growing engine for convex polygons.
// Same algorithm as engine.js: fill the angular gap at a vertex; the tile next to the gap's first
// ray either has a corner there, or its edge passes through the vertex ("phantom": a 180° wedge
// whose sliding offset is left free). Angles are in radians.
export const TAU = 2 * Math.PI;
export const EPS = 1e-7;
const mod = (x) => ((x % TAU) + TAU) % TAU;
const rkey = (p) => Math.round(p[0] * 1e5) + ',' + Math.round(p[1] * 1e5);

export function makeKind(name, pts) {
  // pts: counter-clockwise, no collinear vertices
  const n = pts.length;
  const corners = pts.map((p, i) => {
    const nx = pts[(i + 1) % n], pv = pts[(i + n - 1) % n];
    const dN = Math.atan2(nx[1] - p[1], nx[0] - p[0]);
    const dP = Math.atan2(pv[1] - p[1], pv[0] - p[0]);
    return { start: mod(dN), angle: mod(dP - dN) };
  });
  return { name, poly: pts, corners };
}

export function makeTile(kindName, pts, corners) {
  const n = pts.length;
  const cs = corners || makeKind(kindName, pts).corners;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return {
    kind: kindName, pts, corners: cs,
    bb: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
    key: pts.map(rkey).sort().join(';'),
  };
}

export function placeTile(kind, i, O, g0) {
  const base = kind.poly[i];
  const delta = g0 - kind.corners[i].start;
  const c = Math.cos(delta), s = Math.sin(delta);
  const pts = kind.poly.map((p) => {
    const x = p[0] - base[0], y = p[1] - base[1];
    return [O[0] + c * x - s * y, O[1] + s * x + c * y];
  });
  return makeTile(kind.name, pts, kind.corners.map((cn) => ({ start: mod(cn.start + delta), angle: cn.angle })));
}

function separates(X, Y) {
  const n = X.pts.length;
  for (let i = 0; i < n; i++) {
    const a = X.pts[i], b = X.pts[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    let all = true;
    for (const v of Y.pts) { if ((dx * (v[1] - a[1]) - dy * (v[0] - a[0])) / L > EPS) { all = false; break; } }
    if (all) return true;
  }
  return false;
}
export function interiorsOverlap(X, Y) {
  const e = EPS;
  if (X.bb[2] < Y.bb[0] + e || Y.bb[2] < X.bb[0] + e || X.bb[3] < Y.bb[1] + e || Y.bb[3] < X.bb[1] + e) return false;
  return !(separates(X, Y) || separates(Y, X));
}

const same = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-7;

export function wedgeAt(tile, O) {
  const n = tile.pts.length;
  for (let j = 0; j < n; j++) if (same(tile.pts[j], O)) return { start: tile.corners[j].start, len: tile.corners[j].angle };
  for (let j = 0; j < n; j++) {
    const a = tile.pts[j], b = tile.pts[(j + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    const cr = (dx * (O[1] - a[1]) - dy * (O[0] - a[0])) / L;
    if (cr < -EPS) return null;
    if (cr <= EPS) {
      const t = ((O[0] - a[0]) * dx + (O[1] - a[1]) * dy) / (L * L);
      return t > 1e-9 && t < 1 - 1e-9 ? { start: tile.corners[j].start, len: Math.PI } : null;
    }
  }
  return null; // strictly inside: impossible for non-overlapping tiles
}

export function gapsAt(O, state) {
  const w = [];
  for (const t of state.tiles) { const x = wedgeAt(t, O); if (x) w.push(x); }
  { const e = state.phantoms.get(rkey(O)); if (e) for (const x of e.list) w.push(x); }
  if (!w.length) return null;
  w.sort((p, q) => mod(p.start) - mod(q.start));
  const gaps = [];
  for (let i = 0; i < w.length; i++) {
    const cur = w[i], nx = w[(i + 1) % w.length];
    const dist = w.length === 1 ? TAU : mod(nx.start - cur.start + EPS) - EPS; // in [-EPS, TAU)
    const d = dist < 0 ? 0 : dist;
    if (d < cur.len - 1e-6) return 'bad';
    if (d > cur.len + 1e-6) gaps.push({ start: mod(cur.start + cur.len), len: d - cur.len });
  }
  return gaps;
}

export function cornerTypes(kinds) {
  const out = [];
  for (const kd of Object.values(kinds)) kd.corners.forEach((c, i) => out.push({ id: `${kd.name}.${i}`, kind: kd.name, i, angle: c.angle }));
  return out;
}

// A phantom stands for a not-yet-placed tile whose edge runs straight through O; a placed tile that realises exactly that
// straight wedge IS the phantom, so drop it (else the branch is wrongly pruned as over-covered).
function consumePhantoms(phantoms, tile) {
  let out = phantoms;
  for (const [k, e] of phantoms) {
    const w = wedgeAt(tile, e.O);
    if (!w || Math.abs(w.len - Math.PI) > 1e-6) continue;
    const keep = e.list.filter((x) => Math.abs(mod(x.start - w.start + Math.PI) - Math.PI) > 1e-6);
    if (keep.length !== e.list.length) { if (out === phantoms) out = new Map(phantoms); out.set(k, { O: e.O, list: keep }); }
  }
  return out;
}

export function growLayer(start, inner, kinds, { maxNodes = 2_000_000, allowPhantoms = true, trace = null } = {}) {
  const types = cornerTypes(kinds);
  const results = [];
  let nodes = 0, truncated = false;
  const onInner = (O) => inner.some((t) => wedgeAt(t, O) !== null);

  function frontier(state) {
    let best = null;
    const seen = new Set();
    for (const t of state.tiles) for (const v of t.pts) {
      const k = rkey(v);
      if (seen.has(k)) continue;
      seen.add(k);
      if (!onInner(v)) continue;
      const g = gapsAt(v, state);
      if (g === 'bad') return { bad: true };
      if (!g || !g.length) continue;
      for (const gap of g) if (!best || gap.len < best.w - 1e-9 || (Math.abs(gap.len - best.w) < 1e-9 && k < best.k)) best = { O: v, k, g0: gap.start, w: gap.len };
    }
    return best;
  }

  function rec(state) {
    if (++nodes > maxNodes) { truncated = true; return; }
    const f = frontier(state);
    if (f && f.bad) return;
    if (!f) { results.push(state); return; }
    for (const ty of types) {
      if (ty.angle > f.w + 1e-6) continue;
      const tile = placeTile(kinds[ty.kind], ty.i, f.O, f.g0);
      if (state.tiles.some((X) => interiorsOverlap(tile, X))) continue;
      rec({ tiles: [...state.tiles, tile], phantoms: consumePhantoms(state.phantoms, tile) });
    }
    if (allowPhantoms && f.w >= Math.PI - 1e-6) {
      const ph = new Map(state.phantoms);
      { const prev = ph.get(f.k); ph.set(f.k, { O: f.O, list: [...(prev ? prev.list : []), { start: f.g0, len: Math.PI }] }); }
      rec({ tiles: state.tiles, phantoms: ph });
    }
  }
  rec(start);
  return { results, nodes, truncated };
}

export function growCorona(core, kinds, opts = {}) {
  return growLayer({ tiles: [core], phantoms: new Map() }, [core], kinds, opts);
}
