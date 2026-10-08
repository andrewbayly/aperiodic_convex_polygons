// For each of T0's coronas, test every tile in it: can that tile alone be fully surrounded,
// given the tiles already there? A tile with zero completions kills the corona (sound pruning,
// provided the search for that tile was not truncated).
import { construct, strip } from './tiles.js';
import { makeTile, growCorona, growLayer } from './engine.js';

const T = construct();
const { kinds, pieces } = T;
const core = makeTile('T0', pieces.D);
const ck = { A: 'T1', B: 'T1b', C: 'T1', E: 'T1b' };
const keys = Object.fromEntries(Object.entries(ck).map(([k, kind]) => [k, makeTile(kind, strip(pieces[k])).key]));
const present = (st) => Object.entries(keys).filter(([, k]) => st.tiles.some((t) => t.key === k)).map(([n]) => n).join('') || '-';

const budget = Number(process.argv[2] || 30000);
const { results: seeds } = growCorona(core, kinds, {});
console.log(`${seeds.length} first coronas of T0`);

let dead = 0, alive = 0, unknown = 0;
const tally = new Map();
const t0 = Date.now();
const aliveSeeds = [];
for (const st of seeds) {
  let killer = null;
  let anyTrunc = false;
  const counts = [];
  for (let i = 0; i < st.tiles.length; i++) {
    const r = growLayer(st, [st.tiles[i]], kinds, { maxNodes: budget });
    counts.push(r.truncated ? -1 : r.results.length);
    if (r.truncated) anyTrunc = true;
    else if (r.results.length === 0) { killer = i; break; }
  }
  const tag = present(st);
  const rec = tally.get(tag) || { dead: 0, alive: 0, unknown: 0 };
  if (killer !== null) { dead++; rec.dead++; }
  else if (anyTrunc) { unknown++; rec.unknown++; aliveSeeds.push(st); }
  else { alive++; rec.alive++; aliveSeeds.push(st); }
  tally.set(tag, rec);
}
console.log(`dead: ${dead}  alive: ${alive}  undecided (budget hit): ${unknown}   ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log('by cluster tiles present in the seed corona:');
for (const [tag, r] of [...tally.entries()].sort()) console.log(`  ${tag.padEnd(5)} dead ${r.dead}  alive ${r.alive}  undecided ${r.unknown}`);
