import json, sys
js = json.load(open(sys.argv[1])); py = json.load(open(sys.argv[2]))
for key in ('coronas', 'survivors'):
    J = {frozenset(c) for c in js[key]}; P = {frozenset(c) for c in py[key]}
    print(f'{key}: JS {len(js[key])} ({len(J)} distinct), Python {len(py[key])} ({len(P)} distinct); identical sets: {J == P}')
