"""Second, independently written corona engine (Python, exact Q(sqrt3)).
Differences from the JS engine: language and number types; polygon-overlap test by exact Sutherland-Hodgman clipping
(positive clipped area) instead of a separating-axis test; open vertex chosen lexicographically (lowest y, then x) and the
first gap there, instead of the smallest gap anywhere; no floating point in any accept decision (floats only reject
clearly separated tiles, with a 1e-7 margin).
SPEC (same as the JS engine): a *corona* of a core tile is a set of tiles (from the given kinds) with disjoint interiors in
which every vertex of every tile that lies on the core's boundary has total angle exactly 2pi around it.  A tile may have a
vertex lying in the interior of another tile's edge ('phantom' sliding)."""
import math
from functools import cmp_to_key
from fq3 import *

TOL = 1e-7
NEG1 = (Q3(-1), ZERO)

class Kind:
    def __init__(s, name, pts):
        s.name, s.pts, s.n = name, pts, len(pts)
        n = s.n
        u = [unit(csub(pts[(j + 1) % n], pts[j])) for j in range(n)]
        s.u = u
        s.corners = []
        for j in range(n):
            start, end = u[j], cneg(u[(j - 1) % n])
            C = cmul(end, cconj(start))
            if C[1].sign() <= 0: raise ValueError(f'kind {name}: corner {j} not convex or not CCW')
            s.corners.append((start, end, C))
        s.fpts = [cf(p) for p in pts]

class Tile:
    __slots__ = ('kind', 'i', 'O', 'g0', 'fpts', 'bb', '_X')
    def __init__(s, kind, i, O, g0):
        s.kind, s.i, s.O, s.g0 = kind, i, O, g0
        gf, sf = cf(g0), cf(kind.corners[i][0])
        # float rotation g0 * conj(start_i)
        c, sn = gf[0] * sf[0] + gf[1] * sf[1], gf[1] * sf[0] - gf[0] * sf[1]
        Of, b = cf(O), kind.fpts[i]
        s.fpts = [(Of[0] + c * (p[0] - b[0]) - sn * (p[1] - b[1]), Of[1] + sn * (p[0] - b[0]) + c * (p[1] - b[1])) for p in kind.fpts]
        xs, ys = [p[0] for p in s.fpts], [p[1] for p in s.fpts]
        s.bb = (min(xs), min(ys), max(xs), max(ys))
        s._X = None
    @property
    def X(s):
        if s._X is None:
            k = s.kind
            rot = cmul(s.g0, cconj(k.corners[s.i][0]))
            base = k.pts[s.i]
            pts = [cadd(s.O, cmul(rot, csub(p, base))) for p in k.pts]
            wed = [(cmul(rot, c[0]), cmul(rot, c[1]), c[2]) for c in k.corners]
            s._X = (pts, wed, tuple(sorted(ckey(p) for p in pts)))
        return s._X
    @property
    def pts(s): return s.X[0]
    @property
    def key(s): return s.X[2]

def tile_of_poly(kind, pts):
    return Tile(kind, 0, pts[0], kind.corners[0][0])

# ---------- overlap: exact clipping ----------
def float_separated(A, B):
    for X, Y in ((A, B), (B, A)):
        n = len(X.fpts)
        for j in range(n):
            a, b = X.fpts[j], X.fpts[(j + 1) % n]
            dx, dy = b[0] - a[0], b[1] - a[1]
            L = math.hypot(dx, dy)
            if all((dx * (v[1] - a[1]) - dy * (v[0] - a[0])) / L < -TOL for v in Y.fpts): return True
    return False

def clip(poly, a, b):
    e = csub(b, a)
    cs = [cross(e, csub(p, a)) for p in poly]
    sg = [c.sign() for c in cs]
    out = []
    n = len(poly)
    for i in range(n):
        j = (i + 1) % n
        if sg[i] >= 0: out.append(poly[i])
        if sg[i] * sg[j] < 0:
            t = cs[i] * (cs[i] - cs[j]).inv()
            out.append(cadd(poly[i], cscale(csub(poly[j], poly[i]), t)))
    return out

def overlap(A, B):
    """True iff interiors of the two convex polygons intersect."""
    if A.bb[2] <= B.bb[0] - TOL or B.bb[2] <= A.bb[0] - TOL or A.bb[3] <= B.bb[1] - TOL or B.bb[3] <= A.bb[1] - TOL: return False
    if float_separated(A, B): return False
    P, Q = A.pts, B.pts
    poly = P
    for j in range(len(Q)):
        poly = clip(poly, Q[j], Q[(j + 1) % len(Q)])
        if len(poly) < 3: return False
    area2 = ZERO
    for i in range(len(poly)):
        area2 = area2 + cross(poly[i], poly[(i + 1) % len(poly)])
    return area2.sign() > 0

