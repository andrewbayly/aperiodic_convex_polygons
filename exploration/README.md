# exploration/

History of the work; **nothing here is needed for the result** (see `../exact`, `../py2`, `../tests`). Kept for transparency, including superseded numbers and the bugs found.

* `tile11/` — first approach: the chiral pentagon/hexagon sets obtained by cutting Tile(1,1) on the 15° lattice, exact arithmetic in Q(√2,√3) (`field.js`, `geom.js`, `engine.js`), plus the early T0/T1/T1bar pruning experiments (`prune.js`, `lemma2.js`, `mirror_test.js`, …). These used the older lattice engine. NB: its names T0, T1, T1bar refer to *different* pieces than in the Q write-up. The saved `.out` files predate the phantom-vertex fix described in `../NOTES.md`.
* `tab_float/` — floating-point prototypes for Tile(a,b) (`fengine.js`, `tab_lib.js`, `ab_kinds.js`, `ab*.js`), the single-point classifier `scan_point.js a b d`, and `scan/` (parameter grids, results, and the searches for rational points with ℓ ∈ Q(√3)). Run from inside the directory, e.g. `cd tab_float && node scan_point.js 2 1 0.3`.
