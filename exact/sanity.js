import { buildExact, mirrorPoly } from './ab_exact.js';
import { makeKind, tileFromPoly, growCorona, polyKey } from './engine.js';
const { pieces } = buildExact();
for (const [k,p] of Object.entries(pieces)) console.log(k, p.length, p.map(q=>q[0].f().toFixed(3)+','+q[1].f().toFixed(3)).join(' '));
const kinds = { P: makeKind('P', pieces.A), Pb: makeKind('Pb', mirrorPoly(pieces.A)), H: makeKind('H', pieces.H), Hb: makeKind('Hb', mirrorPoly(pieces.H)) };
for (const k of Object.values(kinds)) console.log(k.name, k.corners.map(c=>(c.angf*180/Math.PI).toFixed(1)).join(' '));
const kindOf = { A: 'P', B: 'Pb', C: 'P', D: 'P', H: 'H' };
const tiles = Object.fromEntries(Object.keys(pieces).map(k => [k, tileFromPoly(makeKind(kindOf[k], pieces[k]), pieces[k])]));
const near = (X, Y) => X.pts.some(p => Y.pts.some(q => p[0].eq(q[0]) && p[1].eq(q[1])));
for (const X of Object.keys(tiles)) {
  const t0 = Date.now();
  const { results, nodes, truncated } = growCorona(tiles[X], kinds, { maxNodes: 400000 });
  const touching = Object.keys(tiles).filter(k => k !== X && near(tiles[X], tiles[k]));
  const full = results.filter(st => touching.every(k => st.tiles.some(t => t.key === polyKey(pieces[k]))));
  console.log(`corona of ${X}: ${results.length} coronas (${nodes} nodes${truncated?', TRUNC':''}, ${((Date.now()-t0)/1000).toFixed(1)}s); vertex-touching ${touching.join('')}; containing all: ${full.length}`);
}
