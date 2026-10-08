import { strip } from './tiles.js';
import { makeTile, growCorona, growLayer, interiorsOverlap, rotPt } from './engine.js';
import { kinds, pieces } from './qkinds.js';
import { pkey, padd, psub, pscale, num, cross, area2 } from './geom.js';
import { K, kk } from './field.js';
const hk = { Hx: kinds.Hx };
const H = makeTile('Hx', strip(pieces.H));
let { results: states } = growCorona(H, hk, {});
for (let L = 2; L <= 4; L++) { const nx = []; for (const st of states) nx.push(...growLayer(st, st.tiles, hk, { maxNodes: 2_000_000 }).results); states = nx; }
const patch = states.find(s => new Set(s.tiles.map(t => t.vinfo[0].dN)).size === 2);
const v1 = { x: kk(-3, 0, 0, 0, 2), y: kk(0, 0, 1, 0, 2) };                    // (-3/2, √3/2)
const v2 = { x: kk(1, 0, -3, 0, 2), y: kk(3, 0, -3, 0, 2) };                    // ((1-3√3)/2, (3-3√3)/2)
const det = cross(v1, v2);
console.log('lattice cell area det =', det.toString(), '; two hexagon areas = 2√3 ->', det.abs ? '' : '', det.eq(kk(0,0,-2,0)) || det.eq(kk(0,0,2,0)));
// cell = the central hexagon plus one patch tile of the other orientation
const o0 = H.vinfo[0].dN;
const other = patch.tiles.find(t => t.vinfo[0].dN !== o0);
console.log('central orientation', o0, 'partner orientation', other.vinfo[0].dN, 'partner is 180° rotation:', (other.vinfo[0].dN - o0 + 24) % 24 === 12);
const cell = [H, other];
const shift = (t, v) => makeTile(t.kind, t.pts.map(p => padd(p, v)));
const R = 4, all = [];
for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) {
  const v = padd(pscale(v1, K.int(i)), pscale(v2, K.int(j)));
  for (const [c, t] of cell.entries()) all.push({ c, i, j, tile: shift(t, v) });
}
let overlaps = 0;
for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) if (interiorsOverlap(all[a].tile, all[b].tile)) overlaps++;
console.log(`checked ${all.length} tiles (${all.length*(all.length-1)/2} pairs): overlapping pairs = ${overlaps}`);
// every point of the central region is covered: check shared-edge adjacency count around the central hexagon
const keys = new Set(all.map(x => x.tile.key));
console.log('central hexagon and partner present in translate set:', cell.every(t => keys.has(t.key)));
