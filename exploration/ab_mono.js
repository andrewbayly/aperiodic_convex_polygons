// Can P (with its mirror image) or H (with its mirror image) tile the plane alone?
import { build, mirrorPoly } from './ab_kinds.js';
import { makeKind, makeTile, growCorona, growLayer } from './fengine.js';
const T = build();
const { pieces } = T;
const K = (n, p) => makeKind(n, p);
const sets = {
  'pentagon only {P, Pb}': { kinds: { P: K('P', pieces.A), Pb: K('Pb', mirrorPoly(pieces.A)) }, ref: ['P', pieces.A] },
  'heptagon only {H, Hb}': { kinds: { H: K('H', pieces.H), Hb: K('Hb', mirrorPoly(pieces.H)) }, ref: ['H', pieces.H] },
};
for (const [name, { kinds, ref }] of Object.entries(sets)) {
  const core = makeTile(ref[0], ref[1], makeKind(ref[0], ref[1]).corners);
  let { results: states } = growCorona(core, kinds, {});
  const log = [`layer 1: ${states.length}`];
  for (let L = 2; L <= 3 && states.length; L++) {
    const next = [];
    for (const st of states) { next.push(...growLayer(st, st.tiles, kinds, { maxNodes: 2_000_000 }).results); if (next.length > 3000) break; }
    log.push(`layer ${L}: ${next.length}${next.length > 3000 ? '+' : ''}`);
    states = next.slice(0, 400);
  }
  console.log(name + ' -> ' + log.join(', '));
}
