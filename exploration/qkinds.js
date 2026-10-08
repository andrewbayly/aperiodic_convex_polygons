// Q: the chiral two-tile set {pentagon Pn, hexagon Hx} obtained by cutting Tile(1,1) with
//   S = vertex 8 reflected in the bisector at vertex 12,  T = vertex 12 reflected in line S-1,
//   and the segments 8-12, S-12, S-1, T-S, T-3, T-6.
// Vertex indices: 0..13 are Tile(1,1)'s vertices, 14 = S, 15 = T.
import { construct, strip, describe } from './tiles.js';
import { reflectPoint, dirIndex, psub } from './geom.js';

const base = construct();
const { V, b12 } = base;
export const S = reflectPoint(V[8], V[12], b12);
export const T = reflectPoint(V[12], S, dirIndex(psub(V[1], S)));
export const PTS = [...V, S, T];

export const FACES = {
  A: [0, 1, 14, 12, 13],
  B: [1, 2, 3, 15, 14],
  C: [3, 4, 5, 6, 15],
  D: [8, 9, 10, 11, 12],
  H: [6, 7, 8, 12, 14, 15],
};
export const pieces = Object.fromEntries(Object.entries(FACES).map(([k, f]) => [k, f.map((i) => PTS[i])]));

const mk = (name, pts) => ({ name, poly: strip(pts), corners: describe(pts) });
export const kinds = { Pn: mk('Pn', pieces.A), Hx: mk('Hx', pieces.H) };
export const kindOf = { A: 'Pn', B: 'Pn', C: 'Pn', D: 'Pn', H: 'Hx' };
