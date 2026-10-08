import { strip } from './tiles.js';
import { makeTile, growCorona, growLayer, interiorsOverlap } from './engine.js';
import { kinds, pieces } from './qkinds.js';
import { pkey, padd, psub, num, area2 } from './geom.js';
import { K, kk } from './field.js';
const hk = { Hx: kinds.Hx };
const H = makeTile('Hx', strip(pieces.H));
let { results: states } = growCorona(H, hk, {});
for (let L = 2; L <= 4; L++) {
  const next = [];
  for (const st of states) next.push(...growLayer(st, st.tiles, hk, { maxNodes: 2_000_000 }).results);
  states = next;
}
console.log('patches', states.length, 'tiles', states.map(s => s.tiles.length), 'phantoms', states.map(s => s.phantoms.size));
const orient = (t) => t.vinfo[0].dN;
for (const [si, st] of states.entries()) {
  const tl = st.tiles;
  const keySet = new Set(tl.map((t) => t.key));
  const shift = (t, v) => makeTile(t.kind, t.pts.map((p) => padd(p, v)));
  // candidate translations: differences of pts[0] between same-orientation tiles
  const cands = new Map();
  for (const a of tl) for (const b of tl) if (a !== b && orient(a) === orient(b)) {
    const v = psub(b.pts[0], a.pts[0]); cands.set(pkey(v), v);
  }
  const scored = [...cands.values()].map((v) => {
    const sh = tl.map((t) => shift(t, v));
    // count tiles whose translate coincides with an existing tile (exact)
    const hit = sh.filter((t) => keySet.has(t.key)).length;
    return { v, hit };
  }).sort((x, y) => y.hit - x.hit || Math.hypot(...num(x.v)) - Math.hypot(...num(y.v)));
  console.log(`patch ${si}: orientations used`, [...new Set(tl.map(orient))].sort((a,b)=>a-b).join(','), '; best translations (matches of', tl.length, '):');
  const seen = [];
  for (const c of scored.slice(0, 60)) {
    const [x, y] = num(c.v);
    if (c.hit < tl.length / 2) break;
    if (seen.length < 6) { console.log(`   v=(${x.toFixed(3)}, ${y.toFixed(3)}) exact (${c.v.x}; ${c.v.y}) hits ${c.hit}`); seen.push(c); }
  }
}
