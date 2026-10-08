# NAMING (current, from 2026-10-08)
- **Q** = the showcase tileset: Tile(a,b) with (a,b,d) = (299, 240, 208)  (formerly "R3").
- **T0** = the convex heptagon piece (formerly H);  **T1** = the convex pentagon piece (formerly P);  **T1bar** = its mirror image.
  Both T0 and T1 may be reflected, so Q has two prototiles.
- Older sections below use the historical names (R1 = (97/50,4/5,1/5), R2 = (11,4,1), R3 = Q; H, P, Pb in code and logs).
  In the code, kind names 'H','Hb' = T0, T0bar and 'P','Pb' = T1, T1bar; piece letters A,B,C,D = the four pentagons, H = the heptagon.
- Not to be confused with the older Tile(1,1) pentagon set, which used T0, T1, T1bar for different pieces (see the first sections).

# CURRENT RESULTS (authoritative; older sections below contain superseded pre-fix numbers marked [superseded])
Showcase **Q** = Tile(299,240) cut at d = 208 into T1 (x3), T1bar (x1) and T0 (x1); exact arithmetic in Q(sqrt3); two independent engines agree.
| reference | first coronas | survive pruning | witnessed role of survivors |
|---|---|---|---|
| T0 (heptagon) | 18 | 2 | both contain the full Tile(a,b) cluster |
| T1 (pentagon) | 368 | 25 | orig:A 5, orig:C 11, orig:D 4, mirr:B 5 (each survivor exactly one role) |
| T1 or T1bar alone | 0 | - | no complete first corona |
| T0 or T0bar alone | 0 | - | no complete first corona |
Same role pattern at R1 (97/50,4/5,1/5: T0 4/2, T1 304/25) and R2 (11,4,1: T0 4/2, T1 304/25), and at all 145 valid float grid points.
Tile(1,1) pentagon set (old lattice engine, fixed): T0 120/4; T1 1552/51 (C 37, A 14); T1bar 876/32 (E 18, B 14); mirror-test D 772/6, A 7547/191.

# qtiles: exact tools for the two-pentagon tileset Q derived from Tile(1,1)

All arithmetic is exact in Q(√2, √3) (`field.js`); no floating-point tolerance is used for any
geometric decision. Tiles are convex pentagons whose edges lie on the 15° direction lattice.

Protiles (cut lines inside Tile(1,1) at vertices 1, 12, 8, 3 give P, R, S):
- T0 (fixed chirality), T1 and T1bar (its mirror image, both allowed).
- Edge lengths: 1, a = (3√2-√6)/2, b = 2√3-2, c = 4-2√3, d = 2√3-3.

## Scripts (run with node 18+)
| Script | What it does |
|---|---|
| `test.js` | Exact checks of P, R, S, areas, congruences, and edge-for-edge reassembly into Tile(1,1) |
| `report.js` | Angle-level vertex stars (including T-junctions) and cross-check with the cluster |
| `sheet.js` | Draws the protiles to `protiles.svg` |
| `prune.js` | All 120 first coronas of T0; prunes those with a tile that cannot be fully surrounded |
| `survivors.js`, `render_survivors.js` | Lists and draws the surviving coronas |
| `lemma2.js A` / `lemma2.js B` | Same pruning for T1 (roles A, C) and T1bar (roles B, E) |

## Method
`engine.js` grows patches by filling the angular gap at a vertex: the tile adjacent to the gap must
start exactly along the gap's first ray, so either it has a corner at that vertex (branch over all
15 corner types) or the vertex lies inside one of its edges ("phantom": a straight tile of unknown
sliding offset, tracked as a 180° wedge). Overlaps are tested exactly with a separating-axis test.

## Results so far [superseded: T1 1156/39 and T1bar 618/30 predate the phantom fix; now 1552/51 and 876/32]
- T0: 120 first coronas, 4 survive pruning, all contain A, B, C, E in cluster position.
- T1: 1156 first coronas, 39 survive; each shows exactly one of the roles A or C.
- T1bar: 618 first coronas, 30 survive; each shows exactly one of the roles B or E.

