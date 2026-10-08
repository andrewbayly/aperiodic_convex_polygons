// Survivor gallery: draws all pruning survivors (coronas of the reference tile) as an SVG sheet.
// Usage: AB=299,240,208 node gallery.js H|P out.svg
import { writeFileSync } from 'fs';
import { buildExact, mirrorPoly } from './ab_exact.js';
import { makeKind, tileFromPoly, growCorona, growLayer } from './engine.js';
const mode = process.argv[2] || 'P', out = process.argv[3] || `survivors_${mode}.svg`;
const { pieces } = buildExact();
const kinds = { P: makeKind('P', pieces.A), Pb: makeKind('Pb', mirrorPoly(pieces.A)), H: makeKind('H', pieces.H), Hb: makeKind('Hb', mirrorPoly(pieces.H)) };
const ref = tileFromPoly(kinds[mode], mode === 'H' ? pieces.H : pieces.A);
const { results: seeds } = growCorona(ref, kinds, {});
const surv = seeds.filter((st) => { for (const t of st.tiles) { const r = growLayer(st, [t], kinds, { maxNodes: 30000 }); if (!r.truncated && !r.results.length) return false; } return true; });
const col = { P: '#e8a33d', Pb: '#4a90c2', H: '#b9b9b9', Hb: '#b9b9b9' };
const cols = 5, cell = 330, rows = Math.ceil(surv.length / cols);
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cell}" height="${rows * cell + 40}" font-family="sans-serif"><rect width="100%" height="100%" fill="#fff"/>`;
svg += `<text x="10" y="24" font-size="16">Tile(299,240,208): ${surv.length} surviving coronas of ${mode} (orange = T1, blue = T1bar, grey = T0; reference tile outlined in red)</text>`;
surv.forEach((st, n) => {
  const all = st.tiles.flatMap((t) => t.fpts);
  const x0 = Math.min(...all.map((p) => p[0])), x1 = Math.max(...all.map((p) => p[0]));
  const y0 = Math.min(...all.map((p) => p[1])), y1 = Math.max(...all.map((p) => p[1]));
  const s = (cell - 30) / Math.max(x1 - x0, y1 - y0);
  const ox = (n % cols) * cell + 15 + ((cell - 30) - (x1 - x0) * s) / 2, oy = 40 + Math.floor(n / cols) * cell + 15 + ((cell - 30) - (y1 - y0) * s) / 2;
  svg += `<g>`;
  for (const t of st.tiles) {
    const pts = t.fpts.map((p) => `${(ox + (p[0] - x0) * s).toFixed(1)},${(oy + (y1 - p[1]) * s).toFixed(1)}`).join(' ');
    const isRef = t.key === ref.key;
    svg += `<polygon points="${pts}" fill="${col[t.kindName]}" stroke="${isRef ? '#d00' : '#333'}" stroke-width="${isRef ? 2.5 : 1}" fill-opacity="0.85"/>`;
  }
  svg += `<text x="${(n % cols) * cell + 8}" y="${40 + Math.floor(n / cols) * cell + 14}" font-size="12">#${n + 1}</text></g>`;
});
svg += '</svg>';
writeFileSync(out, svg); console.log(mode, surv.length, 'survivors ->', out);