# ---------- angular state at a point ----------
def wedge_at(t, O, Of):
    bx = t.bb
    if Of[0] < bx[0] - TOL or Of[0] > bx[2] + TOL or Of[1] < bx[1] - TOL or Of[1] > bx[3] + TOL: return None
    pts, wed, _ = t.X
    n = len(pts)
    for j in range(n):
        if ceq(pts[j], O): return (wed[j][0], wed[j][1])
    for j in range(n):
        e = csub(pts[(j + 1) % n], pts[j]); w = csub(O, pts[j])
        sg = cross(e, w).sign()
        if sg < 0: return None
        if sg == 0:
            if dot(w, e).sign() > 0 and (dot(w, e) - dot(e, e)).sign() < 0:
                return (wed[j][0], cneg(wed[j][0]))
            return None
    return None

def gaps_at(O, Of, okey, tiles, phantoms):
    """None if no wedge at O, 'bad' on overlap, else a list of gaps (start_dir, end_dir, width_vector)."""
    W = []
    for t in tiles:
        x = wedge_at(t, O, Of)
        if x: W.append(x)
    if okey in phantoms: W += phantoms[okey][2]
    if not W: return None
    W.sort(key=cmp_to_key(lambda p, q: cmpang(p[0], q[0])))
    gaps = []
    for i in range(len(W)):
        cur, nx = W[i], W[(i + 1) % len(W)]
        if len(W) == 1:
            gaps.append((cur[1], cur[0], cmul(cur[0], cconj(cur[1]))))
            continue
        D = cmul(nx[0], cconj(cur[0]))      # angle from cur.start to nx.start (0 if equal)
        Lv = cmul(cur[1], cconj(cur[0]))    # wedge length
        c = cmpang(D, Lv) if not ceq(D, Lv) else 0
        if c < 0: return 'bad'
        if c > 0: gaps.append((cur[1], nx[0], cmul(nx[0], cconj(cur[1]))))
    return gaps

def lex_less(P, Q):
    d = P[1] - Q[1]
    s = d.sign()
    if s: return s < 0
    return (P[0] - Q[0]).sign() < 0

def corner_types(kinds):
    return [(k, i, k.corners[i][2]) for k in kinds for i in range(k.n)]

def grow(tiles0, inner, kinds, max_nodes=2_000_000, phantoms0=None, trace=None):
    types = corner_types(kinds)
    results, nodes, trunc = [], [0], [False]
    on_inner = lambda O, Of: any(wedge_at(t, O, Of) is not None for t in inner)

    def frontier(tiles, ph):
        best = None
        seen = set()
        for t in tiles:
            pts = t.pts
            for p in pts:
                k = ckey(p)
                if k in seen: continue
                seen.add(k)
                pf = cf(p)
                if not on_inner(p, pf): continue
                g = gaps_at(p, pf, k, tiles, ph)
                if g == 'bad': return 'bad'
                if not g: continue
                if best is None or lex_less(p, best[0]): best = (p, k, g[0])
        return best

    def consume(ph, tile):
        # a phantom wedge stands for a not-yet-placed tile whose edge runs through a point; when a placed tile
        # realises exactly that straight wedge, the phantom is that tile and must be dropped (else double counted)
        out = ph
        for k, (O, Of, ws) in ph.items():
            w = wedge_at(tile, O, Of)
            if w is None or not ceq(w[1], cneg(w[0])): continue
            keep = [x for x in ws if not ceq(x[0], w[0])]
            if len(keep) != len(ws):
                if out is ph: out = dict(ph)
                out[k] = (O, Of, keep)
        return out

    def rec(tiles, ph):
        nodes[0] += 1
        if nodes[0] > max_nodes: trunc[0] = True; return
        f = frontier(tiles, ph)
        if trace is not None and len(tiles) >= len(trace.get('t', [])): trace['t'] = tiles; trace['f'] = f; trace['ph'] = ph
        if f == 'bad': return
        if f is None: results.append((tiles, ph)); return
        O, k, (g0, g1, Wv) = f
        tried = set()
        for (kd, i, C) in types:
            if cmpang(C, Wv) > 0: continue        # corner angle must not exceed gap width
            tile = Tile(kd, i, O, g0)
            if any(overlap(tile, T) for T in tiles): continue
            if tile.key in tried: continue        # symmetric tile: same polygon reached via another corner
            tried.add(tile.key)
            rec(tiles + [tile], consume(ph, tile))
        if cmpang(Wv, NEG1) >= 0 or ceq(Wv, NEG1):   # gap >= pi: a tile edge may run through O
            ph2 = dict(ph)
            ph2[k] = (O, cf(O), (ph[k][2] if k in ph else []) + [(g0, cneg(g0))])
            rec(tiles, ph2)
    rec(list(tiles0), phantoms0 or {})
    return results, nodes[0], trunc[0]

def grow_corona(core, kinds, max_nodes=2_000_000):
    return grow([core], [core], kinds, max_nodes)

def tile_str(t):
    return ';'.join(sorted('%d+%ds/%d,%d+%ds/%d' % (*p[0].canon()[:2], p[0].canon()[2], *p[1].canon()[:2], p[1].canon()[2]) for p in t.pts))