## Mirror test (`mirror_test.js A|B|D`)
Allowing the mirror image of T0 (T0m) as a fourth kind:
- T0: 654 first coronas, 6 survive; all contain A, B, C, E; one has a T0m neighbour.
- T1: 4586 first coronas, 147 survive; roles A (22), C (78) or mirrored roles Bm (23), Em (24), exactly one each.
- T1bar: 3740 first coronas, 114 survive; roles B (23), E (24) or mirrored roles Am (22), Cm (45).
So every tile still lies in a cluster, but the cluster may be a copy of Tile(1,1) or of its mirror image;
forbidding T0m is what restricts Q-tilings to a single chirality.

## Caveats
Pruning only uses a necessary condition (every tile must be fully surrounded), so it is sound but the
survivor counts are upper bounds. The conclusion relies on the correctness of `engine.js` (branching
completeness and exact geometry), which should be independently reviewed.

## Q (chiral pentagon + hexagon) — NEGATIVE RESULT
Q = {Pn, Hx} from cutting Tile(1,1) with S, T and segments 8-12, S-12, S-1, T-S, T-3, T-6
(`qkinds.js`, `qtest.js`, `q_analyze.js H|P`).
- Pentagon: 225 first coronas, 20 survive; each witnesses exactly one cluster role (hexagon in cluster position).
- Hexagon: 22 first coronas, 3 survive; two contain the cluster, one is a corona of six hexagons.
- The six-hexagon corona extends (`q_hexonly.js`) and the hexagon tiles the plane PERIODICALLY on its own:
  `q_verify_periodic.js` checks exactly that a two-hexagon cell (the hexagon and its 180-degree rotation) with lattice
  v1 = (-3/2, sqrt3/2), v2 = ((1-3 sqrt3)/2, (3-3 sqrt3)/2) has cell area 2 sqrt3 = two hexagon areas and no overlapping translates.
  So Q admits a periodic tiling and is NOT aperiodic. (Angle sums 75+120+165 = 60+150+150 = 360.)

## Tile(a,b) dissection into pentagon P and heptagon H (a=1.94, b=0.8, d=0.2) — floating-point engine [superseded: counts below predate the phantom fix; see CURRENT RESULTS]
Files: `tab_lib.js` (Tile(a,b)), `ab_kinds.js` (pieces), `fengine.js` (tolerance-based engine, EPS 1e-7),
`ab_sanity.js`, `ab_analyze.js H|P`, `ab_mono.js`.
- Pieces: four pentagons (three P and one mirror image Pb, areas 1.609) and one convex heptagon H (area 12.366).
- Kinds allowed: P, Pb, H, Hb (reflections allowed for both tiles).
- Sanity: for each true cluster piece the true neighbourhood appears among its enumerated coronas.
- H: 4 first coronas, 2 survive pruning, both contain the four cluster pentagons in position.
- P: 226 first coronas, 20 survive; each witnesses exactly one of the four roles
  (orig:A 5, orig:C 7, orig:D 3, mirr:B 5), witnessed by H in cluster position.
- P/Pb alone and H/Hb alone admit no complete first corona (`ab_mono.js`).
- CAVEAT: numerical (tolerance 1e-7), not exact; needs an independent implementation / exact upgrade.

