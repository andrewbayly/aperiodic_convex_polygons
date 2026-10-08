import { buildExact, mirrorPoly } from './ab_exact.js';
import { makeKind, tileFromPoly, growCorona } from './engine.js';
const { pieces } = buildExact();
const P = makeKind('P', pieces.A), Pb = makeKind('Pb', mirrorPoly(pieces.A)), H = makeKind('H', pieces.H), Hb = makeKind('Hb', mirrorPoly(pieces.H));
for (const [nm, ks, ref] of [['P/Pb', { P, Pb }, pieces.A], ['H/Hb', { H, Hb }, pieces.H]]) {
  const r = growCorona(tileFromPoly(ks[Object.keys(ks)[0]], ref), ks, {});
  console.log(nm, 'first coronas:', r.results.length, 'nodes', r.nodes, r.truncated ? 'TRUNCATED' : '');
}
