import json, sys
J = {(r['case'], r['ref']): r for r in json.load(open(sys.argv[1]))}
P = {(r['case'], r['ref']): r for r in json.load(open(sys.argv[2]))}
same = diff = skipped = 0
for k in J:
    if k not in P: continue
    a, b = J[k], P[k]
    if a['truncated'] or b['truncated']: skipped += 1; continue
    ca = {frozenset(c) for c in a['coronas']}; cb = {frozenset(c) for c in b['coronas']}
    ok = ca == cb and len(a['coronas']) == len(b['coronas'])
    if a['survivors'] is not None and b['survivors'] is not None:
        sa = {frozenset(s['tiles']) for s in a['survivors']}; sb = {frozenset(s['tiles']) for s in b['survivors']}
        ok = ok and sa == sb
    elif (a['survivors'] is None) != (b['survivors'] is None): ok = False
    same += ok; diff += (not ok)
    print(('SAME ' if ok else 'DIFF ') + k[0], 'ref', k[1], len(a['coronas']), len(b['coronas']), None if a['survivors'] is None else (len(a['survivors']), len(b['survivors'] or [])))
print(f'identical: {same}, different: {diff}, skipped (truncated by node cap): {skipped}')
