import numpy as np, sys
from math import sqrt, pi, cos, sin, gcd
from nice import l2, sqrt_in_F, Fr
ANG=[90,240,90,240,90,120,180,120,270,120,90,120,270,120]
SEQ='a a b b a a a a b b a a b b'.split()
heads=[];h=0
for i in range(14): heads.append(h%360); h+=180-ANG[(i+1)%14]
def vec(i): t=heads[i]*pi/180; return np.array([cos(t),sin(t)])
A1=sum(vec(i) for i in range(1,12) if SEQ[i]=='a'); B1=sum(vec(i) for i in range(1,12) if SEQ[i]=='b')
ub=(heads[1]+120)*pi/180; u=np.array([cos(ub),sin(ub)])
target=(1.5/1.23,1.1/1.23); rad=float(sys.argv[2]) if len(sys.argv)>2 else 0.06
Bmax=int(sys.argv[1]) if len(sys.argv)>1 else 300
s3=sqrt(3); found=[]
for b in range(1,Bmax+1):
    a=np.arange(int((target[0]-rad)*b),int((target[0]+rad)*b)+2)
    d=np.arange(int((target[1]-rad)*b),int((target[1]+rad)*b)+2)
    if len(a)==0 or len(d)==0: continue
    Av,Dv=np.meshgrid(a,d,indexing='ij')
    W=Av[...,None]*A1+b*B1  # V12 - V1 (nominal)
    W=np.stack([Av*A1[0]+b*B1[0],Av*A1[1]+b*B1[1]],-1)
    l2f=Dv**2 - 2*Dv*(W@u) + (W**2).sum(-1)
    L=np.sqrt(np.maximum(l2f,0))
    for k in (1,2,4):
        Qs=np.arange(-6*b*k-6,6*b*k+7)
        # k*L - Q*s3 near integer
        R=(k*L)[...,None]-Qs*s3
        ok=np.abs(R-np.round(R))<1e-7
        idx=np.argwhere(ok.any(-1))
        for i,j in idx:
            aa,dd=int(a[i]),int(d[j])
            if gcd(gcd(aa,b),dd)!=1: continue
            if abs(aa/b-target[0])>rad or abs(dd/b-target[1])>rad: continue
            r=sqrt_in_F(l2(Fr(aa),Fr(b),Fr(dd)))
            if r is not None: found.append((((aa/b-target[0])**2+(dd/b-target[1])**2)**.5,aa,b,dd))
found=sorted(set(found))
for f in found[:15]: print("dist %.4f (a,b,d)=(%d,%d,%d) a/b=%.4f d/b=%.4f"%(f[0],f[1],f[2],f[3],f[1]/f[2],f[3]/f[2]))
print(len(found))
