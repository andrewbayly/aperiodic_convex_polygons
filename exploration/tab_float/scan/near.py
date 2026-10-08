from nice import *
from math import gcd
t=(1.5/1.23, 1.1/1.23)  # target (a/b, d/b)
res=[]
seen=set()
for q in range(1,41):
    for pa in range(int(1.1*q), int(1.4*q)+2):
        a=Fr(pa,q)
        if a in seen: continue
        seen.add(a)
        for q2 in range(1,41):
            for pd in range(int(0.7*q2), int(1.1*q2)+2):
                d=Fr(pd,q2)
                if abs(float(a)-t[0])>0.08 or abs(float(d)-t[1])>0.12: continue
                u=l2(a,Fr(1),d); r=sqrt_in_F(u)
                if r is not None:
                    dist=((float(a)-t[0])**2+(float(d)-t[1])**2)**.5
                    res.append((dist,a,d,r))
res=sorted(set((round(x[0],6),x[1],x[2],x[3]) for x in res))
for dist,a,d,r in res[:25]:
    L=(a.denominator*d.denominator)//gcd(a.denominator,d.denominator)
    print(f"dist {dist:.4f}  a/b={a} d/b={d}  ints (a,b,d)=({a*L},{L},{d*L})  l={r}")
print(len(res))
