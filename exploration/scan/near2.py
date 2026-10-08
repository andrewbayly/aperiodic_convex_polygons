from nice import *
from math import gcd
t=(1.5/1.23, 1.1/1.23)
res=[]
for b in range(1,161):
    for a in range(int(1.12*b), int(1.33*b)+1):
        for d in range(int(0.72*b), int(1.0*b)+1):
            if gcd(gcd(a,b),d)!=1: continue
            u=l2(Fr(a),Fr(b),Fr(d)); r=sqrt_in_F(u)
            if r is not None:
                dist=((a/b-t[0])**2+(d/b-t[1])**2)**.5
                res.append((dist,a,b,d,r))
res.sort()
for dist,a,b,d,r in res[:20]: print(f"dist {dist:.4f} (a,b,d)=({a},{b},{d})  a/b={a/b:.4f} d/b={d/b:.4f} l={r[0]}+{r[1]}*sqrt3")
print(len(res))
