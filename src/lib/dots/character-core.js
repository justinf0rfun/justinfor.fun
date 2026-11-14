// Adapted from the OpenAI Dots public character implementation; see SOURCES.md.
import * as THREE from "three";
import { spring } from "motion";
const once = (factory) => {
  let result, failure;
  return () => {
    if (failure) throw failure;
    try {
      if (factory) {
        const run = factory;
        factory = null;
        result = run();
      }
      return result;
    } catch (error) {
      failure = error;
      throw error;
    }
  };
};
const De = THREE.MeshStandardMaterial;
const P = THREE.MeshPhysicalMaterial;
const Fe = "\n  float dotsHi = max(max(gl_FragColor.r, gl_FragColor.g), gl_FragColor.b);\n  float dotsLo = min(min(gl_FragColor.r, gl_FragColor.g), gl_FragColor.b);\n  float dotsChroma = dotsHi - dotsLo;\n  float dotsLightness = (dotsHi + dotsLo) * 0.5;\n  if (dotsChroma > 0.00001) {\n    float dotsAvailable = 1.0 - abs(2.0 * dotsLightness - 1.0);\n    float dotsSaturation = clamp(dotsChroma / max(dotsAvailable, 0.00001), 0.0, 1.0);\n    float dotsGain = (1.0 - pow(1.0 - dotsSaturation, 2.0)) / max(dotsSaturation, 0.00001);\n    gl_FragColor.rgb = mix(vec3(dotsLightness), gl_FragColor.rgb, dotsGain);\n  }\n";
const he = THREE.Box3;
const I = THREE.Vector3;
const O = THREE.Quaternion;
const M = THREE.Matrix4;
const s = THREE.Euler;
const e = once;
const F = () => {
};
const n = () => {
};
const t = spring;
const Pe = () => {
};
const Oe = THREE.DataTexture;
const u = 1023;
const me = 1e3;
const ge = 1001;
const ne = 1006;
const te = 1008;
const p = THREE.InstancedBufferGeometry;
const l = THREE.Float32BufferAttribute;
const C = THREE.InstancedBufferAttribute;
const o = THREE.Sphere;
const ye = THREE.Mesh;
const _ = THREE.Triangle;
function Ie(e2, n2, r) {
  let i = r.slice(1).map(([i2, a], o2) => {
    let [s2, c] = r[o2];
    return { start: s2, end: i2, to: a, generator: c === a ? null : t({ keyframes: [c, a], duration: (i2 - s2) * Re[e2] * 1e3, bounce: n2 }) };
  });
  return (t2) => {
    if (t2 <= r[0][0]) return r[0][1];
    for (let { start: n3, end: r2, to: a, generator: o2 } of i) if (t2 <= r2) return o2 ? o2.next((t2 - n3) * Re[e2] * 1e3).value : a;
    return r[r.length - 1][1];
  };
}
function L(e2) {
  return (t2) => {
    if (t2 <= e2[0][0]) return e2[0][1];
    for (let n2 = 1; n2 < e2.length; n2++) {
      let [r, i] = e2[n2], [a, o2] = e2[n2 - 1];
      if (t2 <= r) {
        let e3 = (t2 - a) / (r - a);
        return o2 + (i - o2) * e3 * e3 * (3 - 2 * e3);
      }
    }
    return e2[e2.length - 1][1];
  };
}
function Le(e2, t2) {
  let n2 = Math.max(0, t2) / Re[e2];
  if (n2 >= 1) return R;
  let r = { ...R };
  for (let [t3, i] of Ve[e2]) r[t3] = i(n2);
  return r;
}
var R;
var Re;
var ze;
var Be;
var Ve;
var He = e((() => {
  n(), R = { nod: 0, rootNod: 0, squash: 0, pulse: 1, accessoryRoll: 0, accessoryX: 0, accessoryY: 0, accessoryScale: 1, eyeX: 0, rootRoll: 0, rootYaw: 0, rootX: 0, rootY: 0, accessoryPitch: 0, eyeY: 0, eyeOpenLeft: 1, eyeOpenRight: 1 }, Re = { Felipe: 2.15, Alfred: 2.6, Todd: 2.5, Iggy: 2.1 }, ze = { Felipe: `Beret_CTRL`, Alfred: `BowTie_CTRL` }, Be = { Felipe: { rootRoll: L([[0, 0], [0.14, 0.045], [0.38, -0.1], [0.5, -0.1], [0.8, 0.018], [1, 0]]), rootNod: L([[0, 0], [0.16, -0.035], [0.38, 0.15], [0.5, 0.15], [0.84, 0], [1, 0]]), rootYaw: L([[0, 0], [0.18, -0.08], [0.46, 0.1], [0.84, 0], [1, 0]]), accessoryY: Ie(`Felipe`, 0.22, [[0, 0], [0.18, 0.055], [0.44, 0.025], [0.82, 0], [1, 0]]), accessoryRoll: Ie(`Felipe`, 0.3, [[0, 0], [0.2, -0.2], [0.44, -0.12], [0.86, 0], [1, 0]]), accessoryPitch: L([[0, 0], [0.18, -0.1], [0.4, 0.24], [0.56, 0.24], [0.84, 0], [1, 0]]), eyeOpenRight: L([[0, 1], [0.58, 1], [0.62, 0.12], [0.68, 0.12], [0.74, 1], [1, 1]]) }, Alfred: { eyeY: L([[0, 0], [0.09, -0.7], [0.23, -0.7], [0.35, 0], [1, 0]]), accessoryRoll: Ie(`Alfred`, 0.18, [[0, 0], [0.1, -0.2], [0.2, 0.13], [0.34, 0], [1, 0]]), accessoryScale: L([[0, 1], [0.12, 1.06], [0.28, 1], [1, 1]]), rootRoll: L([[0, 0], [0.12, 0.025], [0.25, -0.015], [0.36, 0], [1, 0]]), nod: L([[0, 0], [0.28, -0.035], [0.4, -0.035], [0.62, 0.36], [0.77, -0.018], [0.94, 0], [1, 0]]), eyeOpenLeft: L([[0, 1], [0.34, 1], [0.375, 0.15], [0.42, 1], [1, 1]]), eyeOpenRight: L([[0, 1], [0.34, 1], [0.375, 0.15], [0.42, 1], [1, 1]]) }, Todd: { eyeX: L([[0, 0], [0.08, -0.8], [0.24, -0.8], [0.3, 1], [0.52, 1], [0.62, 0], [1, 0]]), rootYaw: L([[0, 0], [0.06, 0], [0.2, -0.16], [0.29, -0.16], [0.44, 0.21], [0.55, 0.21], [0.76, 0], [1, 0]]), rootRoll: L([[0, 0], [0.22, -0.035], [0.46, 0.085], [0.59, 0.085], [0.84, 0], [1, 0]]), rootNod: L([[0, 0], [0.57, 0], [0.7, -0.035], [0.81, 0.085], [1, 0]]), eyeOpenLeft: L([[0, 1], [0.245, 1], [0.27, 0.12], [0.3, 1], [0.73, 1], [0.76, 0.12], [0.8, 1], [1, 1]]), eyeOpenRight: L([[0, 1], [0.245, 1], [0.27, 0.12], [0.3, 1], [0.73, 1], [0.76, 0.12], [0.8, 1], [1, 1]]) }, Iggy: { nod: L([[0, 0], [0.14, 0.19], [0.29, -0.025], [0.44, 0.17], [0.59, -0.02], [0.74, 0.13], [1, 0]]) } }, Ve = Object.fromEntries(Object.entries(Be).map(([e2, t2]) => [e2, Object.entries(t2)]));
}));
function Ue(e2) {
  if (e2.computeBoundingBox(), !e2.boundingBox) throw Error(`Fur surface has no bounds`);
  return e2.boundingBox;
}
function We(e2) {
  return e2 instanceof ye && e2.material instanceof De && e2.material.name.endsWith(`soft matte silicone`) && (e2.userData.partKind === `body` || /body/i.test(e2.name));
}
function Ge(e2) {
  return We(e2) || e2 instanceof ye && e2.material instanceof De && (e2.material.name === `Hat` && /hat/i.test(e2.name) || e2.material.name === `Thelma \xB7 soft matte silicone` && e2.name === `Thelma_Crown_floating_yellow_orb`);
}
function Ke(e2, t2, n2) {
  let r = e2.geometry.getAttribute(`position`), i = new Float32Array(r.count).fill(1);
  if (!/^(Todd|Josh)_/.test(e2.name)) return new l(i, 1);
  t2.updateMatrixWorld(true);
  let a = new M().copy(e2.matrixWorld).invert(), o2 = new M(), s2 = [];
  t2.traverse((e3) => {
    e3 instanceof ye && (!(Array.isArray(e3.material) ? e3.material : [e3.material]).some((e4) => e4.name.startsWith(`Eyes \xB7`)) && !/eyelid/i.test(e3.name) || (o2.multiplyMatrices(a, e3.matrixWorld), s2.push(Ue(e3.geometry).clone().applyMatrix4(o2))));
  });
  let c = new I();
  for (let e3 of s2) {
    let t3 = e3.getCenter(new I()), a2 = e3.getSize(new I()), o3 = a2.x / 2 + n2 * 0.012, s3 = a2.y / 2 + n2 * 0.012;
    for (let a3 = 0; a3 < r.count; a3++) {
      if (c.fromBufferAttribute(r, a3), c.z < e3.min.z - n2 * 0.15 || c.z > e3.max.z + n2 * 0.05) continue;
      let l2 = Math.hypot((c.x - t3.x) / o3, (c.y - t3.y) / s3), u2 = Math.max(0, Math.min(1, (l2 - 1) / 0.35));
      i[a3] = Math.min(i[a3], u2 * u2 * (3 - 2 * u2));
    }
  }
  return new l(i, 1);
}
var qe = e((() => {
  F();
}));
function Je(e2, t2, n2) {
  let r = e2.geometry.getAttribute(`position`), i = e2.geometry.getAttribute(`normal`), a = new l(new Float32Array(r.count * 3), 3), o2 = n2 * 0.075, s2 = n2 * 0.025;
  t2.updateMatrixWorld(true);
  let c = new M().copy(e2.matrixWorld).invert(), u2 = new M(), d = Ue(e2.geometry).clone().expandByScalar(o2 + s2), f = d.getSize(new I()), p2 = Math.ceil(f.x / o2) + 1, m = Math.ceil(f.y / o2) + 1, h = (e3, t3) => Math.floor((e3 - t3) / o2), g = (e3, t3, n3) => e3 + p2 * (t3 + m * n3), v = /* @__PURE__ */ new Map(), y = new he();
  t2.traverse((t3) => {
    if (!(t3 instanceof ye) || t3 === e2 || !(Array.isArray(t3.material) ? t3.material : [t3.material]).some((e3) => /^(Eyes|Accessories) ·/.test(e3.name))) return;
    u2.multiplyMatrices(c, t3.matrixWorld);
    let n3 = t3.geometry.getAttribute(`position`), r2 = Array.from({ length: n3.count }, (e3, t4) => new I().fromBufferAttribute(n3, t4).applyMatrix4(u2)), i2 = t3.geometry.index;
    for (let e3 = 0; e3 < (i2?.count ?? n3.count); e3 += 3) {
      let t4 = new _(...[0, 1, 2].map((t5) => r2[i2 ? i2.getX(e3 + t5) : e3 + t5]));
      if (y.setFromPoints([t4.a, t4.b, t4.c]).expandByScalar(o2).intersect(d), y.isEmpty()) continue;
      let n4 = y.min, a2 = y.max;
      for (let e4 = h(n4.z, d.min.z); e4 <= h(a2.z, d.min.z); e4++) for (let r3 = h(n4.y, d.min.y); r3 <= h(a2.y, d.min.y); r3++) for (let i3 = h(n4.x, d.min.x); i3 <= h(a2.x, d.min.x); i3++) {
        let n5 = g(i3, r3, e4), a3 = v.get(n5);
        a3 ? a3.push(t4) : v.set(n5, [t4]);
      }
    }
  });
  let b = new I(), x = new I(), S = new I(), C2 = new I(), w = new I(), T = new I(), E = (e3) => (e3 = Math.max(0, Math.min(1, e3)), e3 * e3 * (3 - 2 * e3));
  for (let e3 = 0; e3 < r.count; e3++) {
    b.fromBufferAttribute(r, e3), x.fromBufferAttribute(i, e3).normalize(), S.copy(b).addScaledVector(x, s2);
    let t3 = v.get(g(h(S.x, d.min.x), h(S.y, d.min.y), h(S.z, d.min.z)));
    if (!t3) continue;
    let c2 = o2 * o2;
    T.set(0, 0, 0);
    for (let e4 of t3) {
      e4.closestPointToPoint(S, C2), w.subVectors(S, C2);
      let t4 = w.lengthSq();
      t4 >= c2 || w.dot(x) > s2 + n2 * 0.015 || (c2 = t4, T.copy(w));
    }
    T.addScaledVector(x, -T.dot(x));
    let l2 = T.length();
    if (l2 < n2 * 1e-4) continue;
    let u3 = (1 - E(Math.sqrt(c2) / o2)) * E(l2 / (n2 * 0.012));
    T.multiplyScalar(u3 / l2), a.setXYZ(e3, T.x, T.y, T.z);
  }
  return a;
}
var Ye = e((() => {
  F(), qe();
}));
function Xe(e2, t2) {
  if (!Number.isFinite(e2) || e2 <= 0) return 0;
  let n2 = Number.isFinite(t2) ? Math.max(20, Math.min(320, t2)) : 180, r = Math.min(1, Math.max(0, (e2 - 12) / 48));
  return Math.min(z, (160 + e2 * e2 * 0.027) * n2 / 180) * r;
}
var z;
var Ze = e((() => {
  z = 8192;
}));
function Qe(e2, t2) {
  t2.updateMatrixWorld(true);
  let n2 = new M().copy(e2.matrixWorld).invert(), r = new M(), i = [e2.name];
  return t2.traverse((t3) => {
    if (!(`geometry` in t3) || !(`material` in t3) || t3 === e2) return;
    let a = t3;
    (Array.isArray(a.material) ? a.material : [a.material]).some((e3) => /^(Eyes|Accessories) ·/.test(e3.name)) && (r.multiplyMatrices(n2, a.matrixWorld), i.push(`${a.geometry.uuid}:${r.elements.map((e3) => Math.round(e3 * 1e4) / 1e4).join(`,`)}`));
  }), i.join(`|`);
}
function $e(e2, t2) {
  let n2 = e2.geometry, r = Qe(e2, t2), i = it.get(n2);
  i || (i = /* @__PURE__ */ new Map(), it.set(n2, i));
  let a = i.get(r);
  if (!a) {
    let o3 = at.get(n2)?.get(r), { geometry: s3, scale: c2 } = o3 ? tt(o3) : rt(e2, t2);
    o3 || et(n2, r, nt(s3, c2)), a = { geometry: s3, scale: c2, references: 0 }, i.set(r, a);
  }
  let o2 = a, s2 = i;
  o2.references++;
  let c = false;
  return { geometry: o2.geometry, scale: o2.scale, release() {
    c || (c = true, --o2.references === 0 && (o2.geometry.dispose(), s2.delete(r)));
  } };
}
function et(e2, t2, n2) {
  let r = at.get(e2);
  r || (r = /* @__PURE__ */ new Map(), at.set(e2, r)), r.set(t2, n2);
}
function tt(e2) {
  let t2 = new p();
  for (let [n2, r] of Object.entries(e2.attributes)) t2.setAttribute(n2, n2 === `position` || n2 === `normal` ? new l(r.array, r.itemSize) : new C(r.array, r.itemSize));
  return t2.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4]), t2.boundingBox = new he(new I().fromArray(e2.bounds), new I().fromArray(e2.bounds, 3)), t2.boundingSphere = t2.boundingBox.getBoundingSphere(new o()), { geometry: t2, scale: e2.scale };
}
function nt(e2, t2) {
  let n2 = {};
  for (let [t3, r2] of Object.entries(e2.attributes)) n2[t3] = { array: r2.array, itemSize: r2.itemSize };
  let r = e2.boundingBox ?? Ue(e2);
  return { scale: t2, attributes: n2, bounds: [...r.min.toArray(), ...r.max.toArray()] };
}
function rt(e2, t2) {
  let n2 = e2.geometry, r = n2.getAttribute(`position`), i = n2.getAttribute(`normal`), a = n2.index, s2 = Math.floor((a?.count ?? r.count) / 3), c = (e3) => a ? a.getX(e3) : e3, u2 = Ue(n2), d = Math.max(u2.getSize(new I()).y, 1e-3), f = Ke(e2, t2, d), m = Je(e2, t2, d), h = new Float64Array(s2), g = new I(), _2 = new I(), v = new I(), y = 0;
  for (let e3 = 0; e3 < s2; e3++) g.fromBufferAttribute(r, c(e3 * 3)), _2.fromBufferAttribute(r, c(e3 * 3 + 1)), v.fromBufferAttribute(r, c(e3 * 3 + 2)), y += _2.sub(g).cross(v.sub(g)).length() * 0.5, h[e3] = y;
  let b = new p();
  b.setAttribute(`position`, new l([-0.5, 0, 0, 0.5, 0, 0, -0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, 1, 0, 0.5, 1, 0], 3)), b.setAttribute(`normal`, new l([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3)), b.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4]);
  let x = new Float32Array(z * 3), S = new Float32Array(z * 3), w = new Float32Array(z * 4), T = new Float32Array(z * 3), E = new Float32Array(z * 4), ee = new Float32Array(z * 4), D = n2.getAttribute(`skinIndex`), O2 = n2.getAttribute(`skinWeight`), k = 84291, A = () => (k = Math.imul(k, 1664525) + 1013904223 >>> 0, k / 4294967296);
  for (let e3 = 0; e3 < z; e3++) {
    let t3 = A() * y, n3 = 0, a2 = s2 - 1;
    for (; n3 < a2; ) {
      let e4 = n3 + a2 >>> 1;
      h[e4] < t3 ? n3 = e4 + 1 : a2 = e4;
    }
    let o2 = [c(n3 * 3), c(n3 * 3 + 1), c(n3 * 3 + 2)], l2 = Math.sqrt(A()), u3 = A(), d2 = [1 - l2, l2 * (1 - u3), l2 * u3];
    g.set(0, 0, 0), _2.set(0, 0, 0), v.set(0, 0, 0);
    let p2 = 0, b2 = /* @__PURE__ */ new Map();
    for (let e4 = 0; e4 < 3; e4++) {
      let t4 = o2[e4], n4 = d2[e4];
      for (let e5 = 0; e5 < 3; e5++) g.setComponent(e5, g.getComponent(e5) + r.getComponent(t4, e5) * n4), _2.setComponent(e5, _2.getComponent(e5) + i.getComponent(t4, e5) * n4), v.setComponent(e5, v.getComponent(e5) + m.getComponent(t4, e5) * n4);
      if (p2 += f.getX(t4) * n4, D && O2) for (let e5 = 0; e5 < 4; e5++) {
        let r2 = D.getComponent(t4, e5);
        b2.set(r2, (b2.get(r2) ?? 0) + O2.getComponent(t4, e5) * n4);
      }
    }
    g.toArray(x, e3 * 3), _2.normalize().toArray(S, e3 * 3), v.toArray(T, e3 * 3);
    let C2 = [...b2].sort((e4, t4) => t4[1] - e4[1]).slice(0, 4), k2 = C2.reduce((e4, t4) => e4 + t4[1], 0) || 1;
    C2.forEach(([t4, n4], r2) => {
      E[e3 * 4 + r2] = t4, ee[e3 * 4 + r2] = n4 / k2;
    }), w.set([A(), 0.72 + A() * 0.56, Math.floor(A() * 16), p2], e3 * 4);
  }
  for (let [e3, t3, n3] of [[`plushRoot`, x, 3], [`plushNormal`, S, 3], [`plushSeed`, w, 4], [`plushGroom`, T, 3]]) b.setAttribute(e3, new C(t3, n3));
  return D && O2 && (b.setAttribute(`skinIndex`, new C(E, 4)), b.setAttribute(`skinWeight`, new C(ee, 4))), b.boundingBox = u2.clone().expandByScalar(d * 0.1), b.boundingSphere = b.boundingBox.getBoundingSphere(new o()), { geometry: b, scale: d };
}
var it;
var at;
var ot = e((() => {
  F(), qe(), Ye(), Ze(), it = /* @__PURE__ */ new WeakMap(), at = /* @__PURE__ */ new WeakMap();
}));
function st(e2) {
  let t2 = e2;
  return () => (t2 = Math.imul(t2, 1664525) + 1013904223 >>> 0, t2 / 4294967296);
}
function ct(e2, t2) {
  let n2 = new Oe(e2, B, B, u);
  return n2.wrapS = n2.wrapT = t2 ? me : ge, n2.magFilter = ne, n2.minFilter = te, n2.colorSpace = ``, n2.generateMipmaps = true, n2.needsUpdate = true, n2;
}
function lt(e2, t2, n2, r, i, a, o2) {
  let s2 = r - t2, c = i - n2, l2 = 1 / Math.max(s2 * s2 + c * c, 1e-5), u2 = a + 0.6, d = Math.floor(Math.min(t2, r) - u2), f = Math.ceil(Math.max(t2, r) + u2), p2 = Math.floor(Math.min(n2, i) - u2), m = Math.ceil(Math.max(n2, i) + u2);
  for (let r2 = p2; r2 <= m; r2++) for (let i2 = d; i2 <= f; i2++) {
    let a2 = Math.max(0, Math.min(1, ((i2 + 0.5 - t2) * s2 + (r2 + 0.5 - n2) * c) * l2)), d2 = i2 + 0.5 - t2 - s2 * a2, f2 = r2 + 0.5 - n2 - c * a2, p3 = Math.max(0, Math.min(1, u2 - Math.sqrt(d2 * d2 + f2 * f2)));
    if (p3 === 0) continue;
    let m2 = (r2 & B - 1) * B + (i2 & B - 1);
    e2[m2] += (o2 - e2[m2]) * p3;
  }
}
function ut() {
  let e2 = st(1885957221), t2 = new Float32Array(B * B).fill(0.3);
  for (let n3 = 0; n3 < 12500; n3++) {
    let n4 = e2() * B, r = e2() * B, i = n4 / B * gt, a = r / B * gt, o2 = 1.05 + 0.52 * Math.sin(i + Math.sin(a)) + 0.24 * Math.cos(2 * a - i) + (e2() - 0.5) * 0.8, s2 = Math.cos(o2), c = Math.sin(o2), l2 = 10 + e2() * 21, u2 = (e2() - 0.5) * 5, d = (e2() - 0.5) * 7, f = 0.25 + e2() * 0.33, p2 = 0.38 + e2() * 0.54, m = n4, h = r;
    for (let e3 = 1; e3 <= 7; e3++) {
      let i2 = e3 / 7, a2 = d * i2 * i2 + u2 * Math.sin(i2 * Math.PI), o3 = n4 + s2 * l2 * i2 - c * a2, g = r + c * l2 * i2 + s2 * a2;
      lt(t2, m, h, o3, g, f * (1 - 0.6 * i2), p2 * (0.79 + 0.21 * i2)), m = o3, h = g;
    }
  }
  let n2 = new Uint8Array(B * B * 4);
  for (let e3 = 0; e3 < B; e3++) for (let r = 0; r < B; r++) {
    let i = e3 * B + r, a = t2[e3 * B + (r + 1 & B - 1)] - t2[e3 * B + (r - 1 & B - 1)], o2 = t2[(e3 + 1 & B - 1) * B + r] - t2[(e3 - 1 & B - 1) * B + r], s2 = -a * 1.8, c = -o2 * 1.8, l2 = 1 / Math.sqrt(s2 * s2 + c * c + 1);
    n2[i * 4] = Math.round(t2[i] * 255), n2[i * 4 + 1] = Math.round((s2 * l2 * 0.5 + 0.5) * 255), n2[i * 4 + 2] = Math.round((c * l2 * 0.5 + 0.5) * 255), n2[i * 4 + 3] = 255;
  }
  return ct(n2, true);
}
function dt(e2) {
  let t2 = st(1919905652);
  for (let n2 = 0; n2 < 16; n2++) {
    let r = n2 % 4 * V, i = Math.floor(n2 / 4) * V, a = (t2() - 0.5) * 10;
    for (let n3 = 0; n3 < 112; n3++) {
      let o2 = 7 + (n3 + t2()) / 112 * 114, s2 = 4 + t2() * 7, c = 39 + t2() * 46, l2 = a + (t2() - 0.5) * 15, u2 = (t2() - 0.5) * 5, d = 0.8 + t2() * 0.7, f = 0.4 + t2() * 0.25;
      for (let t3 = Math.floor(s2); t3 <= Math.ceil(s2 + c); t3++) {
        let n4 = (t3 + 0.5 - s2) / c;
        if (n4 < 0 || n4 > 1) continue;
        let a2 = o2 + l2 * n4 * n4 + u2 * Math.sin(n4 * Math.PI), p2 = d * (1 - n4 * 0.75), m = Math.max(0, Math.min(1, (n4 - 0.32) / 0.68)), h = 1 - m * m * (3 - 2 * m), g = Math.min(1, (t3 + 0.5 - s2) / 2), _2 = Math.max(4, Math.floor(a2 - p2 - 1)), v = Math.min(123, Math.ceil(a2 + p2 + 1));
        for (let n5 = _2; n5 <= v; n5++) {
          let o3 = Math.max(0, Math.min(1, p2 + 0.5 - Math.abs(n5 + 0.5 - a2))), s3 = Math.min(n5 - 3.5, 123.5 - n5), c2 = Math.min(1, s3 / 9), l3 = o3 * f * h * g * c2, u3 = ((i + t3) * B + r + n5) * 4 + 1;
          e2[u3] = Math.round(Math.min(0.8, 1 - (1 - e2[u3] / 255) * (1 - l3)) * 255);
        }
      }
    }
  }
}
function ft() {
  let e2 = st(1751214450), t2 = new Uint8Array(B * B * 4);
  for (let e3 = 0; e3 < B; e3++) {
    let n2 = Math.round((0.72 + e3 % V / V * 0.25) * 255);
    for (let r = 0; r < B; r++) {
      let i = (e3 * B + r) * 4;
      t2[i] = t2[i + 2] = n2;
    }
  }
  for (let n2 = 0; n2 < 16; n2++) {
    let r = n2 % 4 * V, i = Math.floor(n2 / 4) * V, a = 11 + Math.floor(e2() * 6), o2 = (e2() - 0.5) * 12;
    for (let n3 = 0; n3 < a; n3++) {
      let s2 = 15 + (n3 + 0.15 + e2() * 0.7) / a * 95, c = 4 + e2() * 3, l2 = 73 + e2() * 43, u2 = o2 + (e2() - 0.5) * 15, d = (e2() - 0.5) * 8, f = 0.48 + e2() * 0.38, p2 = 0.83 + e2() * 0.17;
      for (let e3 = Math.floor(c); e3 <= Math.min(123, Math.ceil(c + l2)); e3++) {
        let n4 = (e3 + 0.5 - c) / l2;
        if (n4 < 0 || n4 > 1) continue;
        let a2 = s2 + u2 * n4 * n4 + d * Math.sin(n4 * Math.PI), o3 = f * (1 - n4 * 0.86), m = Math.min(1, (1 - n4) * l2), h = Math.round(p2 * (0.73 + 0.27 * n4) * 255), g = Math.max(4, Math.floor(a2 - o3 - 1)), _2 = Math.min(123, Math.ceil(a2 + o3 + 1));
        for (let n5 = g; n5 <= _2; n5++) {
          let s3 = Math.max(0, Math.min(1, o3 + 0.5 - Math.abs(n5 + 0.5 - a2))) * m, c2 = ((i + e3) * B + r + n5) * 4, l3 = Math.round(s3 * 255);
          l3 <= t2[c2 + 3] || (t2[c2] = t2[c2 + 2] = h, t2[c2 + 3] = l3);
        }
      }
    }
  }
  return dt(t2), ct(t2, false);
}
function mt() {
  let e2 = ut(), t2 = ft(), n2 = { pile: e2.image.data, cards: t2.image.data };
  return e2.dispose(), t2.dispose(), n2;
}
function ht() {
  vt ??= mt(), _t ??= { pile: ct(vt.pile, true), cards: ct(vt.cards, false), users: 0 };
  let e2 = _t;
  e2.users++;
  let t2 = false;
  return { pile: e2.pile, cards: e2.cards, release() {
    t2 || (t2 = true, e2.users--, e2.users === 0 && (e2.pile.dispose(), e2.cards.dispose(), _t === e2 && (_t = void 0)));
  } };
}
var B;
var V;
var gt;
var _t;
var vt;
var yt = e((() => {
  F(), B = 512, V = B / 4, gt = Math.PI * 2;
}));
function kn(e2) {
  let t2 = /* @__PURE__ */ new Map(), n2 = /* @__PURE__ */ new Map(), r = e2.clone();
  return An(e2, r, function(e3, r2) {
    t2.set(r2, e3), n2.set(e3, r2);
  }), r.traverse(function(e3) {
    if (!e3.isSkinnedMesh) return;
    let r2 = e3, i = t2.get(e3), a = i.skeleton.bones;
    r2.skeleton = i.skeleton.clone(), r2.bindMatrix.copy(i.bindMatrix), r2.skeleton.bones = a.map(function(e4) {
      return n2.get(e4);
    }), r2.bind(r2.skeleton, r2.bindMatrix);
  }), r;
}
function An(e2, t2, n2) {
  n2(e2, t2);
  for (let r = 0; r < e2.children.length; r++) An(e2.children[r], t2.children[r], n2);
}
var jn = e((() => {
}));
function Mn(e2) {
  let t2 = /* @__PURE__ */ new Map();
  return { clone(n2) {
    let r = t2.get(n2);
    if (r) return r;
    let i = n2.clone();
    return i instanceof De && (i.metalness = 0, i instanceof P && (i.clearcoat = 0, i.transmission = 0), (n2.name.endsWith(`soft matte silicone`) || n2.name.endsWith(` - Body`)) && (n2.name.endsWith(` - Body`) && (i.name = `${e2} \xB7 soft matte silicone`), i.roughness = 0.52, e2 === `Alfred` && i.color.set(`#ffc120`), e2 === `Felipe` && i.color.set(`#35a0fd`), e2 === `Iggy` && i.color.set(`#da61dc`), i instanceof P && (i.specularIntensity = 0.9)), (n2.name === `Accessories \xB7 soft charcoal` || /^(Bowtie|Glasses|Hat|Jojo - Glasses)/.test(n2.name)) && (i.color.set(`#2d2e2f`), i.roughness = 0.5, i instanceof P && (i.specularIntensity = 1)), (n2.name === `Eyes \xB7 deep charcoal` || /^Eyes/.test(n2.name)) && (i.roughness = 0.55), i.onBeforeCompile = (e3) => {
      e3.fragmentShader = e3.fragmentShader.replace(`#include <colorspace_fragment>`, `#include <colorspace_fragment>
#ifdef TONE_MAPPING
${Fe}
#endif`);
    }, i.customProgramCacheKey = () => `dots-solid-grade-v2`), t2.set(n2, i), i;
  }, dispose() {
    t2.forEach((e3) => e3.dispose());
  } };
}
var Nn = e((() => {
  F(), Pe();
}));
function Pn(e2) {
  let t2 = Ln[e2];
  if (!t2) throw Error(`Unknown character ${e2}`);
  let n2 = (n3) => {
    let r2 = n3 / t2.duration * 2.2, i = { lift: t2.jump * Q(r2, [[0, 0], [0.16, 0], [0.34, -0.1], [0.62, 1], [0.82, 0.88], [1.1, 0], [1.28, 0.12], [1.58, 0], [2.2, 0]]), squash: t2.squash * Q(r2, [[0, 0], [0.15, 0.15], [0.34, 1], [0.49, -0.8], [0.86, -0.12], [1.1, 0.9], [1.25, 0.35], [1.52, 0], [2.2, 0]]), bendSide: t2.lean * Q(r2, [[0, 0], [0.34, -0.6], [0.7, 0.6], [1.1, -0.3], [1.65, 0], [2.2, 0]]), roll: t2.lean * Q(r2, [[0, 0], [0.34, -1], [0.68, 0.8], [1.13, -0.25], [1.65, 0], [2.2, 0]]), yaw: t2.spin ? t2.spin * X((r2 - 0.35) / 1.22) : Q(r2, [[0, 0], [0.3, -0.13], [0.8, 0.2], [1.3, -0.035], [1.9, 0], [2.2, 0]]), pitch: Q(r2, [[0, 0], [0.32, -0.06], [0.68, 0.05], [1.1, -0.025], [1.65, 0], [2.2, 0]]), eyeY: 0.02 * Z(r2, 0.2, 0.65, 1.55), eyeX: 0.012 * Q(r2, [[0, 0], [0.45, -1], [0.9, 1], [1.6, 0], [2.2, 0]]), blink: Math.max(Z(r2, 0.19, 0.27, 0.4), Z(r2, 1.04, 1.13, 1.26)), hatLift: 0.14 * Z(r2, 0.37, 0.76, 1.42), hatTilt: 0.15 * Q(r2, [[0, 0], [0.38, -0.25], [0.75, 1], [1.22, -0.3], [1.64, 0], [2.2, 0]]), glassesLift: 0.035 * Z(r2, 0.39, 0.8, 1.55), glassesTilt: 0.05 * Q(r2, [[0, 0], [0.5, -1], [1, 0.4], [1.65, 0], [2.2, 0]]), bowtieTilt: 0.15 * Q(r2, [[0, 0], [0.4, -1], [0.76, 0.8], [1.18, -0.4], [1.76, 0], [2.2, 0]]) };
    return e2 === `felipe` && (i.bodyRoll = Math.PI / 180 * $(n3, [[0, 0], [0.133333, 0], [0.3, -13.8789], [0.4, -8.6567], [0.5, 14.1311], [0.633333, 97.4998], [0.766667, 151.2584], [0.866667, 166.273], [1, 175.8093], [1.133333, 179.8524], [1.266667, 180.9174], [1.433333, 180.5718], [1.666667, 180], [2.4, 180]]), i.roll = 0, i.bendSide = 0, i.lift = n3 < 1.18 ? $(n3, [[0, 0], [0.133333, 0], [0.3, -0.053867], [0.4, -0.012298], [0.5, 0.049576], [0.633333, 0.115897], [0.766667, 0.141992], [0.866667, 0.116539], [1, 0.040373], [1.1, -0.018902], [1.18, -0.047]]) : Vn(n3 - 1.18, -0.047), i.squash = n3 < 1.18 ? $(n3, [[0, 0], [0.133333, 4732e-6], [0.3, 0.074765], [0.366667, 0.07909], [0.4, 0.059084], [0.5, -0.051063], [0.633333, 0.03199], [0.766667, -1943e-6], [0.866667, 0], [1, 2121e-6], [1.1, 0.050232], [1.18, 0.068928]]) : Vn(n3 - 1.18, 0.068928), n3 >= 1.85 && (i.lift *= 1 - X((n3 - 1.85) / 0.15), i.squash *= 1 - X((n3 - 1.85) / 0.15)), i.x = $(n3, [[0, 0], [0.133333, 0], [0.3, 0.014268], [0.4, 7695e-6], [0.5, -8355e-6], [0.633333, -0.027552], [0.766667, -0.033908], [0.866667, -0.025117], [1, -4279e-6], [1.066667, 0]]), i.z = $(n3, [[0, 0], [0.133333, 0], [0.3, 0.017184], [0.4, 0.014543], [0.5, 9668e-6], [0.633333, 3225e-6], [0.766667, 0]]), i.yaw = n3 < 1.433333 ? $(n3, [[0, 0], [0.133333, 0.18822], [0.3, 0.5538], [0.4, 0.57033], [0.5, 0.47356], [0.633333, 0.19072], [0.766667, -0.02744], [0.866667, -0.09753], [1, -0.11711], [1.133333, -0.07472], [1.266667, -8e-5], [1.433333, 0.0669]]) : Vn(n3 - 1.433333, 0.0669, 12, 16) * (1 - X((n3 - 2) / 0.15)), i.pitch = $(n3, [[0, 0], [0.133333, 0.06358], [0.3, 0.17783], [0.4, 0.18263], [0.5, 0.15948], [0.633333, 0.09751], [0.766667, 0.02179], [0.866667, -0.01499], [1, -0.01385], [1.133333, -211e-5], [1.266667, 0]]), i.bodyYaw = 0.11364, i.bodyPitch = $(n3, [[0, -0.023165], [0.133333, -0.023165], [0.3, 0.193017], [0.4, 0.110523], [0.5, -0.04268], [0.633333, -0.120791], [0.766667, -0.055441], [0.866667, -0.023165]]), i.eyeX = $(n3, [[0, 0], [0.133333, 0], [0.3, -2256e-6], [0.4, -768e-6], [0.5, 2703e-6], [0.633333, 7846e-6], [0.766667, 0.010344], [0.866667, 7662e-6], [1, 1305e-6], [1.066667, 0]]) - i.x, i.eyeY = $(n3, [[0, 0], [0.133333, 0], [0.3, -0.053882], [0.4, -0.027594], [0.5, 0.018236], [0.633333, 0.077228], [0.766667, 0.11729], [0.866667, 0.127592], [1, 0.096216], [1.1, 0.046007], [1.2, 0], [1.3, -0.015491], [1.366667, -0.010146], [1.466667, 2458e-6], [1.666667, 0]]) - i.lift, i.eyeZ = $(n3, [[0, 0], [0.133333, 1199e-6], [0.2, 0.018093], [0.3, 0.045149], [0.366667, 0.043927], [0.4, 0.036781], [0.433333, 0.020189], [0.5, 1e-5], [0.633333, -6231e-6], [0.766667, 392e-6], [0.866667, 1094e-6], [1, 1964e-6], [1.1, 0.014497], [1.166667, 0.019582], [1.2, 0.018714], [1.3, 9829e-6], [1.466667, 1829e-6], [1.666667, 0]]) - i.z, i.blink = Math.max(Hn(n3, 0.166667, 0.266667, 0.3, 0.433333), Hn(n3, 1.1, 1.2, 1.233333, 1.366667)), i.hatLift = $(n3, [[0, 0], [0.133333, 0], [0.3, 0.022], [0.4, -6e-3], [0.5, 0.10429], [0.633333, 0.31835], [0.766667, 0.3628], [0.866667, 0.34043], [1, 0.21451], [1.133333, -278e-5], [1.266667, -17e-4], [1.433333, -7e-5], [1.666667, 0]]), i.hatTilt = $(n3, [[0, 0], [0.3, 0.01472], [0.4, 0.01745], [0.5, -0.26054], [0.633333, -0.52484], [0.766667, -0.48741], [0.866667, -0.3229], [1, -0.05369], [1.133333, -0.01945], [1.266667, -0.05307], [1.433333, -0.0194], [1.666667, 0]])), e2 === `alfred` && (i.eyeOpen = Bn(n3, 0.04, 0.32, 1.52, 1.82), i.blink = 0), e2 === `jojo` && (i.yaw = $(n3, [[0, 0], [0.1, 0], [0.2, 0.086503], [0.3, 0.349829], [0.366667, 0.436332], [0.4, 0.427247], [0.5, 0.26669], [0.6, -0.197826], [0.7, -1.276099], [0.8, -3.403392], [0.9, -5.076971], [1, -5.772477], [1.1, -5.974104], [1.2, -6.031639], [1.4, -6.038839], [1.6, -6.07569], [1.8, -6.239432], [2, -6.289845], [2.2, -6.284221], [2.4, -Math.PI * 2]])), i;
  }, r = { ambient: { label: `Ambient`, duration: 6, loop: true, sample: (t3) => {
    let n3 = t3 / 6 * Math.PI * 2;
    return { lift: 0.016 * Math.sin(n3), yaw: 0.045 * Math.sin(n3), roll: 0.016 * Math.sin(n3 * 2), bendSide: 0.018 * Math.sin(n3), eyeX: 9e-3 * Math.sin(n3), eyeY: 4e-3 * Math.sin(n3 * 2), blink: e2 === `alfred` ? 0 : Math.max(Z(t3, 2.3, 2.4, 2.55), Z(t3, 5.1, 5.2, 5.34)), hatTilt: 0.014 * Math.sin(n3 * 2), glassesTilt: 8e-3 * Math.sin(n3 * 2), bowtieTilt: 0.014 * Math.sin(n3 * 2) };
  } }, excite: { label: `Excite`, duration: t2.duration, loop: false, sample: n2 }, body: { label: e2 === `felipe` ? `Independent body roll` : `Body turn + squash`, duration: t2.duration, loop: false, sample: (t3) => {
    let r2 = n2(t3);
    return Object.fromEntries((e2 === `felipe` ? [`bodyRoll`, `bodyYaw`, `bodyPitch`, `squash`] : [`yaw`, `pitch`, `roll`, `bendSide`, `squash`]).map((e3) => [e3, r2[e3]]));
  } }, jump: { label: `Jump + squash`, duration: t2.duration, loop: false, sample: (e3) => {
    let t3 = n2(e3);
    return { lift: t3.lift, squash: t3.squash };
  } } };
  if (e2 !== `jojo` && (r.eyes = { label: e2 === `alfred` ? `Eye expression` : `Eyes + blink`, duration: 1.4, loop: false, sample: (t3) => ({ eyeX: 0.018 * Q(t3, [[0, 0], [0.25, -1], [0.65, 1], [1.2, 0], [1.4, 0]]), eyeY: 6e-3 * Z(t3, 0.1, 0.5, 1.2), blink: e2 === `alfred` ? 0 : Z(t3, 0.7, 0.8, 0.96), eyeOpen: e2 === `alfred` ? Bn(t3, 0.04, 0.32, 1.06, 1.36) : 0 }) }), e2 === `felipe` ? r.hat = { label: `Hat jump`, duration: 1.4, loop: false, sample: (e3) => ({ hatLift: 0.16 * Z(e3, 0.05, 0.5, 1.15), hatTilt: 0.16 * Q(e3, [[0, 0], [0.42, -1], [0.85, 0.4], [1.3, 0], [1.4, 0]]) }) } : r.glasses = { label: `Glasses`, duration: 1.2, loop: false, sample: (e3) => ({ glassesLift: 0.045 * Z(e3, 0.05, 0.42, 1.1), glassesTilt: 0.08 * Q(e3, [[0, 0], [0.35, -1], [0.72, 0.3], [1.1, 0], [1.2, 0]]) }) }, e2 === `alfred` && (r.bowtie = { label: `Bowtie`, duration: 1.2, loop: false, sample: (e3) => ({ bowtieTilt: 0.22 * Q(e3, [[0, 0], [0.25, -1], [0.5, 1], [0.78, -0.3], [1.15, 0], [1.2, 0]]) }) }), e2 === `felipe`) for (let e3 of Object.values(r)) e3.relative = [`bodyRoll`], e3.preserve = [`bodyYaw`, `bodyPitch`];
  return r;
}
function Fn(e2, t2) {
  e2.updateWorldMatrix(true, true);
  let n2 = /* @__PURE__ */ new Map(), r = [], i = [];
  e2.traverse((e3) => {
    e3.isBone && (n2.set(e3.name, e3), r.push(e3)), e3.isSkinnedMesh && (i.push(e3), e3.frustumCulled = false);
  });
  for (let e3 of [`Root_CTRL`, `Body_CTRL`, ...Rn]) if (!n2.has(e3)) throw Error(`Missing bone ${e3}`);
  let a = t2, o2 = new Map(r.map((e3) => [e3, e3.matrix.clone()]));
  r.forEach((e3) => {
    e3.matrixAutoUpdate = false;
  });
  let c = n2.get(`Root_CTRL`), l2 = e2.matrixWorld.clone().invert(), u2 = l2.clone().multiply(c.matrixWorld), d = t2 === `jojo` ? `Sunglasses_CTRL` : `Glasses_CTRL`, f = new Map([`Beret_CTRL`, d, `BowTie_CTRL`, `Face_CTRL`].filter((e3) => n2.has(e3)).map((e3) => [e3, new M()])), p2 = new M(), m = new M(), h = new I(), g = new M(), _2 = new M(), v = false, y = new M(), b = new M(), x = new M(), S = new M(), C2 = new M(), w = new s(0, 0, 0, `YXZ`), T = new O(), E = new I(), ee = new I(), D = new I(), k = new I(1, 1, 1), A = new I(), j = new M(), te2 = new M(), ne2 = new M();
  function re() {
    e2.updateWorldMatrix(true, true), i.forEach((e3) => e3.skeleton.update());
  }
  function ie(t3, { x: r2 = 0, y: i2 = 0, z: o3 = 0, tilt: s2 = 0, height: c2 = 1 } = {}) {
    let u3 = n2.get(t3);
    u3 && (C2.copy(b).multiply(l2).multiply(v || a === `felipe` ? f.get(t3) : u3.matrixWorld), C2.decompose(E, T, ee), C2.compose(E, T, k), D.copy(E), j.makeRotationZ(s2), te2.makeScale(1, c2, 1), S.makeTranslation(D.x + r2, D.y + i2, D.z + o3).multiply(j).multiply(te2), ne2.makeTranslation(-D.x, -D.y, -D.z), S.multiply(ne2).multiply(C2), S.premultiply(y).premultiply(e2.matrixWorld), x.copy(u3.parent.matrixWorld).invert().multiply(S), u3.matrix.copy(x), u3.updateMatrixWorld(true));
  }
  return { bones: n2, apply(a2) {
    for (let e3 of r) e3.matrix.copy(o2.get(e3));
    if (e2.updateWorldMatrix(true, true), l2.copy(e2.matrixWorld).invert(), T.setFromEuler(w.set(a2.pitch, a2.yaw, a2.roll, `YXZ`)), y.compose(A.set(a2.x, a2.lift, a2.z), T, k), b.copy(y).invert(), S.copy(e2.matrixWorld).multiply(y).multiply(u2), c.matrix.copy(c.parent.matrixWorld).invert().multiply(S), c.updateMatrixWorld(true), t2 === `felipe`) for (let [e3, t3] of f) t3.copy(n2.get(e3).matrixWorld);
    let s2 = 1 - a2.squash, C3 = 1 / Math.sqrt(s2), E2 = n2.get(`body_base`);
    if (t2 === `felipe` ? (h.setFromMatrixPosition(n2.get(`Body_CTRL`).matrixWorld).applyMatrix4(x.copy(E2.matrixWorld).invert()), p2.makeTranslation(h.x, h.y, h.z).multiply(te2.makeScale(C3, s2, C3)).multiply(ne2.makeTranslation(-h.x, -h.y, -h.z)), E2.matrix.multiply(p2)) : E2.matrix.scale(ee.set(C3, s2, C3)), Rn.forEach((e3, t3) => {
      let r2 = [0, 0.25, 0.35, 0.25, 0.15][t3], i2 = n2.get(e3);
      T.setFromEuler(w.set(a2.bendForward * r2, 0, a2.bendSide * r2, `XYZ`)), i2.matrix.multiply(j.makeRotationFromQuaternion(T)), i2.updateMatrixWorld(true);
    }), v = !!(a2.bodyYaw || a2.bodyPitch || a2.bodyRoll), v) {
      if (t2 !== `felipe`) for (let [e3, t3] of f) t3.copy(n2.get(e3).matrixWorld);
      m.copy(b).multiply(l2).multiply(n2.get(`Body_CTRL`).matrixWorld), h.setFromMatrixPosition(m), g.extractRotation(m), _2.copy(g).invert(), T.setFromEuler(w.set(a2.bodyPitch, a2.bodyYaw, 0, `YXZ`)), p2.makeTranslation(h.x, h.y, h.z).multiply(j.makeRotationFromQuaternion(T)), p2.multiply(g).multiply(j.makeRotationZ(a2.bodyRoll)).multiply(_2), p2.multiply(ne2.makeTranslation(-h.x, -h.y, -h.z));
      let r2 = n2.get(`body_base`);
      S.copy(e2.matrixWorld).multiply(y).multiply(p2).multiply(b).multiply(l2).multiply(r2.matrixWorld), r2.matrix.copy(r2.parent.matrixWorld).invert().multiply(S), r2.updateMatrixWorld(true);
    }
    ie(`Beret_CTRL`, { y: a2.hatLift, tilt: a2.hatTilt }), ie(d, { y: a2.glassesLift, tilt: a2.glassesTilt }), ie(`BowTie_CTRL`, { tilt: a2.bowtieTilt }), ie(`Face_CTRL`, { x: a2.eyeX, y: a2.eyeY, z: a2.eyeZ, height: t2 === `alfred` ? 1 : 1 - (t2 === `felipe` ? 0.945 : 0.92) * a2.blink });
    for (let e3 of i) e3.morphTargetDictionary?.eyeOpen !== void 0 && (e3.morphTargetInfluences[e3.morphTargetDictionary.eyeOpen] = a2.eyeOpen);
    re();
  }, reset() {
    for (let e3 of r) e3.matrix.copy(o2.get(e3));
    for (let e3 of i) e3.morphTargetInfluences?.fill(0);
    re();
  } };
}
function In(e2, { name: t2 = `felipe`, transition: n2 = 0.18, reducedMotion: r = false } = {}) {
  let i = Fn(e2, t2), a = Pn(t2), o2 = { ...Y }, s2 = { name: `ambient`, time: 0, playing: false, loop: true, returnTo: null }, c = { ...o2 }, l2 = { ...Y }, u2 = 0, d = 0, f = null, p2 = (e3) => {
    for (let [t3, n3] of Object.entries(e3)) if (!(t3 in Y) || !Number.isFinite(n3)) throw Error(`Invalid pose channel ${t3}`);
    if (e3.squash !== void 0 && (e3.squash <= -0.5 || e3.squash >= 0.5)) throw Error(`Squash must be between -0.5 and 0.5`);
    if (e3.eyeOpen !== void 0 && (e3.eyeOpen < 0 || e3.eyeOpen > 1)) throw Error(`Eye opening must be between 0 and 1`);
    if (e3.blink !== void 0 && (e3.blink < 0 || e3.blink > 1)) throw Error(`Blink must be between 0 and 1`);
  };
  function m(e3, t3, n3 = 1) {
    let r2 = e3.sample(t3), i2 = { ...Y, ...r2 };
    for (let t4 of e3.preserve ?? []) r2[t4] === void 0 && (i2[t4] = l2[t4]);
    for (let t4 of e3.relative ?? []) i2[t4] += l2[t4];
    return i2.squash *= n3, p2(i2), i2;
  }
  function h(e3, t3) {
    let n3 = e3.sample(0), r2 = e3.sample(e3.duration);
    for (let i2 of e3.relative ?? []) l2[i2] += t3 * ((r2[i2] ?? 0) - (n3[i2] ?? 0));
  }
  function g(e3, t3) {
    for (let n3 of Object.keys(o2)) o2[n3] = c[n3] + (Un.has(n3) ? Wn(c[n3], e3[n3]) : e3[n3] - c[n3]) * t3;
    t3 === 1 && Object.assign(o2, e3);
  }
  let _2 = { values: o2, motions: a, bones: i.bones, get state() {
    return { ...s2, duration: a[s2.name]?.duration ?? 0, blending: u2 < d };
  }, play(e3, { loop: t3 = a[e3]?.loop ?? false, returnTo: i2 = t3 ? null : `ambient`, fade: p3 = n2, restart: m2 = false } = {}) {
    if (!a[e3]) throw Error(`Unknown motion ${e3}`);
    if (i2 !== null && !a[i2]) throw Error(`Unknown return motion ${i2}`);
    if (!Number.isFinite(p3) || p3 < 0) throw Error(`Fade must be nonnegative`);
    return r ? false : s2.playing && s2.name === e3 && !m2 ? (s2.loop = t3, s2.returnTo = i2, false) : (c = { ...o2 }, l2 = { ...o2 }, u2 = 0, d = p3, f = null, s2 = { name: e3, time: 0, playing: true, loop: t3, returnTo: i2 }, true);
  }, ambient(e3 = {}) {
    return _2.play(`ambient`, { loop: true, ...e3 });
  }, excite(e3 = {}) {
    return _2.play(`excite`, { loop: false, returnTo: `ambient`, ...e3 });
  }, pose(e3, { duration: t3 = n2 } = {}) {
    if (p2(e3), !Number.isFinite(t3) || t3 < 0) throw Error(`Duration must be nonnegative`);
    return r ? false : (c = { ...o2 }, f = { ...o2, ...e3 }, u2 = 0, d = t3, s2.playing = false, t3 === 0 && (Object.assign(o2, f), i.apply(o2)), true);
  }, addMotion(e3, t3) {
    if (!t3 || typeof t3.sample != `function` || !Number.isFinite(t3.duration) || t3.duration <= 0) throw Error(`A motion needs a sample function and positive duration`);
    return a[e3] = { label: e3, loop: false, relative: a.ambient.relative ?? [], preserve: a.ambient.preserve ?? [], ...t3 }, _2;
  }, pause() {
    s2.playing = false, f = null, u2 = d = 0;
  }, resume() {
    r || (c = { ...o2 }, u2 = 0, d = n2, s2.playing = true);
  }, stop() {
    s2.playing = false, s2.time = 0, f = null, l2 = { ...Y }, u2 = d = 0, Object.assign(o2, Y), i.reset();
  }, setReducedMotion(e3) {
    r = !!e3, r && _2.stop();
  }, sample(e3, t3, { loop: n3 = false, strength: c2 = 1 } = {}) {
    if (!a[e3] || !Number.isFinite(t3) || !Number.isFinite(c2) || c2 < 0 || c2 > 1.5) throw Error(`Invalid motion sample`);
    if (r) {
      _2.stop();
      return;
    }
    let p3 = a[e3], g2 = Math.floor(t3 / p3.duration), v = n3 ? Math.max(0, t3 - g2 * p3.duration) : Math.max(0, Math.min(p3.duration, t3));
    l2 = { ...Y }, n3 && h(p3, g2), s2 = { name: e3, time: v, playing: false, loop: n3, returnTo: null }, f = null, u2 = d = 0, Object.assign(o2, m(p3, v, c2)), i.apply(o2);
  }, update(e3, { strength: t3 = 1, apply: n3 = true } = {}) {
    if (!Number.isFinite(e3) || e3 < 0 || !Number.isFinite(t3) || t3 < 0 || t3 > 1.5) throw Error(`Invalid motion update`);
    if (r) return i.reset(), false;
    let c2 = false;
    if (s2.playing) {
      s2.time += e3;
      let t4 = a[s2.name], n4 = t4.duration;
      if (s2.time >= n4) if (s2.loop) {
        let e4 = Math.floor(s2.time / n4);
        h(t4, e4), s2.time = Math.max(0, s2.time - e4 * n4);
      } else s2.time = n4, s2.playing = false, c2 = true;
    }
    return (f || s2.playing || c2 || u2 < d) && (u2 += e3, g(f ?? m(a[s2.name], s2.time, t3), d ? X(u2 / d) : 1)), n3 && i.apply(o2), c2 && s2.returnTo && _2.play(s2.returnTo, { loop: a[s2.returnTo].loop ?? true }), c2;
  }, apply() {
    p2(o2), r || i.apply(o2);
  } };
  return _2;
}
var Y;
var Ln;
var Rn;
var X;
var zn;
var Bn;
var Vn;
var Hn;
var Z;
var Q;
var $;
var Un;
var Wn;
var Gn = e((() => {
  F(), Y = Object.freeze({ x: 0, z: 0, lift: 0, yaw: 0, pitch: 0, roll: 0, bodyYaw: 0, bodyPitch: 0, bodyRoll: 0, squash: 0, bendSide: 0, bendForward: 0, eyeX: 0, eyeY: 0, eyeZ: 0, eyeOpen: 0, blink: 0, hatLift: 0, hatTilt: 0, glassesLift: 0, glassesTilt: 0, bowtieTilt: 0 }), Ln = Object.freeze({ alfred: { duration: 2.2, jump: 0.22, squash: 0.06, lean: 0.11, spin: 0 }, felipe: { duration: 2.4, jump: 0.27, squash: 0.1, lean: 0.15, spin: 0 }, jojo: { duration: 2.4, jump: 0.25, squash: 0.09, lean: 0.1, spin: Math.PI * 2 } }), Rn = [`body_base`, `body_lower`, `body_mid`, `body_upper`, `body_top`], X = (e2) => (e2 = Math.max(0, Math.min(1, e2)), e2 * e2 * (3 - 2 * e2)), zn = (e2) => (e2 = Math.max(0, Math.min(1, e2)), Math.max(0, Math.min(1, e2 * e2 * e2 * (e2 * (e2 * 6 - 15) + 10)))), Bn = (e2, t2, n2, r, i) => zn((e2 - t2) / (n2 - t2)) * (1 - zn((e2 - r) / (i - r))), Vn = (e2, t2, n2 = 12, r = 21) => e2 < 0 ? t2 : t2 * Math.exp(-n2 * e2) * (Math.cos(r * e2) + n2 / r * Math.sin(r * e2)), Hn = (e2, t2, n2, r, i) => X((e2 - t2) / (n2 - t2)) * (1 - X((e2 - r) / (i - r))), Z = (e2, t2, n2, r) => e2 < t2 || e2 > r ? 0 : e2 < n2 ? X((e2 - t2) / (n2 - t2)) : 1 - X((e2 - n2) / (r - n2)), Q = (e2, t2) => {
    if (e2 <= t2[0][0]) return t2[0][1];
    for (let n2 = 1; n2 < t2.length; n2++) if (e2 <= t2[n2][0]) {
      let [r, i] = t2[n2 - 1], [a, o2] = t2[n2];
      return i + (o2 - i) * X((e2 - r) / (a - r));
    }
    return t2.at(-1)[1];
  }, $ = (e2, t2) => {
    if (e2 <= t2[0][0]) return t2[0][1];
    let n2 = (e3) => {
      if (e3 === 0 || e3 === t2.length - 1) return 0;
      let n3 = (t2[e3][1] - t2[e3 - 1][1]) / (t2[e3][0] - t2[e3 - 1][0]), r = (t2[e3 + 1][1] - t2[e3][1]) / (t2[e3 + 1][0] - t2[e3][0]);
      return n3 * r <= 0 ? 0 : 2 * n3 * r / (n3 + r);
    };
    for (let r = 1; r < t2.length; r++) if (e2 <= t2[r][0]) {
      let [i, a] = t2[r - 1], [o2, s2] = t2[r], c = o2 - i, l2 = (e2 - i) / c, u2 = l2 * l2, d = u2 * l2;
      return (2 * d - 3 * u2 + 1) * a + (d - 2 * u2 + l2) * c * n2(r - 1) + (-2 * d + 3 * u2) * s2 + (d - u2) * c * n2(r);
    }
    return t2.at(-1)[1];
  }, Un = /* @__PURE__ */ new Set([`yaw`, `pitch`, `roll`, `bodyYaw`, `bodyPitch`, `hatTilt`, `glassesTilt`, `bowtieTilt`]), Wn = (e2, t2) => Math.atan2(Math.sin(t2 - e2), Math.cos(t2 - e2));
}));
function Kn(e2, t2) {
  let n2 = kn(e2), r = Mn(t2), i = /* @__PURE__ */ new Map();
  n2.traverse((e3) => {
    e3.frustumCulled = false, Jn(e3) && i.set(e3.name, e3), Yn(e3) && (e3.material = Array.isArray(e3.material) ? e3.material.map(r.clone) : r.clone(e3.material));
  });
  let a = (e3) => ({ bone: e3, rotation: e3.quaternion.clone(), position: e3.position.clone(), scale: e3.scale.clone() }), o2 = Zn.map((e3) => i.get(e3)).filter((e3) => !!e3).map(a), s2 = [...i.values()].filter((e3) => e3.name.endsWith(`_CTRL`) && ![`Root_CTRL`, `Body_CTRL`].includes(e3.name)).map(a);
  n2.updateMatrixWorld(true);
  let c = new he().setFromObject(n2), l2 = c.getCenter(new I()), u2 = c.getSize(new I()), d = new O(), f = new O(), p2 = new I();
  return { scene: n2, center: l2, size: u2, pose(e3 = R, n3 = 0, r2 = 0, i2 = 0, a2 = 0, c2) {
    o2.forEach(({ bone: t3, rotation: n4, position: r3, scale: a3 }, o3) => {
      t3.position.copy(r3), t3.scale.copy(a3), d.setFromAxisAngle(tr, i2 * Qn[o3]), f.setFromAxisAngle($n, e3.nod * Qn[o3] + (o3 === 0 ? e3.rootNod : 0)), t3.quaternion.copy(n4).multiply(d.multiply(f));
    });
    let l3 = o2[0];
    if (l3) {
      l3.bone.position.x += e3.rootX * u2.y, l3.bone.position.y += e3.rootY * u2.y, d.setFromAxisAngle(er, e3.rootYaw), f.setFromAxisAngle(tr, e3.rootRoll), l3.bone.quaternion.multiply(d.multiply(f));
      let t3 = 1 - e3.squash;
      l3.bone.scale.multiply(p2.set(1 / Math.sqrt(t3), t3, 1 / Math.sqrt(t3))).multiplyScalar(e3.pulse);
    }
    let m = e3.eyeX + n3, h = e3.eyeY + r2;
    s2.forEach(({ bone: n4, rotation: r3, position: o3, scale: s3 }) => {
      if (n4.position.copy(o3), n4.scale.copy(s3), n4.quaternion.copy(r3), n4.name === `Face_CTRL`) n4.position.x += m * u2.y * 0.035, n4.position.y += h * u2.y * 0.018;
      else if (n4.name === `Eye_L_CTRL` || n4.name === `Eye_R_CTRL`) d.setFromAxisAngle(er, m * 0.2), f.setFromAxisAngle($n, -h * 0.12), n4.quaternion.multiply(d.multiply(f)), n4.scale.y *= n4.name === `Eye_L_CTRL` ? e3.eyeOpenLeft : e3.eyeOpenRight;
      else {
        n4.position.x += (c2?.x ?? 0) * u2.y, n4.position.y += (c2?.y ?? a2) * u2.y;
        let e4 = c2?.tilt ?? -i2 * 0.7;
        d.setFromAxisAngle($n, e4 * 0.3), f.setFromAxisAngle(tr, e4), n4.quaternion.multiply(d.multiply(f));
      }
      n4.name === ze[t2] && (d.setFromAxisAngle($n, e3.accessoryPitch), f.setFromAxisAngle(tr, e3.accessoryRoll), n4.quaternion.multiply(d.multiply(f)), n4.position.x += e3.accessoryX * u2.y, n4.position.y += e3.accessoryY * u2.y, n4.scale.multiplyScalar(e3.accessoryScale));
    });
  }, dispose() {
    r.dispose(), n2.traverse((e3) => {
      Xn(e3) && e3.skeleton.dispose();
    });
  } };
}
function qn(e2, t2) {
  if (t2 === `Todd`) {
    let n3 = Kn(e2, t2);
    return { ...n3, poseHero(e3, t3, r2) {
      n3.pose(R, 0, 0, e3, 0, { tilt: t3, ...r2 });
    } };
  }
  let n2 = kn(e2), r = Mn(t2), i = /* @__PURE__ */ new Set();
  n2.traverse((e3) => {
    e3.frustumCulled = false, Yn(e3) && (e3.material = Array.isArray(e3.material) ? e3.material.map(r.clone) : r.clone(e3.material)), Xn(e3) && i.add(e3.skeleton);
  }), n2.updateMatrixWorld(true);
  let a = new he().setFromObject(n2), o2 = a.getCenter(new I()), c = a.getSize(new I()), l2 = In(n2, { name: t2 === `Iggy` ? `jojo` : t2 === `Alfred` ? `alfred` : `felipe` }), u2 = l2.values, d = new M(), f = new M(), p2 = new M(), m = new O(), h = new O(), g = new s(), _2 = new I(), v = new I(), y = [`Beret_CTRL`, `Glasses_CTRL`, `Sunglasses_CTRL`, `BowTie_CTRL`].map((e3) => l2.bones.get(e3)).filter((e3) => !!e3);
  function b(e3, t3, r2) {
    for (let t4 of y) t4.matrix.decompose(_2, m, v), m.multiply(h.setFromEuler(g.set(e3 * 0.3, 0, e3))), t4.matrix.compose(_2, m, v);
    n2.updateMatrixWorld(true), f.copy(n2.matrixWorld).multiply(d.makeTranslation(t3 * c.y, r2 * c.y, 0)).multiply(p2.copy(n2.matrixWorld).invert());
    for (let e4 of y) e4.parent && (e4.matrix.copy(p2.copy(e4.parent.matrixWorld).invert()).multiply(f).multiply(e4.matrixWorld), e4.updateMatrixWorld(true));
    i.forEach((e4) => e4.update());
  }
  return { scene: n2, center: o2, size: c, motion: l2, pose(e3 = R, n3 = 0, r2 = 0, i2 = 0, a2 = 0) {
    Object.assign(u2, Y, { x: e3.rootX * c.y, lift: e3.rootY * c.y, yaw: e3.rootYaw, pitch: e3.rootNod, roll: e3.rootRoll, bendSide: i2, bendForward: e3.nod, squash: e3.squash, eyeX: (e3.eyeX + n3) * c.y * 0.035, eyeY: (e3.eyeY + r2) * c.y * 0.018, blink: 1 - Math.min(e3.eyeOpenLeft, e3.eyeOpenRight), hatLift: t2 === `Felipe` ? e3.accessoryY * c.y : 0, hatTilt: t2 === `Felipe` ? e3.accessoryRoll : 0, bowtieTilt: t2 === `Alfred` ? e3.accessoryRoll : 0 }), l2.apply(), b(-i2 * 0.7, 0, a2);
  }, poseHero(e3, t3, n3) {
    let r2 = u2.bendSide;
    u2.bendSide += e3, l2.apply(), u2.bendSide = r2, b(t3, n3.x, n3.y);
  }, dispose() {
    i.forEach((e3) => e3.dispose()), r.dispose();
  } };
}
var Jn;
var Yn;
var Xn;
var Zn;
var Qn;
var $n;
var er;
var tr;
var nr = e((() => {
  F(), jn(), He(), Nn(), Gn(), Jn = (e2) => `isBone` in e2 && e2.isBone === true, Yn = (e2) => `isMesh` in e2 && e2.isMesh === true, Xn = (e2) => `isSkinnedMesh` in e2 && e2.isSkinnedMesh === true, Zn = [`body_base`, `body_lower`, `body_mid`, `body_upper`, `body_top`], Qn = [0, 0.25, 0.35, 0.25, 0.15], $n = new I(1, 0, 0), er = new I(0, 1, 0), tr = new I(0, 0, 1);
}));
nr();
ot();
yt();
He();
export { qn as prepareCharacter, Ge as isFurMesh, $e as acquireFurSurface, ht as acquireFurTextures, Xe as furBudget, z as MAX_FUR_CARDS, R as REST_POSE, Le as sampleExpression, Re as EXPRESSION_DURATION };

export function getFurBounds(geometry){geometry.computeBoundingBox();if(!geometry.boundingBox)throw Error("Fur surface has no bounds");return geometry.boundingBox;}
