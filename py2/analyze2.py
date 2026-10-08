"""Usage: python3 analyze2.py H|P a,b,d [budget]   (a,b,d integers or p/q).  Mirrors exact/analyze.js using engine2."""
import sys, json, time
from multiprocessing import Pool
from engine2 import *
from ab2 import build, mirror
mode = sys.argv[1]
par = [tuple(int(z) for z in t.split('/')) for t in sys.argv[2].split(',')]
budget = int(sys.argv[3]) if len(sys.argv) > 3 else 30000
V, pieces = build(*[(p[0], p[1] if len(p) > 1 else 1) for p in par])
for k, p in pieces.items(): assert all(Kind('t', p) for _ in [0])
kinds = {'P': Kind('P', pieces['A']), 'Pb': Kind('Pb', mirror(pieces['A'])), 'H': Kind('H', pieces['H']), 'Hb': Kind('Hb', mirror(pieces['H']))}
KL = list(kinds.values())
kind_of = {'A': 'P', 'B': 'Pb', 'C': 'P', 'D': 'P', 'H': 'H'}
tiles = {k: tile_of_poly(Kind(kind_of[k], pieces[k]), pieces[k]) for k in pieces}
def polykey(pts): return tuple(sorted(ckey(p) for p in pts))
def congruence(src, dst):
    n = len(src)
    if len(dst) != n: return None
    for s in range(n):
        a0, a1, b0, b1 = src[0], src[1], dst[s], dst[(s + 1) % n]
        ea, eb = csub(a1, a0), csub(b1, b0)
        if dot(ea, ea) != dot(eb, eb): continue
        rot = cmul(unit(eb), cconj(unit(ea)))
        g = lambda p: cadd(b0, cmul(rot, csub(p, a0)))
        if all(ceq(g(p), dst[(s + i) % n]) for i, p in enumerate(src)): return g
    return None
ref = tiles['H' if mode == 'H' else 'A']
roles = {}
if mode == 'H': roles['cluster'] = [tiles[k].key for k in 'ABCD']
else:
    for mn, m in (('orig', lambda p: p), ('mirr', mirror)):
        for X in 'ABCD':
            g = congruence(m(pieces[X]), ref.pts)
            if g: roles[f'{mn}:{X}'] = [polykey([g(p) for p in m(pieces['H'])])]
print('roles:', ', '.join(roles))

def prune(item):
    st, ph = item
    trunc = False
    for t in st:
        res, nodes, tr = grow(st, [t], KL, budget, phantoms0=ph)
        if tr: trunc = True
        elif not res: return ('dead', st)
    return ('undecided' if trunc else 'alive', st)

if __name__ == '__main__':
    t0 = time.time()
    seeds, nodes, tr = grow_corona(ref, KL)
    seeds_t=[s for s,_ in seeds]; print(f'reference {mode}: {len(seeds)} first coronas ({nodes} nodes{", TRUNCATED" if tr else ""})  {time.time()-t0:.0f}s', flush=True)
    with Pool(2) as pool: out = pool.map(prune, seeds, chunksize=4)
    tally, dead, alive, und = {}, 0, 0, 0
    surv = []
    for status, st in out:
        if status == 'dead': dead += 1; continue
        alive += status == 'alive'; und += status == 'undecided'
        have = {t.key for t in st}
        hit = [r for r, ks in roles.items() if all(k in have for k in ks)]
        tag = ('+'.join(hit) or 'none') + (' (budget hit)' if status == 'undecided' else '')
        tally[tag] = tally.get(tag, 0) + 1
        surv.append(st)
    print(f'dead {dead}, alive {alive}, undecided {und}   {time.time()-t0:.0f}s')
    for k, v in sorted(tally.items()): print(f'  {k}: {v}')
    json.dump({'coronas': [sorted(tile_str(t) for t in st) for st, _ in seeds], 'survivors': [sorted(tile_str(t) for t in st) for st in surv]},
              open(f'py_{mode}_{sys.argv[2].replace("/", "_")}.json', 'w'))
