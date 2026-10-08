// Differential test runner. Usage: node runcases.js cases.json out.json [maxCoronasToPrune]
import { readFileSync, writeFileSync } from 'fs';
import { E, cadd } from './field4.js';
import { makeKind, tileFromPoly, growCorona, growLayer } from './engine.js';
const cases = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const MAXPRUNE = Number(process.argv[4] || 200);
const toE = ([n0, n1, d]) => new E([BigInt(n0), BigInt(n1), 0n, 0n], BigInt(d));
const ps = (e) => `${e.n[0]}+${e.n[1]}s/${e.d}`;
const tstr = (t) => t.pts.map((p) => `${ps(p[0])},${ps(p[1])}`).sort().join(';');
const out = [];
for (const c of cases) {
  const polys = c.kinds.map((k) => k.pts.map(([x, y]) => [toE(x), toE(y)]));
  const kinds = c.kinds.map((k, i) => makeKind(k.name, polys[i]));
  for (const r of c.refs) {
    const t0 = Date.now();
    const { results, truncated } = growCorona(tileFromPoly(kinds[r], polys[r]), kinds, { maxNodes: 4000 });
    const rec = { case: c.name, ref: r, truncated, coronas: results.map((st) => st.tiles.map(tstr).sort()), survivors: null };
    if (!truncated && results.length <= MAXPRUNE) {
      rec.survivors = [];
      for (const st of results) {
        let dead = false, tr = false;
        for (let i = 0; i < st.tiles.length && !dead; i++) { const x = growLayer(st, [st.tiles[i]], kinds, { maxNodes: 3000 }); if (x.truncated) tr = true; else if (!x.results.length) dead = true; }
        if (!dead) rec.survivors.push({ tiles: st.tiles.map(tstr).sort(), undecided: tr });
      }
    }
    out.push(rec);
    console.log(`${c.name} ref ${r}: ${results.length} coronas${truncated ? ' TRUNC' : ''}${rec.survivors ? ', ' + rec.survivors.length + ' survive' : ''} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
}
writeFileSync(process.argv[3], JSON.stringify(out));
