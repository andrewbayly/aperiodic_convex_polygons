// Unit tests for field4.js against floating-point evaluation.
import { E, ELL, ELL2, M0, M1, ZERO, ONE } from './field4.js';
let fails = 0;
const ok = (name, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`); if (!cond) fails++; };
const l = new E([0n, 0n, 1n, 0n]);
ok('l^2 = M0 + M1·√3', l.mul(l).eq(new E([M0, M1, 0n, 0n])));
ok('ℓ ≈ 1.693872 (= |Q-12|)', Math.abs(ELL.f() - 1.693872) < 1e-5);
ok('ℓ^2 = (15279 - 4680√3)/2500', ELL2.eq(new E([15279n, -4680n, 0n, 0n], 2500n)));
const rnd = () => new E([BigInt(Math.floor(Math.random() * 41) - 20), BigInt(Math.floor(Math.random() * 41) - 20), BigInt(Math.floor(Math.random() * 41) - 20), BigInt(Math.floor(Math.random() * 41) - 20)], BigInt(1 + Math.floor(Math.random() * 12)));
let mulErr = 0, invErr = 0, addErr = 0;
for (let i = 0; i < 300; i++) {
  const a = rnd(), b = rnd();
  const m = a.mul(b);
  if (Math.abs(m.f() - a.f() * b.f()) > 1e-8 * (1 + Math.abs(m.f()))) mulErr++;
  if (Math.abs(a.add(b).f() - (a.f() + b.f())) > 1e-9 * (1 + Math.abs(a.f()) + Math.abs(b.f()))) addErr++;
  if (!a.isZero()) { const p = a.mul(a.inv()); if (!p.eq(ONE)) invErr++; }
}
ok('mul agrees with floats (300 random pairs)', mulErr === 0);
ok('add agrees with floats', addErr === 0);
ok('a·a⁻¹ = 1 exactly (300 random)', invErr === 0);
// associativity / distributivity exactly
let assoc = 0;
for (let i = 0; i < 100; i++) { const a = rnd(), b = rnd(), c = rnd(); if (!a.mul(b).mul(c).eq(a.mul(b.mul(c)))) assoc++; if (!a.mul(b.add(c)).eq(a.mul(b).add(a.mul(c)))) assoc++; }
ok('associativity and distributivity (exact)', assoc === 0);
// sign: a tiny nonzero element must still get its sign: (ℓ^2 as F element) - its float value
const tiny = new E([15279n, -4680n, 0n, 0n], 2500n).sub(ELL.mul(ELL));
ok('ℓ² - ℓ·ℓ is exactly zero', tiny.isZero());
const x = E.rat(1).add(E.s3(-1, 1).mul(E.rat(1, 1))).add(E.s3(1, 1)); // 1 - √3 + √3 = 1
ok('1 - √3 + √3 = 1', x.eq(ONE));
// an element very close to zero but nonzero: 4·(1351/780) vs √3 ... use continued-fraction convergent 97/56 ≈ √3 - 1.2e-4... test sign path anyway
const conv = E.rat(26, 15).sub(E.s3(1, 1)); // 26/15 - √3 ≈ 0.00130
ok('sign of 26/15 - √3 is +', conv.sign() === 1);
const conv2 = E.rat(1351, 780).sub(E.s3(1, 1)); // ≈ 1.9e-7 below? (1351/780 > √3)
ok('sign of 1351/780 - √3 is + (tiny positive, ~1.9e-7)', conv2.sign() === 1);
console.log(fails ? `${fails} FAILURES` : 'all field tests passed');
process.exit(fails ? 1 : 0);
