# Aperiodic sets of two convex polygons obtained by dissecting Smith et al.'s monotile

**Status: computer-assisted argument by a single author, not independently reviewed. Please read "Caveats" before relying on anything here.**

## What this is
The aperiodic monotile family Tile(a,b) of Smith, Myers, Kaplan and Goodman-Strauss ([arXiv:2303.10798](https://arxiv.org/abs/2303.10798); the hat is Tile(1,√3)) is aperiodic for every positive b/a ≠ 1. We cut one member, **Q = Tile(299, 240)** with cut parameter d = 208, into five convex pieces:

| piece | shape | prototile |
|---|---|---|
| A, C, D | convex pentagons (congruent) | **T1** |
| B | the mirror-image pentagon | **T1bar** |
| H | convex heptagon | **T0** |

So **Q** is the tile set {T0, T1} (two prototiles; reflections allowed, as for the hat itself), with **no matching rules**: edges may be placed anywhere, tiles may touch edge to edge or not.

(Figures: `figures/tile_Q.png` shows the dissection; `figures/survivors_T1.png`, `figures/survivors_T0.png` show the computed coronas.)

## The claim
1. *Every tiling of the plane by T0, T1 and their mirror images is the dissection of a tiling by Tile(299,240)* (and conversely). The two families of tilings are mutually locally derivable (radius 0 one way, one corona the other way).
2. Hence every tiling by Q is non-periodic, by the parent theorem.

Point 1 rests on a finite computation (exact arithmetic, `exact/`, independently re-implemented in `py2/`):

| reference tile | first coronas | survive pruning | each survivor contains |
|---|---|---|---|
| T0 (also T0bar) | 18 | 2 | the whole Tile(a,b) cluster in position |
| T1 (also T1bar) | 368 | 25 | exactly one cluster role: A (5), C (11), D (4) or B-as-mirror (5) |

Full argument: **NOTES.md → "RECOMPOSITION ARGUMENT"** and **"MLD, stated precisely"**.

## Reproduce
```
./verify.sh          # core results, JS and Python engines compared (needs node ≥ 18, python3; about 20 minutes on 2 cores, almost all of it the Python T1 pass)
./verify.sh --full   # plus mutation tests and a 30-case JS/Python differential test
node exact/gallery.js P out.svg   # redraw the survivor gallery (AB=299,240,208 in the environment)
```
Reading guide: `exact/field4.js` (exact number field Q(√3,ℓ)), `exact/ab_exact.js` (the dissection), `exact/engine.js` (corona/pruning engine), `exact/analyze.js` (roles and tally); `py2/` is a separate implementation (`fq3.py`, `engine2.py`, `ab2.py`, `analyze2.py`). `exploration/` is the history of the work (float prototypes, parameter scans, the older Tile(1,1) experiments); it is not needed for the result.

## Caveats (please read)
* **Single author, one code base plus one re-implementation by the same author.** The Python engine agrees exactly with the JS engine on Q (same corona and survivor sets) and on 14 of 30 generated test sets that both finish (the rest hit the node cap); mutation tests show the engine is sensitive to deliberate faults, though not to disabling the polygon-overlap test, which is redundant at Q. None of this replaces independent review.
* **The pruning argument needs "survivors ⊇ true coronas".** That is checked only by testing (mutations, and a completeness test on cut tilings that terminated for one case). A bug that drops legal placements would make the argument invalid. A bug already found and fixed during development (a phantom-vertex bookkeeping error that over-pruned) shows this risk is real; see NOTES.md.
* **Parent theorem.** We rely on Smith et al.'s result as published (reflections allowed). We have not re-derived it, and Section 7 of that paper has not been read by us.
* **Minimality.** Two prototiles is the least possible only if no single convex polygon is aperiodic. That is claimed in Rao's arXiv:1708.00274 (classification of convex pentagon tilings, partly computer-assisted); it has been verified in part by Hales but, as far as we know, is not refereed. Our claim of minimality is conditional on it.
* **One parameter point, not a family.** We proved the statement for one point (299,240,208). A float scan (`figures/parameter_region.png`; the region a/b > 2, d/b > 0.5 was not scanned) suggests a two-dimensional region of parameters, containing Q, behaves identically, so there may be an infinite family of aperiodic sets, but **we make no claim** about that; proving it would need a uniform argument.
* **Novelty.** To our knowledge this is the first explicit aperiodic set of two convex polygons without matching rules, but the literature check is incomplete (NOTES.md, "Literature / novelty check"). Closest work: Sugimoto, arXiv:2404.00534 (three convex polygons from Tile(1,1), no reflections, no proof of aperiodicity) and arXiv:2609.09603 (concave pairs, left as a question).

## License
MIT (see `LICENSE`).
