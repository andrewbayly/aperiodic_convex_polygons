from fractions import Fraction as Fr
from math import isqrt, sqrt
import itertools, sys
# Q(sqrt3) elements as (x,y)
def add(u,v): return (u[0]+v[0],u[1]+v[1])
def sub(u,v): return (u[0]-v[0],u[1]-v[1])
def mul(u,v): return (u[0]*v[0]+3*u[1]*v[1],u[0]*v[1]+u[1]*v[0])
def sc(u,r): return (u[0]*r,u[1]*r)
def inv(u):
    n=u[0]*u[0]-3*u[1]*u[1]; return (u[0]/n,-u[1]/n)
h=Fr(1,2)
c30=[(Fr(1),Fr(0)),(Fr(0),h),(h,Fr(0)),(Fr(0),Fr(0)),(-h,Fr(0)),(Fr(0),-h),(Fr(-1),Fr(0)),(Fr(0),-h),(-h,Fr(0)),(Fr(0),Fr(0)),(h,Fr(0)),(Fr(0),h)]
s30=[(Fr(0),Fr(0)),(h,Fr(0)),(Fr(0),h),(Fr(1),Fr(0)),(Fr(0),h),(h,Fr(0)),(Fr(0),Fr(0)),(-h,Fr(0)),(Fr(0),-h),(Fr(-1),Fr(0)),(Fr(0),-h),(-h,Fr(0))]
def dr(deg): k=(deg//30)%12; return (c30[k],s30[k])
ANG=[90,240,90,240,90,120,180,120,270,120,90,120,270,120]
SEQ='a a b b a a a a b b a a b b'.split()
heads=[];hh=0
for i in range(14): heads.append(hh%360); hh+=180-ANG[(i+1)%14]
def vsub(p,q): return (sub(p[0],q[0]),sub(p[1],q[1]))
def vadd(p,q): return (add(p[0],q[0]),add(p[1],q[1]))
def dot(p,q): return add(mul(p[0],q[0]),mul(p[1],q[1]))
def reflect(p,A,B):
    v=vsub(B,A); w=vsub(p,A); t=mul(dot(w,v),inv(dot(v,v)))
    pr=(mul(v[0],t),mul(v[1],t)); return vadd(A,vsub(vadd(pr,pr),w))
def l2(a,b,d):
    V=[((Fr(0),Fr(0)),(Fr(0),Fr(0)))]
    for i in range(14):
        c,s=dr(heads[i]); L=a if SEQ[i]=='a' else b
        V.append(vadd(V[i],(sc(c,L),sc(s,L))))
    assert V[14]==V[0]
    bis=dr((heads[1]+ANG[1]//2)%360)
    Q=vadd(V[1],(sc(bis[0],d),sc(bis[1],d)))
    w=vsub(Q,V[12]); return dot(w,w)
def issq_rat(q): 
    q=Fr(q)
    if q<0: return None
    n,d=q.numerator,q.denominator; sn,sd=isqrt(n),isqrt(d)
    return Fr(sn,sd) if sn*sn==n and sd*sd==d else None
def sqrt_in_F(u):
    x,y=u
    if y==0:
        r=issq_rat(x)
        if r is not None: return (r,Fr(0))
        r=issq_rat(x/3)
        if r is not None: return (Fr(0),r)
        return None
    N=issq_rat(x*x-3*y*y)
    if N is None: return None
    for s in (N,-N):
        p2=issq_rat((x+s)/2)
        if p2 is not None and p2!=0: return (p2,y/(2*p2))
    return None
if __name__=='__main__':
    print(l2(Fr(97,50),Fr(4,5),Fr(1,5)))
    res=[]
    dens=range(1,13)
    As=sorted({Fr(p,q) for q in dens for p in range(1,4*q+1) if 1.3<=p/q<=3.3})
    Ds=sorted({Fr(p,q) for q in dens for p in range(1,q+1) if 0.05<=p/q<=0.5})
    for a in As:
        for d in Ds:
            u=l2(a,Fr(1),d); r=sqrt_in_F(u)
            if r is not None: res.append((a,d,u,r))
    print(len(As)*len(Ds),'points tested,',len(res),'with l in Q(sqrt3)')
    for a,d,u,r in res[:60]: print(a,d,'l=',r, float(r[0])+float(r[1])*sqrt(3), 'l^2=',u)
    import json; json.dump([(str(a),str(d),float(a),float(d)) for a,d,u,r in res],open('nice.json','w'))
