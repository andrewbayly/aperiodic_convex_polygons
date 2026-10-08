"""Tile(a,b) and its dissection, built independently of the JS code (exact, Q(sqrt3))."""
from fq3 import *
ANG = [90, 240, 90, 240, 90, 120, 180, 120, 270, 120, 90, 120, 270, 120]
SEQ = 'a a b b a a a a b b a a b b'.split()
def dirv(k):   # unit vector at k*30 degrees, exact
    h, s = Fr(1, 2), Q3(0, Fr(1, 2))
    c = [ONE, s, rat(1, 2), ZERO, rat(-1, 2), -s, -ONE, -s, rat(-1, 2), ZERO, rat(1, 2), s]
    sn = [ZERO, rat(1, 2), s, ONE, s, rat(1, 2), ZERO, rat(-1, 2), -s, -ONE, -s, rat(-1, 2)]
    k %= 12
    return (c[k], sn[k])
def reflect(p, A, B):
    v, w = csub(B, A), csub(p, A)
    t = dot(w, v) / dot(v, v)
    pr = cscale(v, t)
    return cadd(A, csub(cadd(pr, pr), w))
def build(a, b, d):
    a, b, d = rat(*a), rat(*b), rat(*d)
    heads, h = [], 0
    for i in range(14):
        heads.append((h % 360) // 30); h += 180 - ANG[(i + 1) % 14]
    V = [(ZERO, ZERO)]
    for i in range(14):
        L = a if SEQ[i] == 'a' else b
        V.append(cadd(V[i], cscale(dirv(heads[i]), L)))
    assert ceq(V[14], V[0]); V.pop()
    P = cadd(V[11], cscale(dirv(heads[11]), d))
    bis = ((heads[1] * 30 + ANG[1] // 2) % 360)
    assert bis % 30 == 0
    Q = cadd(V[1], cscale(dirv(bis // 30), d))
    R = reflect(V[12], V[1], Q)
    S = reflect(Q, V[3], R)
    N = V + [P, Q, R, S]
    idx = dict(A=[0, 1, 15, 12, 13], B=[1, 2, 3, 16, 15], C=[3, 4, 5, 17, 16], D=[8, 9, 10, 11, 14], H=[6, 7, 8, 14, 12, 15, 16, 17])
    def strip(f):
        return [p for i, p in enumerate(f) if cross(csub(p, f[i - 1]), csub(f[(i + 1) % len(f)], p)).sign() != 0]
    pieces = {k: strip([N[i] for i in f]) for k, f in idx.items()}
    return V, pieces
def mirror(poly): return [(-p[0], p[1]) for p in poly][::-1]
