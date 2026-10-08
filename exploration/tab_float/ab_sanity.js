// Sanity check of the float engine: for each true cluster piece, is the true neighbourhood
// (all pieces sharing a point with it) contained in one of the enumerated coronas?
import { build, mirrorPoly } from './ab_kinds.js';
import { makeKind, makeTile, growCorona } from './fengine.js';

const T = build();
const { pieces } = T;
const kinds = {
  P: makeKind('P', pieces.A), Pb: makeKind('Pb', mirrorPoly(pieces.A)),
  H: makeKind('H', pieces.H), Hb: makeKind('Hb', mirrorPoly(pieces.H)),
};
console.log('P  corners:', kinds.P.corners.map((c) => (c.angle * 180 / Math.PI).toFixed(1)).join(' '));
console.log('Pb corners:', kinds.Pb.corners.map((c) => (c.angle * 180 / Math.PI).toFixed(1)).join(' '));
console.log('H  corners:', kinds.H.corners.map((c) => (c.angle * 180 / Math.PI).toFixed(1)).join(' '));
const kindOf = { A: 'P', B: 'Pb', C: 'P', D: 'P', H: 'H' };
// is piece B really the mirror image? check that kinds.Pb matches piece B up to rotation/translation
const tiles = Object.fromEntries(Object.keys(pieces).map((k) => [k, makeTile(kindOf[k], pieces[k], makeKind(kindOf[k], pieces[k]).corners)]));

const near = (X, Y) => X.pts.some((p) => Y.pts.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-7));
for (const X of Object.keys(tiles)) {
  const t0 = Date.now();
  const { results, nodes, truncated } = growCorona(tiles[X], kinds, { maxNodes: 400000 });
  const touching = Object.keys(tiles).filter((k) => k !== X && near(tiles[X], tiles[k]));
  const full = results.filter((st) => touching.every((k) => st.tiles.some((t) => t.key === tiles[k].key)));
  console.log(`corona of ${X} (${tiles[X].kind}): ${results.length} coronas (${nodes} nodes${truncated ? ', TRUNCATED' : ''}, ${((Date.now() - t0) / 1000).toFixed(1)}s); touching ${touching.join('')}; containing all: ${full.length}`);
}