## Exact-arithmetic verification of the Tile(a,b) result (`exact/`) [superseded: P counts 226/20 became 304/25 after the phantom fix]
a=97/50, b=4/5, d=1/5. All coordinates live in E = Q(√3, ℓ), ℓ = |Q-12|, ℓ² = (15279-4680√3)/2500 (`field4.js`, tested by `fieldtest.js`).
`ab_exact.js` builds the pieces exactly (collinear vertices stripped by exact test); `engine.js` is the corona engine with exact
overlap, wedge and gap decisions (float only as a prefilter with margin 1e-6; ambiguous cases go to exact sign tests);
`sanity.js`, `analyze.js H|P`, `mono.js` mirror the float scripts.
Results are identical to the float engine: H 4 first coronas / 2 survive (both contain the cluster); P 226 / 20 survive
(orig:A 5, orig:C 7, orig:D 3, mirr:B 5); P/Pb alone and H/Hb alone: see `mono.js`.
Remaining caveats: shared design between the two engines (not an independent implementation); pruning is a necessary-condition
argument; parameter scan and the minimality claim are still open.

## Parameter scan and a nicer point (a=11, b=4, d=1)
`scan_point.js a b d` (float engine) classifies one parameter point; `scan/points.txt` + `scan/results.jsonl` hold a 30x10 grid
(b=1, a=1.1..4.0, d=0.05..0.50). Of 300 points, 155 have a non-convex piece (no valid dissection) and all 145 valid points show the same
pattern (P-only and H-only have no first corona; H: survivors all contain the cluster; P: 20 survivors, none undecided). Float evidence only.
`scan/nice.py` searches rational (a, b=1, d) for points where l = |Q-12| lies in Q(sqrt3). Four hits with denominators <= 12:
(13/8,3/8), (23/12,1/3), (11/5,3/10), (11/4,1/4). Scaled by b=4: (a,b,d) = (11,4,1) has l = 13 - 2*sqrt3, so everything lives in Q(sqrt3).
Exact engine at (11,4,1): `AB=11,4,1 node exact/analyze.js H|P`, `mono.js` -> H 4 coronas/2 survive; P 226/20 survive (orig:A 5, orig:C 7, orig:D 3, mirr:B 5); P-only, H-only: 0.

## R3 neighbourhood: (a,b,d) near (1.5, 1.23, 1.1) -> (33, 28, 21)
Float: (1.5,1.23,d) forced for d = 0.7..1.1. `scan/near2.py` searches integer (a,b,d), b<=160, for l in Q(sqrt3) near a/b=1.22, d/b=0.89.
Hits: (33,28,21) [a/b=1.179, d/b=0.75], (77,60,47), (138,124,111). (33,28,21): l = |30-35*sqrt3|; edges 33, 28, 21, 12, l.
Exact (AB=33,28,21): H 18 first coronas / 2 survive (cluster); P 232 / 20 survive (orig:A 5, orig:C 7, orig:D 3, mirr:B 5); P-only, H-only: 0.
Bug fixed in exact/engine.js: sqrtF could return the negative root (l = 30-35*sqrt3 < 0); lengths are now forced positive. Earlier exact results unaffected.

## Closer nice points to (1.5, 1.23, 1.1)  (`scan/near3.py B rad`, numpy search over integer (a,b,d), b<=B)
Distance in (a/b, d/b) from target (1.2195, 0.8943): (33,28,21) 0.150; (264,212,183) 0.040; (299,240,208) 0.038 [a/b=1.2458, d/b=0.8667].
Exact (AB=299,240,208): H 18/2 survive (cluster); P 232/20 (orig:A 5, orig:C 7, orig:D 3, mirr:B 5); P-only, H-only: 0.
Hit density is low: closing in by a factor 2 needs roughly 4x larger b.

## SHOWCASE POINT: R3 = Tile(a,b) with (a,b,d) = (299, 240, 208)
Naming: R1 = (97/50, 4/5, 1/5) [field Q(sqrt3, l), degree 4]; R2 = (11, 4, 1) [l = 13-2*sqrt3]; R3 = (299, 240, 208) [all in Q(sqrt3)].
Reproduce: `cd exact; AB=299,240,208 node analyze.js H; AB=299,240,208 node analyze.js P; AB=299,240,208 node mono.js` (about 10 s total).
Picture: `AB=299,240,208 TAG=R3_299_240_208 S=0.5 node draw_11_4_1.js` -> tile_R3_299_240_208.svg/.png.
Exact result: H 18 first coronas/2 survive (both contain the cluster); P 232/20 survive (orig:A 5, orig:C 7, orig:D 3, mirr:B 5); P-only, H-only: 0 first coronas.

