import subprocess, re, os
src = open('engine.js').read()
MUT = {
 'baseline (no change)': [],
 'no phantoms': [("if (allowPhantoms && gapIsStraight(f.gap))", "if (false && gapIsStraight(f.gap))")],
 'phantom never consumed (the original bug)': [("phantoms: consumePhantoms(state.phantoms, tile)", "phantoms: state.phantoms")],
 'drop corner 0 of every kind': [("kd.corners.forEach((c, i) => out.push(", "kd.corners.forEach((c, i) => i !== 0 && out.push(")],
 'overlap test always false': [("if (state.tiles.some((Y) => interiorsOverlap(tile, Y))) continue;", "")],
 'corner must be strictly narrower than gap': [("return angleLessEq(ang, relW);", "return angleLess(ang, relW);"), ("if (angf < g.wf - TOL) return true;", "if (angf < g.wf - TOL) return true; if (Math.abs(angf - g.wf) <= TOL) return false;")],
 'overlapping wedges not detected': [("if (c < 0) return 'bad';", "if (c < 0) c = 0;")],
 'phantoms only for gaps > pi + 0.5 rad': [("if (g.wf > PI + TOL) return true;", "if (g.wf > PI + 0.5) return true; return false;")],
}
ana = open('analyze.js').read(); mono = open('mono.js').read()
for name, edits in MUT.items():
    s = src
    for a, b in edits:
        assert a in s, (name, a)
        s = s.replace(a, b)
    open('engine_mut.js', 'w').write(s)
    open('analyze_mut.js', 'w').write(ana.replace("'./engine.js'", "'./engine_mut.js'"))
    open('mono_mut.js', 'w').write(mono.replace("'./engine.js'", "'./engine_mut.js'"))
    env = dict(os.environ, AB='299,240,208')
    res = []
    for mode in 'HP':
        try: out = subprocess.run(['node', 'analyze_mut.js', mode], env=env, capture_output=True, text=True, timeout=300).stdout
        except subprocess.TimeoutExpired: out = 'TIMEOUT'
        m = re.search(r'(\d+) first coronas', out); d = re.search(r'dead (\d+), alive (\d+)', out)
        res.append(f"{mode}: {m.group(1) if m else '?'} coronas, {d.group(2) if d else '?'} survive")
    try: mo = subprocess.run(['node', 'mono_mut.js'], env=env, capture_output=True, text=True, timeout=300).stdout.split('\n')
    except subprocess.TimeoutExpired: mo = ['TIMEOUT']
    res.append('; '.join(re.findall(r'first coronas: (\d+)', ' '.join(mo))))
    print(f"{name:48s} | {res[0]:24s} | {res[1]:26s} | mono P,H: {res[2]}", flush=True)
for f in ('engine_mut.js', 'analyze_mut.js', 'mono_mut.js'): os.remove(f)
