"""Exact arithmetic in Q(sqrt3): elements x + y*sqrt3 with Fraction x, y.  Pure Python, no floats in any decision."""
from fractions import Fraction as Fr
from math import isqrt, sqrt
S3 = sqrt(3.0)

class Q3:
    __slots__ = ('x', 'y', '_f')
    def __init__(s, x=0, y=0): s.x = Fr(x); s.y = Fr(y); s._f = None
    def __add__(s, o): return Q3(s.x + o.x, s.y + o.y)
    def __sub__(s, o): return Q3(s.x - o.x, s.y - o.y)
    def __neg__(s): return Q3(-s.x, -s.y)
    def __mul__(s, o): return Q3(s.x * o.x + 3 * s.y * o.y, s.x * o.y + s.y * o.x)
    def inv(s):
        n = s.x * s.x - 3 * s.y * s.y
        if n == 0: raise ZeroDivisionError
        return Q3(s.x / n, -s.y / n)
    def __truediv__(s, o): return s * o.inv()
    def __eq__(s, o): return s.x == o.x and s.y == o.y
    def __hash__(s): return hash((s.x, s.y))
    def is_zero(s): return s.x == 0 and s.y == 0
    def f(s):
        if s._f is None: s._f = float(s.x) + float(s.y) * S3
        return s._f
    def sign(s):
        x, y = s.x, s.y
        if y == 0: return (x > 0) - (x < 0)
        if x == 0: return (y > 0) - (y < 0)
        if x > 0 and y > 0: return 1
        if x < 0 and y < 0: return -1
        d = x * x - 3 * y * y          # x and y have opposite signs
        v = (d > 0) - (d < 0)
        return v if x > 0 else -v
    def key(s): return (s.x, s.y)
    def canon(s):
        """reduced (n0, n1, d) with value (n0 + n1 sqrt3)/d, gcd(n0,n1,d)=1  (the format shared with the JS dump)"""
        from math import gcd
        d = s.x.denominator * s.y.denominator // gcd(s.x.denominator, s.y.denominator)
        n0, n1 = int(s.x * d), int(s.y * d)
        g = gcd(gcd(abs(n0), abs(n1)), d) or 1
        return (n0 // g, n1 // g, d // g)
    def __repr__(s): return f'({s.x}+{s.y}*s3)'

ZERO, ONE = Q3(0), Q3(1)
def rat(p, q=1): return Q3(Fr(p, q), 0)

def rat_sqrt(q):
    q = Fr(q)
    if q < 0: return None
    n, d = q.numerator, q.denominator
    sn, sd = isqrt(n), isqrt(d)
    return Fr(sn, sd) if sn * sn == n and sd * sd == d else None

def sqrt_q3(u):
    """positive square root of u inside Q(sqrt3), or None."""
    x, y = u.x, u.y
    if y == 0:
        r = rat_sqrt(x)
        if r is not None: return Q3(r, 0)
        r = rat_sqrt(x / 3) if x >= 0 else None
        return Q3(0, r) if r is not None else None
    N = rat_sqrt(x * x - 3 * y * y)
    if N is None: return None
    for s in (N, -N):
        p2 = rat_sqrt((x + s) / 2)
        if p2 is not None and p2 != 0:
            r = Q3(p2, y / (2 * p2))
            return r if r.sign() > 0 else -r
    return None

# ---- complex numbers / vectors over Q(sqrt3): tuples (re, im) ----
def cadd(a, b): return (a[0] + b[0], a[1] + b[1])
def csub(a, b): return (a[0] - b[0], a[1] - b[1])
def cmul(a, b): return (a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0])
def cconj(a): return (a[0], -a[1])
def cneg(a): return (-a[0], -a[1])
def cscale(a, s): return (a[0] * s, a[1] * s)
def cross(a, b): return a[0] * b[1] - a[1] * b[0]
def dot(a, b): return a[0] * b[0] + a[1] * b[1]
def ceq(a, b): return a[0] == b[0] and a[1] == b[1]
def ckey(a): return (a[0].key(), a[1].key())
def cf(a): return (a[0].f(), a[1].f())

def half(z):
    sy = z[1].sign()
    return 0 if sy > 0 or (sy == 0 and z[0].sign() > 0) else 1
def cmpang(a, b):
    """compare the arguments (in [0, 2pi)) of two nonzero vectors: -1, 0, 1  (0 only for same direction)"""
    ha, hb = half(a), half(b)
    if ha != hb: return -1 if ha < hb else 1
    c = cross(a, b).sign()
    return -c   # a before b when cross(a,b) > 0
def unit(v):
    L = sqrt_q3(dot(v, v))
    if L is None: raise ValueError('edge length outside Q(sqrt3): %r' % (dot(v, v),))
    return cscale(v, L.inv())