## SECOND IMPLEMENTATION (py2/) AND A BUG IT FOUND  (2026-10-07)
`py2/` is a from-scratch Python engine (Fractions in Q(sqrt3), no floats in any accept decision): `fq3.py` (field), `engine2.py`
(corona engine; polygon overlap by exact Sutherland-Hodgman clipping instead of separating axes; open vertex chosen lexicographically
instead of smallest gap), `ab2.py` (independent construction of Tile(a,b) and the pieces), `analyze2.py`, `gen_cases.py`/`run_cases.py`/`compare_cases.py`.
**Bug found.** Both engines modelled a 'phantom' (a tile whose edge runs straight through a vertex, position unknown) as a 180-degree wedge,
but never removed it when a placed tile later realised that same straight wedge, so the vertex looked over-covered and a valid branch was pruned.
The JS engine usually avoided it by ordering luck. Fixed in exact/engine.js, engine.js (lattice), fengine.js (`consumePhantoms`); old versions kept as `*_before_phantomfix.js`.
Effect: P-reference first coronas 226 -> 304 (R1, R2; 368 at R3), survivors 20 -> 25, roles orig:A 5, orig:C 11, orig:D 4, mirr:B 5; H results unchanged
(R1,R2: 4/2; R3: 18/2). Conclusions unchanged: every survivor witnesses exactly one cluster role; P-only and H-only have no first corona.
Older lattice-engine numbers for the Tile(1,1) pentagon set changed too (T0 120/4 unchanged; T1 1552 coronas/51 survive: C 37, A 14;
T1bar 876/32: E 18, B 14; mirror test D 772/6) with the same qualitative conclusion.
**Agreement.** JS (fixed) and Python give *identical sets* of first coronas and survivors at R2 for H (4/2) and P (304/25).
Differential test on 30 generated tile sets (hexagon, square, triangles, dodecagon, zonogons, random cuts, ...): all 14 runs that finish under the node cap
(4000) agree exactly (corona sets and survivor sets); 32 runs hit the cap and are not compared. Known answers: regular hexagon 1 corona, dodecagon 0.
Limits: same author, same specification of 'corona'; shared conceptual errors are not excluded.
**R3 = (299,240,208) cross-check:** Python and fixed JS give identical sets: H 18 coronas / 2 survivors; P 368 coronas / 25 survivors (roles 5/11/4/5).
Tile(1,1) mirror test A (lattice engine, fixed): 7547 first coronas, 191 survive (A 27, Bm 23, C 109, Em 32).

## Parent theorem check (Smith, Myers, Kaplan, Goodman-Strauss, arXiv:2303.10798, read 2026-10-08)
Their Tile(a,b) is a 13-gon (a 14-gon with one 180-degree vertex), identical to ours; Tile(1,sqrt3) is the hat. Stated: Tile(r) = Tile(1,r) is aperiodic for
every positive r != 1 (Section 6); Tile(0,1), Tile(1,1), Tile(1,0) admit periodic tilings and are the only exceptions. Tilings use rotations, reflections allowed under the
usual convention (hat tilings must mix reflected and unreflected tiles); Section 7 revisits reflections and was not read. Q has b/a = 240/299 != 1, so Tile(299,240) is aperiodic.

## Verification round (2026-10-08)
- **Scan redone with the fixed float engine** (`scan_point.js`, now with the full role-witness test for T1): all 145 valid grid points (b=1, a=1.1..4.0, d=0.05..0.50)
  are "forced" with the same role tally orig:A 5, orig:C 11, orig:D 4, mirr:B 5 (25 survivors); the 155 others have a non-convex piece. Same map as before the fix. (`scan/results_fixed.jsonl`)
