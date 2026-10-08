"""Usage: python3 run_cases.py cases.json out.json [maxCoronasToPrune]   (mirror of exact/runcases.js)"""
import sys, json, time
from engine2 import *
from fq3 import *
cases = json.load(open(sys.argv[1])); MAXPRUNE = int(sys.argv[3]) if len(sys.argv) > 3 else 200
def toQ(t):
    n0, n1, d = t
    return Q3(Fr(n0, d), Fr(n1, d))
out = []
for c in cases:
    polys = [[(toQ(x), toQ(y)) for x, y in k['pts']] for k in c['kinds']]
    kinds = [Kind(k['name'], p) for k, p in zip(c['kinds'], polys)]
    for r in c['refs']:
        t0 = time.time()
        res, nodes, trunc = grow([tile_of_poly(kinds[r], polys[r])], [tile_of_poly(kinds[r], polys[r])], kinds, 4000)
        rec = {'case': c['name'], 'ref': r, 'truncated': trunc, 'coronas': [sorted(tile_str(t) for t in st) for st, _ in res], 'survivors': None}
        if not trunc and len(res) <= MAXPRUNE:
            rec['survivors'] = []
            for st, ph in res:
                dead, tr = False, False
                for t in st:
                    x, _, t2 = grow(st, [t], kinds, 3000, phantoms0=ph)
                    if t2: tr = True
                    elif not x: dead = True; break
                if not dead: rec['survivors'].append({'tiles': sorted(tile_str(t) for t in st), 'undecided': tr})
        out.append(rec)
        print(f"{c['name']} ref {r}: {len(res)} coronas{' TRUNC' if trunc else ''}{', ' + str(len(rec['survivors'])) + ' survive' if rec['survivors'] is not None else ''} ({time.time()-t0:.1f}s)", flush=True)
json.dump(out, open(sys.argv[2], 'w'))
