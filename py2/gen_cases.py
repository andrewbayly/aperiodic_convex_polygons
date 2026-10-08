"""Generate known-answer / differential test cases (all coordinates in Q(sqrt3)). Output cases.json.
Coordinates are serialised as [n0, n1, d] meaning (n0 + n1*sqrt3)/d."""
import json, random
from fq3 import *
from engine2 import clip
random.seed(20261007)
def P(x, y=ZERO): return (x, y)
def can(p): return [list(p[0].canon()), list(p[1].canon())]
def mirror(poly): return [(-p[0], p[1]) for p in poly][::-1]
def area2(poly): 
    s = ZERO
    for i in range(len(poly)): s = s + cross(poly[i], poly[(i + 1) % len(poly)])
    return s
S = Q3(0, Fr(1, 2))   # sqrt3/2
DIR = [(ONE, ZERO), (S, rat(1, 2)), (rat(1, 2), S), (ZERO, ONE), (rat(-1, 2), S), (-S, rat(1, 2))]
DIR += [(-a, -b) for a, b in DIR]          # 12 directions, multiples of 30 degrees
def from_edges(vecs):
    pts, cur = [], (ZERO, ZERO)
    for v in vecs: pts.append(cur); cur = cadd(cur, v)
    assert ceq(cur, (ZERO, ZERO)); return pts
def clip_poly(poly, a, b):    # keep left of a->b
    return clip(poly, a, b)
def strip(poly):
    return [p for i, p in enumerate(poly) if cross(csub(p, poly[i - 1]), csub(poly[(i + 1) % len(poly)], p)).sign() != 0]
def valid(poly):
    if len(poly) < 3 or area2(poly).sign() <= 0: return False
    n = len(poly)
    return all(cross(csub(poly[(i + 1) % n], poly[i]), csub(poly[(i + 2) % n], poly[(i + 1) % n])).sign() > 0 for i in range(n))
cases = []
def add(name, polys, refs=None, mirrors=True):
    kinds = []
    for i, p in enumerate(polys):
        kinds.append({'name': f'k{i}', 'pts': [can(q) for q in p]})
        if mirrors: kinds.append({'name': f'k{i}m', 'pts': [can(q) for q in mirror(p)]})
    cases.append({'name': name, 'kinds': kinds, 'refs': refs if refs is not None else list(range(0, len(kinds), 2 if mirrors else 1))})
h = rat(1, 2)
add('regular hexagon (expect 1 corona)', [from_edges([DIR[k] for k in (0, 2, 4, 6, 8, 10)])], mirrors=False)
add('unit square', [from_edges([DIR[0], DIR[3], DIR[6], DIR[9]])], mirrors=False)
add('rectangle 2x1', [from_edges([cscale(DIR[0], rat(2)), DIR[3], cscale(DIR[6], rat(2)), DIR[9]])], mirrors=False)
add('equilateral triangle', [from_edges([DIR[0], DIR[4], DIR[8]])], mirrors=False)
add('30-60-90 triangle (+mirror)', [from_edges([cscale(DIR[0], rat(1)), cscale(DIR[3], Q3(0, 1)), cscale(DIR[8], rat(2))])])
add('trapezoid 2,1,1,1', [[(ZERO, ZERO), (rat(2), ZERO), (rat(3, 2), S), (rat(1, 2), S)]])
add('regular dodecagon (expect 0)', [from_edges([DIR[k] for k in range(12)])], mirrors=False)
add('square + triangle', [from_edges([DIR[0], DIR[3], DIR[6], DIR[9]]), from_edges([DIR[0], DIR[4], DIR[8]])], mirrors=False)
# random zonogon hexagons / parallelograms
for t in range(4):
    ks = sorted(random.sample(range(6), 3))
    ls = [rat(random.choice([1, 2, 3]), random.choice([1, 2])) for _ in ks]
    vs = [cscale(DIR[k], l) for k, l in zip(ks, ls)]
    add(f'random zonogon hexagon {t}', [from_edges(vs + [cneg(v) for v in vs])])
for t in range(3):
    ks = sorted(random.sample(range(6), 2))
    ls = [rat(random.choice([1, 2, 3]), random.choice([1, 2])) for _ in ks]
    vs = [cscale(DIR[k], l) for k, l in zip(ks, ls)]
    add(f'random parallelogram {t}', [from_edges(vs + [cneg(v) for v in vs])])
# random cuts of convex tiles into two pieces: the pieces certainly tile together
def cut_cases(base, tag, n):
    cnt = 0; tries = 0
    while cnt < n and tries < 200:
        tries += 1
        k = random.randrange(12)
        a = base[random.randrange(len(base))]
        # a random point on the boundary: a vertex or an edge midpoint, plus direction k
        i = random.randrange(len(base)); m = cscale(cadd(base[i], base[(i + 1) % len(base)]), rat(1, 2))
        a = random.choice([base[i], m]); b = cadd(a, DIR[k])
        L, Rr = clip(base, a, b), clip(base, b, a)
        L, Rr = strip(L), strip(Rr)
        if valid(L) and valid(Rr) and len(L) >= 3 and len(Rr) >= 3 and not (len(L) > 7 or len(Rr) > 7):
            add(f'cut of {tag} #{cnt}', [L, Rr]); cnt += 1
hexa = from_edges([DIR[k] for k in (0, 2, 4, 6, 8, 10)])
cut_cases(hexa, 'regular hexagon', 4)
cut_cases(from_edges([cscale(DIR[0], rat(2)), cscale(DIR[3], rat(1)), cscale(DIR[6], rat(2)), cscale(DIR[9], rat(1))]), '2x1 rectangle', 4)
cut_cases(from_edges([cscale(DIR[0], rat(2)), DIR[2], cscale(DIR[6], rat(2)), DIR[8]]), 'parallelogram 2x1 (60 deg)', 4)
cut_cases(from_edges([cscale(DIR[0], rat(2)), cscale(DIR[4], rat(2)), cscale(DIR[8], rat(2))]), 'triangle side 2', 3)
json.dump(cases, open('cases.json', 'w'))
print(len(cases), 'cases;', sum(len(c['kinds']) for c in cases), 'kinds')
