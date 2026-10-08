#!/usr/bin/env bash
# Reproduces the computer-assisted part of the aperiodicity argument for Q = Tile(299,240,208).
# Usage: ./verify.sh          (core: exact JS engine, 4 reference tiles, + independent Python engine and comparison)
#        ./verify.sh --full   (also: 8 mutation tests and the 30-case JS/Python differential test; slower)
# Needs: node >= 18, python3 (standard library only).
set -euo pipefail
cd "$(dirname "$0")"
export AB=299,240,208
mkdir -p out
fail=0
check() { # name, file, expected-substring...
  local name=$1 file=$2; shift 2
  for pat in "$@"; do grep -qF -- "$pat" "$file" || { echo "FAIL [$name]: missing '$pat'"; fail=1; }; done
}
echo "== exact JS engine =="
for m in H P Hb Pb; do node exact/analyze.js $m > out/js_$m.txt; done
for m in H Hb; do check T0-$m out/js_$m.txt "18 first coronas" "dead 16, alive 2, undecided 0" "cluster: 2"; done
for m in P Pb; do check T1-$m out/js_$m.txt "368 first coronas" "dead 343, alive 25, undecided 0" "orig:A: 5" "orig:C: 11" "orig:D: 4" "mirr:B: 5"; done
grep -h "reference\|dead" out/js_*.txt
echo "== independent Python engine (exact Fractions in Q(sqrt3)) =="
node exact/dump.js H out/js_H.json; node exact/dump.js P out/js_P.json
( cd out && for m in H P; do python3 ../py2/analyze2.py $m 299,240,208 > py_$m.txt; mv py_${m}_299_240_208.json py_$m.json 2>/dev/null || true; done )
ls out >/dev/null
for m in H P; do
  [ -f out/py_$m.json ] || [ -f out/py_${m}_299,240,208.json ] || { echo "no python output for $m"; fail=1; }
done
echo "(note: the dump formats of the two engines are compared by py2/compare_ab.py)"
for m in H P; do
  f=out/py_$m.json; [ -f "$f" ] || f="out/py_${m}_299,240,208.json"
  python3 py2/compare_ab.py out/js_$m.json "$f" | tee out/cmp_$m.txt
  check cmp-$m out/cmp_$m.txt "identical sets: True"
  grep -c "identical sets: True" out/cmp_$m.txt | grep -q 2 || fail=1
done
if [ "${1:-}" = "--full" ]; then
  echo "== mutation tests =="; ( cd exact && python3 run_mutations.py ) | tee out/mutations.txt; rm -f exact/engine_mut.js exact/analyze_mut.js exact/mono_mut.js
  echo "== differential test (30 cases) =="
  ( cd py2 && node ../exact/runcases.js cases.json ../out/js_cases.json && python3 run_cases.py cases.json ../out/py_cases.json && python3 compare_cases.py ../out/js_cases.json ../out/py_cases.json ) | tee out/cases.txt
fi
if [ $fail = 0 ]; then echo "ALL CHECKS PASSED"; else echo "SOME CHECKS FAILED"; exit 1; fi