- **Mutation tests** (`exact/run_mutations.py`, at Q): each deliberate fault below changes the headline numbers (baseline T0: 18 coronas/2 survive, T1: 368/25):
  no phantoms -> T1 232/20; phantom never consumed (the old bug) -> T1 232/20; drop corner 0 of every kind -> T0 0/0, T1 49/1; corner strictly narrower than gap -> 0/0 and 0/0;
  overlapping wedges not detected -> T1 452/31; phantoms only for gaps > pi+0.5 -> T1 232/20.
  NOT detected: disabling the explicit polygon-overlap test changes nothing at Q (368/25 and 18/2): the wedge bookkeeping already rejects every overlapping branch, so that test is redundant here.
- **Completeness spot-check** (`exact/completeness.js`): ground-truth tilings by two-piece cuts of lattice tiles (rows randomly shifted, so contacts slide). For every central piece the true corona
  (engine-style: tiles with a corner at a boundary vertex of a placed tile, closed under iteration; tiles that merely pass through a vertex are phantoms) is looked up among the engine's coronas.
  Result so far: see below.
  Result: only one test set enumerates completely under the node cap (the 2x1-rectangle cut #1: 1369 coronas): all 12 true coronas (2 pieces x 6 row-shift trials, sliding contacts included) are found.
  The other cut tilings produce 10^5+ coronas (sliding contacts) and truncate, so those checks are inconclusive and are not claimed. A stronger completeness test needs real tilings by Q itself
  (i.e. a hat-family substitution patch), which is not built yet.

---

## RECOMPOSITION ARGUMENT (Q = Tile(299,240,208))  [added 2026-10-08]

Prototiles: T0 (convex heptagon), T1 (convex pentagon); both may be reflected (T0bar, T1bar). The tile Tile(a,b) = 3 T1 + 1 T1bar + 1 T0 (pieces A, C, D are T1; B is T1bar; H is T0).

**Computer-assisted lemmas** (exact arithmetic; `node exact/analyze.js H|P|Hb|Pb` with `AB=299,240,208`; independent Python engine `py2/` gives identical sets for H and P):

| reference tile | first coronas | survive pruning | what survivors contain |
|---|---|---|---|
| T0  | 18  | 2  | all 2 contain the full cluster A,B,C,D in position |
| T0bar | 18 | 2 | all 2 contain the mirrored cluster |
| T1  | 368 | 25 | each survivor witnesses exactly one role: A (5), C (11), D (4), B-as-mirror (5) |
| T1bar | 368 | 25 | the same split (5/11/4/5), mirrored |

(Roles are witnessed by the *rest of the cluster tile in position*; "mirr:B" means the reference T1 plays the part of the mirror piece B, i.e. as a T1bar-congruent copy under reflection.)

**Lemma 1 (T0).** In any tiling by T0, T1 and their mirrors, every tile congruent to T0 or T0bar is surrounded by the other four tiles of a Tile(a,b) cluster.
**Lemma 2 (T1).** Every T1/T1bar tile lies in the position of exactly one of A, B, C, D of a Tile(a,b)-cluster whose other four pieces are present in the right place.

Both follow because a real corona is, by construction, among the survivors (the survivor set is a *superset* of true coronas: pruning only discards branches that provably cannot be completed).

**Partition.** Each cluster contains exactly one T0, so Lemma 1 gives a cluster around every T0. By Lemma 2 every T1 lies in a cluster, and the cluster is unique because the role is unique and the cluster's T0 is determined by the role. Clusters therefore cover every tile, and two clusters sharing a tile coincide. So the tiling is a partition into copies of Tile(a,b) (possibly reflected), i.e. it is a tiling by the parent monotile, with each cluster's tiles in the dissection of its parent.

**Consequences.**
* MLD: Q-tiling → Tile(a,b)-tiling by the partition above (local rule: radius of a corona); Tile(a,b)-tiling → Q-tiling by cutting each tile.
* Aperiodicity: a periodic Q-tiling would give a periodic Tile(a,b)-tiling (the partition is canonical, so translations are preserved), contradicting Smith–Myers–Kaplan–Goodman-Strauss for b/a ≠ 1.

**Caveats (honest list).**
1. Single author, single code base (plus one independent re-implementation by the same author); no external review.
2. Pruning uses a node budget; no survivor was budget-truncated at Q, but the argument needs "survivors ⊇ true coronas", which depends on the engine enumerating *all* placements (tested by mutation and completeness tests above; the completeness test is partial).
3. Smith et al.'s theorem is for their reflection convention; Section 7 (reflections) has not been read by me and the allowance of reflected pieces here must be matched against it.
4. Minimality (two prototiles is least possible) is only conditional on Rao's unrefereed classification.

### Reflection convention check (Smith et al.)  [added 2026-10-08]
The arXiv text of 2303.10798 available to me ends partway through Section 6, so Section 7 itself is still unread. From what I could read:
* Sec. 1.3: a monohedral tiling is one whose tiles are congruent "where congruences can incorporate mirror reflections". The hat's tilings necessarily mix reflected and unreflected tiles.
* Sec. 6: Tile(a,b) is aperiodic for every positive r=b/a ≠ 1. Thm 6.1 gives a bijection between combinatorially equivalent tilings for Tile(r) and Tile(r'), so a periodic Tile(a,b) tiling with reflections allowed would give a periodic hat tiling with reflections allowed.
* The Spectre paper (arXiv:2305.17743) says "all members of this continuum are aperiodic monotiles, with three exceptions" (Tile(0,1), Tile(1,0), Tile(1,1)). It also notes Tile(1,1) is aperiodic only if reflections are forbidden.
So the parent theorem we use is the reflections-allowed one, matching our set (both T0 and T1 reflectable, in which case a cluster is either all unreflected or all mirrored). Still to do: read Section 7 itself from the journal version.

### Figures: survivor galleries  [added 2026-10-08]
`exact/gallery.js` (`AB=299,240,208 node exact/gallery.js P|H out.svg`) draws every pruning survivor. Output: `survivors_T1.svg/.png` (25 coronas around T1; red outline = reference tile) and `survivors_T0.svg/.png` (2 coronas around T0). Orange = T1, blue = T1bar, grey = T0. Note the first T0 survivor contains a second T0 (the neighbouring cluster's), so a corona need not consist only of the five cluster pieces.

---

## MLD, stated precisely  [added 2026-10-08]

Notation: 𝒯 = the set of all tilings of the plane by T0, T1 and their mirror images (any rigid motions); 𝒞 = the set of all tilings by Tile(a,b) (a=299, b=240, reflections allowed). Let `cut` be the fixed dissection of Tile(a,b) into A,B,C,D,H (T1,T1bar,T1,T1,T0).

**(⇐) 𝒞 → 𝒯, radius 0.** `cut` applied tile by tile. The output is a tiling by T0, T1, T1bar and T1bars' mirrors, and every piece is determined by the one parent tile it lies in. Rigid motions (including reflections) commute with it.

**(⇒) 𝒯 → 𝒞, radius = one corona.** Take X ∈ 𝒯 and a tile t of X. The first corona of t in X (t together with all tiles touching it) is one of the survivors computed above, since true coronas are survivors. By Lemma 1/2 that survivor witnesses exactly one cluster position: a unique Tile(a,b) copy K(t) (cluster = 5 pieces in rigid relative position) which contains t in its role. Define `recompose(X)` = {K(t) : t ∈ X}.
* Well defined and local: K(t) is a function of the first corona of t alone, hence of the tiles within one corona of t.
* Consistent: if s ∈ K(t) then K(s) = K(t). Reason: K(t) is a Tile(a,b) copy containing s in a definite role, and a copy of the cluster is rigidly determined by any one of its pieces together with the role; K(s) is the copy determined by s and its (unique) witnessed role, which, by the uniqueness of the witnessed role, is the role s has in K(t). So the two copies coincide.
* Hence the K(t) have disjoint interiors, cover the plane (each tile is in its own K), and 𝒯 → 𝒞 is a well-defined map equivariant under rigid motions, including reflections.

**Inverse.** `cut(recompose(X)) = X` by definition of K(t) as a union of tiles of X. `recompose(cut(Y)) = Y` for Y ∈ 𝒞: in cut(Y), the piece p of the parent tile P has first corona a true corona, whose unique witnessed cluster must be P itself (P is a cluster containing p in role r and the role is unique). So the maps are mutually inverse and both local, i.e. 𝒯 and 𝒞 are **mutually locally derivable** (MLD), in the strong sense that the correspondence is bijective on tilings, equivariant for the full Euclidean group (including reflections), and local with radius ≤ one corona in one direction and 0 in the other.

**Consequences.** (i) The translation (and full Euclidean) symmetry group of X equals that of recompose(X). (ii) X is periodic iff recompose(X) is. (iii) Therefore X ∈ 𝒯 is non-periodic by the parent theorem. (iv) 𝒯 is non-empty (cut any Tile(a,b) tiling).

**What is *not* claimed:** nothing is said about 𝒯 for other (a,b,d); we make no claim about matching rules beyond the geometry itself; and the argument rests on the computed lemmas, the caveats listed in the RECOMPOSITION section above, and Smith et al.'s theorem as published.

---

## Literature / novelty check  [added 2026-10-08; incomplete]
* **Sugimoto, "Aperiodic sets of three types of convex polygons", arXiv:2404.00534 (v5 seen):** dissects Tile(1,1) (not Tile(a,b), not the hat) into five convex pieces, 4 methods, giving 3-prototile convex sets (e.g. 2 pentagons + 1 heptagon) with no edge matching rules. Reflected tiles are NOT allowed there, and the authors say aperiodicity is not confirmed (it rests on the Tile(1,1) chiral monotile result). Our set differs: two prototiles, from Tile(a,b) with b/a ≠ 1, reflections allowed, aperiodicity argued via exact corona computation.
* **Rao, arXiv:1708.00274** (convex polygons; unrefereed), see the minimality discussion above.
* **arXiv:1602.06372 "Convex Polygons for Aperiodic Tiling"**: about edge-to-edge monohedral tilings by a convex polygon (such a polygon admits a periodic tiling); it does not give aperiodic multi-tile sets, so not a prior-art conflict.
* **arXiv:2609.09603 (Sept 2026), "Tile sets consisting of two types of concave polygons derived from periodic tilings corresponding to non-periodic tilings with hat and turtle tiles"**: title seen in search only. I could not read it (the fetch was rate-limited and I was told not to retry). Two-tile sets from hat/turtle but CONCAVE; need to read before claiming novelty for a two-tile convex set.
* Not done: a systematic search for other dissections of Tile(a,b) or the hat; a check of Smith et al.'s own remarks on dissections.

### arXiv:2609.09603 read (Sugimoto, v1 9 Sep 2026)  [added 2026-10-08]
Read from the PDF the user supplied (60 pp; I read abstract, intro, the ASP/ASPmr definitions and the closing section, and grepped the rest; I did not read every figure/section).
* Starts from the convex Type-5 pentagon, patterns hat/turtle tilings with periodic Type-5 tilings, and obtains four CONCAVE polygons (AH, BH, AT, BT; Heesch number 1) that correspond to clusters of the hat/turtle substitution tilings.
* Only *discusses the possibility* that pairs of these may form an aperiodic two-tile set "ASPmr{A,B}"; poses "Does an ASPmr{A-tile, B-tile} exist?" as an open Question. No aperiodicity proof is given. Tiles are concave, not convex.
* Defines P{A,B} as two non-congruent tiles with no matching rules, mirror images counted as the same tile (consistent with our convention).
So it does not pre-empt a convex two-prototile set with a computer-assisted aperiodicity argument; it is relevant background and for terminology (ASP). A cautious claim: "to our knowledge the first explicit two-prototile aperiodic set of convex polygons with no matching rules," conditional on the verification above, and subject to a fuller literature search.

---

## Parameter region and the "infinite family" remark  [added 2026-10-08]
`figures/parameter_region.png`: float classification (`scan_point.js`) on b=1, a = 1.1..4.0 (d = 0.05..0.5) and a = 1.1..2.0 (d = 0.55..1.2), 440 points. 226 give five convex pieces with the same outcome as Q (T0: 2 survivors; T1: 25 survivors with roles 5/11/4/5), 212 have a non-convex piece, 2 have pieces that fail the area check. The valid points form an L-shaped region, and Q = (299,240,208) lies well inside it (a/b = 1.246, d/b = 0.867). Not scanned: a/b > 2 with d/b > 0.5. The scan is float and uses node budgets; only Q, R1 and R2 have exact-arithmetic verification.
Suggested wording for the write-up: "It may be that there is a range of solutions, varying two parameters, giving an infinite family of aperiodic tile sets. We have not attempted to prove that. Rather, we chose specific values and proved aperiodicity for them."

## Minimality wording
Suggested: "A set of two prototiles is the smallest possible provided no single convex polygon is an aperiodic monotile. That is the conclusion of Rao (arXiv:1708.00274), who classifies the convex polygons that tile the plane, using computer assistance; Hales has verified part of it. To our knowledge the work has not appeared in a refereed journal, so minimality is conditional on it. Nothing else in this repository depends on it."
Status of Rao's work as of 2026-10-08, as far as I could determine: arXiv preprint (July 2017), partly verified by Hales (2017 blog post), cited conditionally in arXiv:2506.18473 (J. Geom. Graph. 29(2), 2025) as unrefereed; I found no statement of intent to publish.

---

## Test against genuine tilings (soundness of pruning)  [added 2026-10-08]
`tests/gen_hat_patch.js` runs the hat substitution of C. Kaplan's `hatviz` (BSD-3, copied unmodified into `tests/third_party/hatviz/`) to produce a genuine hat tiling patch (level 5: 7921 hats). `tests/real_tilings.js` then
1. matches every hat to our Tile(1,√3) (rotation/reflection), exact;
2. grades each tile vertex by its (a-edge, b-edge) content and propagates translations over shared vertices. All 7921 tiles are reached, and the grading is exactly consistent at every shared vertex (0 violations), an independent confirmation of the "combinatorially equivalent tilings" statement (Smith et al. Thm 6.1) for this patch. The patch is then realised with (a,b) = (299,240);
3. cuts every tile with d = 208 into A,B,C,D,H (39 605 pieces, kinds T1/T1bar/T0/T0bar as expected);
4. for every piece whose surrounding disc of radius 9 is fully covered (30 335 pieces: T1 16 639, T1bar 7 629, T0 5 286, T0bar 781), forms the true first corona (engine-style closure), moves the core to the reference position, and looks it up among the engine's first coronas and its pruning survivors.
Result: all 30 335 true coronas are among the engine's survivors (so none was pruned wrongly), and no two tiles inside any corona overlap. Distinct true coronas realised: T1 16 of 25, T1bar 8 of 25 (20 of 25 after identifying mirror images), T0 2 of 2, T0bar 1 of 2. A survivor that never occurs is allowed (survivors are a superset of true coronas); it still contains a cluster role, so the argument is unaffected. Caveat: this is one patch of one hat tiling class (the substitution hull); it samples, it does not prove completeness. An earlier version of the test counted pieces near the patch boundary and reported spurious failures; those were boundary artefacts (incomplete neighbourhoods), removed by the disc-coverage criterion.
Runtime of the level-5 run: about 10 minutes; `verify.sh` uses level 4.
