"""Does the genuine-tiling test (real_tilings.js) detect deliberate faults in the engine?
Same mutations as exact/run_mutations.py; each is applied to a COPY of exact/engine.js and the test is run on a level-3 hat patch.
A mutation that makes the engine lose legal placements must make the test report true coronas that are not survivors."""
import subprocess, os, shutil, tempfile, re, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
src = open(os.path.join(root, 'exact/engine.js')).read()
ns = {}; exec(open(os.path.join(root, 'exact/run_mutations.py')).read().split('ana = open')[0].replace("src = open('engine.js').read()", ""), ns)
MUT = ns['MUT']
subprocess.run(['node', os.path.join(here, 'gen_hat_patch.js'), '3', '/tmp/hp3_mut.json'], check=True, capture_output=True)
for name, edits in MUT.items():
    s = src
    for a, b in edits:
        assert a in s, (name, a); s = s.replace(a, b)
    d = tempfile.mkdtemp()
    shutil.copytree(os.path.join(root, 'exact'), os.path.join(d, 'exact'), ignore=shutil.ignore_patterns('*.json'))
    os.makedirs(os.path.join(d, 'tests')); shutil.copy(os.path.join(here, 'real_tilings.js'), os.path.join(d, 'tests'))
    open(os.path.join(d, 'exact/engine.js'), 'w').write(s)
    env = dict(os.environ, AB='299,240,208')
    try:
        r = subprocess.run(['node', os.path.join(d, 'tests/real_tilings.js'), '/tmp/hp3_mut.json', '100000'], env=env, capture_output=True, text=True, timeout=900)
        out = r.stdout + r.stderr
    except subprocess.TimeoutExpired: out = 'TIMEOUT'
    m = re.search(r'NOT survivors: (\d+)', out); chk = re.search(r'true coronas checked: (\d+)', out); ref = re.findall(r'reference (\w+): (\d+) first coronas, (\d+) survivors', out)
    verdict = 'PASSED' if 'REAL-TILING TEST PASSED' in out else ('FAILED' if 'FAILED' in out else 'ERROR/other')
    print(f'{name:50s} {verdict:12s} true coronas {chk.group(1) if chk else "-"}, not survivors {m.group(1) if m else "-"}; refs {[(k,int(a),int(b)) for k,a,b in ref if k in ("P","H")]}', flush=True)
    if verdict == 'ERROR/other': print('   ', out.strip().splitlines()[-1][:150] if out.strip() else '')
    shutil.rmtree(d)
