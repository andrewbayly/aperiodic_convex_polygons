// Exact patch-growing engine for convex pentagon tilings on the 15° lattice.
//
// A "state" is a set of placed tiles plus "phantoms": at a point O a straight-through tile
// (O inside one of its edges) whose extent along the edge is unknown (a free sliding offset).
// Phantoms occupy a 180° wedge at O only; they are not geometric obstacles anywhere else.
import { pt, padd, psub, cross, dot, peq, pkey, dirIndex, U } from './geom.js';
import { cornerTypes } from './stars.js';

export const rotPt = (p, k) => pt(
  p.x.mul(U[k].x).sub(p.y.mul(U[k].y)),
  p.x.mul(U[k].y).add(p.y.mul(U[k].x)),
);

export function makeTile(kind, pts) {
  const n = pts.length;
  const vinfo = pts.map((p, j) => {
    const dN = dirIndex(psub(pts[(j + 1) % n], p));
    const dP = dirIndex(psub(pts[(j + n - 1) % n], p));
    if (dN < 0 || dP < 0) throw new Error('tile edge off the 15° lattice');
    return { dN, angle: (dP - dN + 24) % 24 };
  });
  const xs = pts.map((p) => p.x.val());
  const ys = pts.map((p) => p.y.val());
  return {
    kind, pts, vinfo,
    bb: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
    key: kind + ':' + pts.map(pkey).sort().join(';'),
  };
}

// Place `kind` so that its corner i is at O and its edge leaving corner i points along U[r].
export function placeTile(kind, i, O, r) {
  const ref = kind.poly;
  const base = ref[i];
  const delta = (r - kind.corners[i].startDir + 24) % 24;
  return makeTile(kind.name, ref.map((p) => padd(O, rotPt(psub(p, base), delta))));
}

function separates(X, Y) {
  const n = X.pts.length;
  for (let i = 0; i < n; i++) {
    const a = X.pts[i];
    const d = psub(X.pts[(i + 1) % n], a);
    if (Y.pts.every((v) => cross(d, psub(v, a)).sign() <= 0)) return true;
  }
  return false;
}

// True iff the interiors of the two convex polygons intersect.
export function interiorsOverlap(X, Y) {
  const e = 1e-9;
  if (X.bb[2] < Y.bb[0] - e || Y.bb[2] < X.bb[0] - e || X.bb[3] < Y.bb[1] - e || Y.bb[3] < X.bb[1] - e) return false;
  return !(separates(X, Y) || separates(Y, X));
}

// The angular wedge a tile occupies around point O: corner, straight (O inside an edge), full, or null.
export function wedgeAt(tile, O) {
  const n = tile.pts.length;
  for (let j = 0; j < n; j++) if (peq(tile.pts[j], O)) return { start: tile.vinfo[j].dN, len: tile.vinfo[j].angle };
  for (let j = 0; j < n; j++) {
    const a = tile.pts[j];
    const b = tile.pts[(j + 1) % n];
    const s = cross(psub(b, a), psub(O, a)).sign();
    if (s < 0) return null;
    if (s === 0) {
      const t1 = dot(psub(O, a), psub(b, a)).sign();
      const t2 = dot(psub(O, b), psub(a, b)).sign();
      return t1 > 0 && t2 > 0 ? { start: tile.vinfo[j].dN, len: 12 } : null;
    }
  }
  return { start: 0, len: 24 };
}

