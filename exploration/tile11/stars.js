// Vertex stars at the angle level.
//
// A "star" is the cyclic arrangement of tile corners around a point where at least one tile has
// a corner. Because tiles are plain (no matching rules) they may meet non-edge-to-edge, so a star
// is either
//   type A: corners whose angles sum to 360° (the point is a corner of every tile around it), or
//   type B: corners summing to 180° plus one "straight" tile whose edge passes through the point
//           (a T-junction).
// Both tile kinds are convex (all angles < 180°), so these are the only possibilities.
//
// Angles are in 15° units: the full turn is 24 and a straight angle is 12.
import { describe } from './tiles.js';
import { dirIndex, psub, peq } from './geom.js';
import { strip } from './tiles.js';

export function cornerTypes(kinds) {
  const out = [];
  for (const kd of Object.values(kinds)) {
    const m = kd.corners.length;
    kd.corners.forEach((c, i) => {
      out.push({
        id: `${kd.name}.${i}`,
        kind: kd.name,
        i,
        angle: c.angle,
        start: c.edge, // edge along the clockwise-most ray of the corner, going CCW round the vertex
        end: kd.corners[(i + m - 1) % m].edge, // edge along the counter-clockwise-most ray
      });
    });
  }
  return out;
}

function compositions(types, target, minLen, maxLen) {
  const out = [];
  (function rec(seq, sum) {
    if (sum === target) { if (seq.length >= minLen) out.push([...seq]); return; }
    if (seq.length === maxLen) return;
    for (const c of types) {
      if (sum + c.angle <= target) { seq.push(c); rec(seq, sum + c.angle); seq.pop(); }
    }
  })([], 0);
  return out;
}

const rot = (a, r) => a.slice(r).concat(a.slice(0, r));

export function canonKeyA(ids) {
  let best = null;
  for (let r = 0; r < ids.length; r++) {
    const k = rot(ids, r).join(' ');
    if (best === null || k < best) best = k;
  }
  return best;
}

export function enumerateStars(types) {
  const A = new Map();
  for (const s of compositions(types, 24, 3, 4)) {
    const key = canonKeyA(s.map((c) => c.id));
    if (!A.has(key)) A.set(key, s);
  }
  const B = new Map();
  for (const s of compositions(types, 12, 2, 2)) B.set(s.map((c) => c.id).join(' '), s);

  // Edge-to-edge consistency: edges along each shared ray have the same length name.
  const withFlags = (map, type) => [...map.entries()].map(([key, seq]) => {
    let e2e = true;
    if (type === 'A') {
      for (let j = 0; j < seq.length; j++) if (seq[j].end !== seq[(j + 1) % seq.length].start) e2e = false;
    } else {
      e2e = seq[0].end === seq[1].start; // rays next to the straight tile are unconstrained
    }
    return { key, type, seq, e2e };
  });
  return { A: withFlags(A, 'A'), B: withFlags(B, 'B') };
}

// Star of a point O as realised by a list of counter-clockwise polygons (e.g. the five pieces).
// Returns {type, key, items} or null if O is a corner of no piece.
export function actualStar(O, polys, kinds) {
  const items = [];
  for (const poly of polys) {
    const q = strip(poly);
    const idx = q.findIndex((p) => peq(p, O));
    if (idx < 0) continue; // O is not a true corner of this piece
    const desc = describe(poly);
    const m = desc.length;
    let id = null;
    for (const kd of Object.values(kinds)) {
      if (kd.corners.length !== m) continue;
      for (let r = 0; r < m && !id; r++) {
        if (kd.corners.every((c, j) => desc[(j + r) % m].angle === c.angle && desc[(j + r) % m].edge === c.edge)) {
          id = `${kd.name}.${(idx - r + m) % m}`;
        }
      }
      if (id) break;
    }
    if (!id) throw new Error('piece does not match any protile');
    items.push({ id, angle: desc[idx].angle, startDir: desc[idx].startDir });
  }
  if (!items.length) return null;
  const total = items.reduce((s, it) => s + it.angle, 0);
  if (total === 24) {
    items.sort((x, y) => x.startDir - y.startDir);
    return { type: 'A', key: canonKeyA(items.map((it) => it.id)), items };
  }
  if (total === 12) {
    // The gap is the straight tile; the first item after the gap starts at the gap's far end.
    const ends = new Set(items.map((it) => (it.startDir + it.angle) % 24));
    const first = items.find((it) => !ends.has(it.startDir));
    items.sort((x, y) => ((x.startDir - first.startDir + 24) % 24) - ((y.startDir - first.startDir + 24) % 24));
    return { type: 'B', key: items.map((it) => it.id).join(' '), items };
  }
  return { type: 'partial', key: null, items, total };
}
