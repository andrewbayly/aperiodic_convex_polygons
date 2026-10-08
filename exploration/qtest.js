// Exact sanity checks for Q: pieces tile Tile(1,1) edge-for-edge, pentagons are directly congruent,
// pentagon is mirror-symmetric, hexagon is not.
import { K, kk } from './field.js';
import { pkey, area2, mirrorX } from './geom.js';
import { canonical, describe } from './tiles.js';
import { pieces, kinds, PTS, FACES } from './qkinds.js';
import { construct } from './tiles.js';

let failures = 0;
const check = (label, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? '  ' + extra : ''}`); if (!ok) failures++; };

const area = (p) => area2(p).divInt(2);
check('areas sum to 3+3√3', Object.values(pieces).map(area).reduce((s, a) => s.add(a)).eq(kk(3, 0, 3, 0)));
check('pentagon area (3+2√3)/4', area(pieces.A).eq(kk(3, 0, 2, 0, 4)));
check('hexagon area √3', area(pieces.H).eq(kk(0, 0, 1, 0)));

const cn = Object.fromEntries(['A', 'B', 'C', 'D'].map((k) => [k, canonical(describe(pieces[k]))]));
check('A,B,C,D directly congruent', new Set(Object.values(cn)).size === 1);
const mir = (p) => describe(p.map(mirrorX).reverse());
check('pentagon mirror-symmetric', canonical(mir(pieces.A)) === cn.A);
check('hexagon NOT mirror-symmetric', canonical(mir(pieces.H)) !== canonical(describe(pieces.H)));

// edge-for-edge reassembly (boundary of the five pieces = Tile(1,1) boundary, with S, T interior)
const V = construct().V;
const dEdges = new Map();
for (const f of Object.values(FACES)) {
  for (let i = 0; i < f.length; i++) {
    const a = pkey(PTS[f[i]]), b = pkey(PTS[f[(i + 1) % f.length]]);
    const rev = b + '>' + a;
    if (dEdges.get(rev) > 0) dEdges.set(rev, dEdges.get(rev) - 1);
    else dEdges.set(a + '>' + b, (dEdges.get(a + '>' + b) || 0) + 1);
  }
}
const left = [...dEdges].filter(([, c]) => c > 0).map(([k]) => k).sort();
const want = V.map((p, i) => pkey(p) + '>' + pkey(V[(i + 1) % 14])).sort();
check('unmatched piece edges = boundary of Tile(1,1)', JSON.stringify(left) === JSON.stringify(want), `${left.length} edges`);

console.log('Pn:', kinds.Pn.corners.map((c) => `${c.angle * 15}°-${c.edge}`).join(' '));
console.log('Hx:', kinds.Hx.corners.map((c) => `${c.angle * 15}°-${c.edge}`).join(' '));
console.log(failures ? `${failures} FAILURE(S)` : 'all checks passed');
process.exit(failures ? 1 : 0);