// Gaps in the angular coverage at O, given placed tiles and phantoms. [] means complete.
export function gapsAt(O, state) {
  const wedges = [];
  for (const t of state.tiles) {
    const w = wedgeAt(t, O);
    if (w) wedges.push(w);
  }
  { const e = state.phantoms.get(pkey(O)); if (e) for (const w of e.list) wedges.push(w); }
  if (!wedges.length) return null; // O is not touched at all
  const total = wedges.reduce((s, w) => s + w.len, 0);
  if (total > 24) return 'bad'; // a later tile landed on a phantom's reserved wedge
  if (total === 24 && wedges.length === 1) return [];
  wedges.sort((a, b) => a.start - b.start);
  const gaps = [];
  for (let i = 0; i < wedges.length; i++) {
    const w = wedges[i];
    const nx = wedges[(i + 1) % wedges.length];
    const dist = wedges.length === 1 ? 24 : (((nx.start - w.start) % 24) + 24) % 24;
    if (dist < w.len) return 'bad'; // overlapping wedges
    if (dist > w.len) gaps.push({ start: (w.start + w.len) % 24, len: dist - w.len });
  }
  return gaps;
}

// Enumerate all ways to complete one more layer: every vertex of every placed tile that lies on the
// boundary of an `inner` tile gets a full 360° of coverage, so each inner tile ends up fully surrounded.
// A phantom stands for a not-yet-placed tile whose edge runs straight through O.  When a placed tile realises exactly that
// straight wedge, the phantom IS that tile: drop it (otherwise the point looks over-covered and the branch is wrongly pruned).
function consumePhantoms(phantoms, tile) {
  let out = phantoms;
  for (const [k, e] of phantoms) {
    const w = wedgeAt(tile, e.O);
    if (!w || w.len !== 12) continue;
    const keep = e.list.filter((x) => x.start !== w.start);
    if (keep.length !== e.list.length) { if (out === phantoms) out = new Map(phantoms); out.set(k, { O: e.O, list: keep }); }
  }
  return out;
}

export function growLayer(start, inner, kinds, { maxNodes = 2_000_000, allowPhantoms = true, trace = null } = {}) {
  const types = cornerTypes(kinds);
  const results = [];
  let nodes = 0;
  let truncated = false;

  const onCoreBoundary = (O) => inner.some((t) => wedgeAt(t, O) !== null);

  function pickFrontier(state) {
    let best = null;
    const seen = new Set();
    for (const t of state.tiles) {
      for (const v of t.pts) {
        const k = pkey(v);
        if (seen.has(k)) continue;
        seen.add(k);
        if (!onCoreBoundary(v)) continue;
        const gaps = gapsAt(v, state);
        if (gaps === 'bad') return { bad: true };
        if (!gaps || !gaps.length) continue;
        for (const g of gaps) {
          if (!best || g.len < best.w || (g.len === best.w && k < best.k)) best = { O: v, k, g0: g.start, w: g.len };
        }
      }
    }
    return best;
  }

  function rec(state) {
    if (++nodes > maxNodes) { truncated = true; return; }
    const f = pickFrontier(state);
    if (f && f.bad) return; // inconsistent: prune
    if (!f) { results.push(state); return; }
    const log = [];
    for (const ty of types) {
      if (ty.angle > f.w) continue;
      const tile = placeTile(kinds[ty.kind], ty.i, f.O, f.g0);
      const hit = state.tiles.findIndex((X) => interiorsOverlap(tile, X));
      if (hit >= 0) { if (trace) log.push(`${ty.id} overlaps tile #${hit}`); continue; }
      if (trace) log.push(`${ty.id} OK`);
      rec({ tiles: [...state.tiles, tile], phantoms: consumePhantoms(state.phantoms, tile) });
    }
    if (trace) trace(state, f, log);
    if (allowPhantoms && f.w >= 12) {
      const ph = new Map(state.phantoms);
      { const prev = ph.get(f.k); ph.set(f.k, { O: f.O, list: [...(prev ? prev.list : []), { start: f.g0, len: 12 }] }); }
      rec({ tiles: state.tiles, phantoms: ph });
    }
  }

  rec(start);
  return { results, nodes, truncated };
}

// First corona of a fixed tile.
export function growCorona(core, kinds, opts = {}) {
  return growLayer({ tiles: [core], phantoms: new Map() }, [core], kinds, opts);
}
