// Generates a genuine hat tiling patch by the substitution system of hatviz (third_party/hatviz).
// Usage: node gen_hat_patch.js LEVEL out.json   -> list of {label, m:[6 numbers]} affine placements of the hat outline.
import { readFileSync, writeFileSync } from 'fs';
import vm from 'vm';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'third_party/hatviz');
const level = Number(process.argv[2] || 3), out = process.argv[3] || 'hat_patch.json';
const geom = readFileSync(path.join(dir, 'geometry.js'), 'utf8');
let hat = readFileSync(path.join(dir, 'hat.js'), 'utf8');
hat = hat.slice(0, hat.indexOf('function isButtonActive'));          // drop the p5.js UI code
const ctx = { Math, console, cos: Math.cos, sin: Math.sin, PI: Math.PI, color: () => ({}), red: () => 0, green: () => 0, blue: () => 0 };
vm.createContext(ctx);
// 'const'/'let' declarations are not visible as context properties: wrap and export what we need
vm.runInContext(geom + '\n' + hat + `
globalThis.run = function (level) {
  let tiles = [H_init, T_init, P_init, F_init];
  for (let i = 1; i < level; i++) tiles = constructMetatiles(constructPatch(...tiles));
  const stream = []; tiles[0].getText(stream, ident); return stream;
};`, ctx);
const lines = ctx.run(level);
const hats = lines.map((l) => { const t = l.split(' '); return { label: t[0], m: t.slice(1).map(Number) }; });
writeFileSync(out, JSON.stringify(hats));
console.log(`level ${level}: ${hats.length} hats -> ${out}`);
