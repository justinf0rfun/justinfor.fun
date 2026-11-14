// Adapted from the OpenAI Dots public character implementation; see SOURCES.md.
import { isFurMesh } from "./character-core.js";
import * as THREE from "three";
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
import { acquireFurSurface as ce } from "./character-core.js";
const m = THREE.Matrix4;
import { isFurMesh as j } from "./character-core.js";
import { getFurBounds as re } from "./character-core.js";
import { acquireFurTextures as N } from "./character-core.js";
const f = THREE.Uniform;
import { MAX_FUR_CARDS as ne } from "./character-core.js";
const T = THREE.MeshStandardMaterial;
const O = THREE.SkinnedMesh;
const x = THREE.Mesh;
const h = THREE.Vector2;
const w = THREE.Vector3;
const p = THREE.OrthographicCamera;
import { furBudget as oe } from "./character-core.js";
const e = once;
var W;
var G;
var K;
var q;
var J;
var Y;
var X;
var Z;
var me;
var he;
var ge;
var _e;
var ve = e((() => {
  W = `
uniform sampler2D plushBrushField;
uniform bool plushBrushActive;
vec3 plushBrushAt(vec4 clip, vec3 surfaceNormal) {
  if (!plushBrushActive) return vec3(0.);
  vec2 uv = clip.xy / clip.w * .5 + .5;
  vec2 force = (texture2D(plushBrushField, uv).rg * 255. - 128.) / 63.;
  vec3 bend = vec3(force, 0.);
  bend -= surfaceNormal * dot(bend, surfaceNormal);
  return bend * smoothstep(-.1, .5, surfaceNormal.z);
}
`, G = `
${W}
uniform float plushFiberScale;
varying vec3 vPilePosition;
varying vec3 vPileNormal;
varying vec3 vPileBrush;
`, K = `
#include <begin_vertex>
vPilePosition = position / plushFiberScale;
vPileNormal = normal;
`, q = `
#include <project_vertex>
// Sample in the vertex stage, then interpolate the low-resolution field. No
// extra fragment texture reads, and the original pile stays anchored to skin.
vPileBrush = plushBrushAt(gl_Position, normalize(transformedNormal));
`, J = `
uniform sampler2D plushPile;
uniform float plushDensity;
uniform float plushShading;
uniform float plushComb;
varying vec3 vPilePosition;
varying vec3 vPileNormal;
varying vec3 vPileBrush;
vec3 pilePerturb(vec2 uv, vec2 slope, vec3 n, vec3 dx, vec3 dy) {
  vec2 ux = dFdx(uv), uy = dFdy(uv);
  vec3 u = cross(dy, n) * ux.x + cross(n, dx) * uy.x;
  vec3 v = cross(dy, n) * ux.y + cross(n, dx) * uy.y;
  float basis = inversesqrt(max(max(dot(u, u), dot(v, v)), .00000001));
  return (u * slope.x + v * slope.y) * basis;
}
`, Y = `
#include <color_fragment>
// Mip-filtered, rest-space triplanar fibers. Three lookups regardless of pile
// depth: no raymarch, neighborhood searches, shell stack, or extra base draw.
vec3 pileWeights = pow(abs(normalize(vPileNormal)), vec3(6.));
pileWeights /= max(dot(pileWeights, vec3(1.)), .0001);
vec3 pileP = vPilePosition * (1.2 + plushDensity * .006);
// Low frequency warp breaks up a mechanically uniform nap.
pileP.x += .10 * sin(pileP.y * 1.8 + pileP.z);
vec4 pileX = texture2D(plushPile, pileP.zy);
vec4 pileY = texture2D(plushPile, pileP.xz);
vec4 pileZ = texture2D(plushPile, pileP.xy);
float pileValue = dot(vec3(pileX.r, pileY.r, pileZ.r), pileWeights);
diffuseColor.rgb *= mix(.48, 1.28, pileValue) * (1. - plushShading * .28);
`, X = `
#include <normal_fragment_maps>
// Screen derivatives build a tangent basis that follows the deformed skin.
// Texture slope is pre-baked, avoiding additional height samples.
vec3 pileT = dFdx(-vViewPosition);
vec3 pileB = dFdy(-vViewPosition);
vec3 pileRelief = pilePerturb(pileP.zy, pileX.gb * 2. - 1., normal, pileT, pileB) * pileWeights.x
  + pilePerturb(pileP.xz, pileY.gb * 2. - 1., normal, pileT, pileB) * pileWeights.y
  + pilePerturb(pileP.xy, pileZ.gb * 2. - 1., normal, pileT, pileB) * pileWeights.z;
// Lean the nap's lighting with the stroke. The fine relief modulates its strength
// so the dense interior responds as individual fibers, not a sliding decal.
normal = normalize(normal + pileRelief * .7 + vPileBrush * (.38 + pileValue * .22));
`, Z = `
${W}
uniform float plushScale;
uniform float plushLength;
uniform float plushWidth;
uniform float plushRimWidth;
uniform float plushComb;
uniform float plushBudget;
attribute vec3 plushRoot;
attribute vec3 plushNormal;
attribute vec4 plushSeed;
attribute vec3 plushGroom;
varying vec2 vPlushUv;
varying float vPlushFade;
varying float vPlushHeight;
varying float vPlushVariation;
varying float vPlushRim;
`, me = `
float cardT = position.y;
vec3 cardN = normalize(plushNormal);
vec3 cardU = normalize(cross(abs(cardN.y) < .95 ? vec3(0., 1., 0.) : vec3(1., 0., 0.), cardN));
vec3 cardV = cross(cardN, cardU);
float cardAngle = plushSeed.x * 6.2831853;
vec3 cardSide = cardU * cos(cardAngle) + cardV * sin(cardAngle);
vec3 cardP = plushRoot / plushScale;
vec3 cardDown = vec3(0., -1., 0.) + cardN * cardN.y;
vec3 cardGroom = plushGroom - cardN * dot(plushGroom, cardN);
float cardPart = clamp(length(cardGroom), 0., 1.);
vec3 cardFlow = cardU * sin(cardP.y * 19. + cardP.z * 24.) + cardV * sin(cardP.x * 17. - cardP.z * 15.);
vec3 cardBend = (cardDown * plushComb + cardFlow * .3 + cardSide * .15) * (1. - cardPart) + cardGroom * 1.4;
float cardLength = plushLength * plushSeed.y * plushSeed.w;
vec3 transformed = plushRoot + cardLength * (cardN * cardT * (1. - .22 * cardPart * cardT) + cardBend * cardT * cardT)
  + cardSide * position.x * plushWidth * plushSeed.w;
vPlushUv = (vec2(mod(plushSeed.z, 4.), floor(plushSeed.z / 4.)) + vec2(position.x + .5, cardT)) * .25;
vPlushHeight = cardT;
vPlushVariation = .9 + .2 * plushSeed.x;
// Smooth prefix LOD. Existing cards keep the same roots, seeds, width and length.
vPlushFade = clamp((plushBudget - float(gl_InstanceID)) / 96., 0., 1.);
#ifdef USE_ALPHAHASH
vPosition = transformed;
#endif
`, he = `
#include <project_vertex>
mat4 cardDeform = mat4(1.);
#ifdef USE_SKINNING
  // skinnormal_vertex has already applied both bind transforms.
  cardDeform = skinMatrix;
#endif
mat4 cardToView = modelViewMatrix * cardDeform;
// Root-constant facing also keeps all vertices together under perspective.
vec3 cardRootView = (cardToView * vec4(plushRoot, 1.)).xyz;
vec3 cardView = isOrthographic ? vec3(0., 0., 1.) : normalize(-cardRootView);
vec3 cardNormalView = normalize(transformedNormal);
float cardFacing = dot(cardNormalView, cardView);
vPlushRim = 1. - smoothstep(.12, .6, abs(cardFacing));
vec3 cardSideView = (cardToView * vec4(cardSide, 0.)).xyz;
vec3 cardScreenSide = cross(cardView, cardNormalView);
cardScreenSide /= max(length(cardScreenSide), .0001);
if (dot(cardScreenSide, cardSideView) < 0.) cardScreenSide = -cardScreenSide;
// Orient wide multi-hair tufts along the contour. Spend coverage at the edge,
// rather than increasing every character's instance count and interior overdraw.
float cardWorldScale = length(cardToView[1].xyz);
float cardRimWidth = max(plushWidth, plushRimWidth);
mvPosition.xyz += (cardScreenSide * cardRimWidth * cardWorldScale - cardSideView * plushWidth)
  * position.x * plushSeed.w * vPlushRim;
// Embed the broad card's root slightly into the curved skin (tangent planes sit
// above a convex surface). Keep its tapered tips above the body.
float cardInset = min(plushScale * .0015, cardLength * .12);
mvPosition.xyz -= cardNormalView * cardWorldScale * cardInset * (1. - cardT) * vPlushRim;
// Every vertex samples the same deformed root. Bend only toward the tips so a
// stroke cannot detach a tuft or change its atlas/LOD allocation.
vec3 cardBrush = plushBrushAt(projectionMatrix * vec4(cardRootView, 1.), cardNormalView);
mvPosition.xyz += cardBrush * cardLength * cardWorldScale * cardT * cardT;
gl_Position = projectionMatrix * mvPosition;
// Backside roots just beyond the contour contribute important visible tips.
vPlushFade *= smoothstep(-.50, -.32, cardFacing);
if (vPlushFade <= 0.) gl_Position = vec4(2., 2., 2., 1.);
`, ge = `
uniform sampler2D plushCards;
uniform float plushShading;
uniform float plushThickness;
varying vec2 vPlushUv;
varying float vPlushFade;
varying float vPlushHeight;
varying float vPlushVariation;
varying float vPlushRim;
`, _e = `
#include <color_fragment>
vec4 fibers = texture2D(plushCards, vPlushUv);
// G holds dense, short root fibers in the SAME atlas sample. Fill the inner
// fringe only; A retains the separated long hairs and their wispy outer tips.
// The height gate also prevents coarse atlas mips leaking roots into the tips.
float shortPile = fibers.g * vPlushRim * .65 * (1. - smoothstep(.38, .72, vPlushHeight));
float transmittance = (1. - fibers.a) * (1. - shortPile);
float coverage = 1. - pow(max(transmittance, 0.), (.6 + plushThickness * 1.8) * (1. + vPlushRim * 1.5));
coverage *= vPlushFade;
if (coverage < .012) discard;
diffuseColor.a *= coverage;
float rootShade = mix(1. - plushShading * .85, 1. + plushShading * .65, smoothstep(0., .75, vPlushHeight));
diffuseColor.rgb *= mix(.78, 1.15, fibers.r) * rootShade * vPlushVariation;
`;
}));
function ye(e2, t, n) {
  t.updateMatrixWorld(true);
  let r = new m().copy(e2.matrixWorld).invert(), i = new m(), a = 0;
  return t.traverse((e3) => {
    if (!j(e3)) return;
    let t2 = re(e3.geometry);
    i.multiplyMatrices(r, e3.matrixWorld);
    let n2 = i.elements;
    a = Math.max(a, (t2.max.y - t2.min.y) * Math.hypot(n2[4], n2[5], n2[6]));
  }), Number.isFinite(a) && a > 1e-4 ? a : n;
}
function be(e2, t = e2) {
  let n = e2.material, r = e2.onBeforeRender, i = ce(e2, t), a = ye(e2, t, i.scale) * (n.name === `Hat` ? 0.3 : 1), o = /^Todd_/.test(e2.name), s = o ? 1 / 0.55 : 1, c = N(), l = { plushPile: new f(c.pile), plushCards: new f(c.cards), plushScale: new f(i.scale), plushFiberScale: new f(a), plushLength: new f(a * 0.018), plushWidth: new f(a * 0.013), plushComb: new f(0.65), plushRimWidth: new f(i.scale * (o ? 0.032 : 0.055)), plushDensity: new f(180), plushThickness: new f(0.35), plushShading: new f(0.3), plushBudget: new f(ne), plushBrushField: new f(null), plushBrushActive: new f(false) }, u = new T({ roughness: 1, metalness: 0, alphaHash: true, side: n.side });
  u.name = n.name, u.color = n.color, u.onBeforeCompile = (e3) => {
    Object.assign(e3.uniforms, l), e3.vertexShader = G + e3.vertexShader.replace(`#include <begin_vertex>`, K).replace(`#include <project_vertex>`, q), e3.fragmentShader = J + e3.fragmentShader.replace(`#include <color_fragment>`, Y).replace(`#include <normal_fragment_maps>`, X);
  }, u.customProgramCacheKey = () => `dots-optimized-pile-v2`;
  let d = new T({ roughness: 1, metalness: 0, side: 2, transparent: true, depthWrite: false, forceSinglePass: true });
  d.name = `Optimized fur cards`, d.color = n.color, d.emissive = n.color, d.emissiveIntensity = 0.1, d.onBeforeCompile = (e3) => {
    Object.assign(e3.uniforms, l), e3.vertexShader = Z + e3.vertexShader.replace(`#include <beginnormal_vertex>`, `vec3 objectNormal = plushNormal;`).replace(`#include <begin_vertex>`, me).replace(`#include <project_vertex>`, he), e3.fragmentShader = ge + e3.fragmentShader.replace(`#include <color_fragment>`, _e).replace(`#include <normal_fragment_begin>`, `#include <normal_fragment_begin>
normal = normalize(vNormal);`);
  }, d.customProgramCacheKey = () => `dots-optimized-cards-v4`;
  let m2 = e2 instanceof O ? new O(i.geometry, d) : new x(i.geometry, d);
  m2 instanceof O && e2 instanceof O && (m2.bindMode = e2.bindMode, m2.bind(e2.skeleton, e2.bindMatrix)), m2.name = `Optimized fur cards`, m2.frustumCulled = false, m2.layers.mask = e2.layers.mask, m2.raycast = () => {
  };
  let g = new h(), _ = new w();
  m2.onBeforeRender = (e3, t2, r2) => {
    e3.getDrawingBufferSize(g);
    let a2 = m2.matrixWorld.elements, o2 = Math.max(Math.hypot(a2[0], a2[1], a2[2]), Math.hypot(a2[4], a2[5], a2[6]), Math.hypot(a2[8], a2[9], a2[10]));
    _.setFromMatrixPosition(m2.matrixWorld).applyMatrix4(r2.matrixWorldInverse);
    let c2 = r2 instanceof p ? 1 : 1 / Math.max(1e-3, -_.z), u2 = oe(i.scale * o2 * Math.abs(r2.projectionMatrix.elements[5]) * g.y * 0.5 * c2 * s, l.plushDensity.value);
    l.plushBudget.value = u2, i.geometry.instanceCount = Math.min(ne, Math.ceil(u2)), d.opacity = n.opacity;
  };
  let v = false;
  return { attach() {
    e2.material = u, e2.add(m2), e2.onBeforeRender = function(...e3) {
      r.apply(this, e3), u.opacity = n.opacity;
    };
  }, update(e3) {
    l.plushLength.value = e3.length * a / 100, l.plushWidth.value = a * (9e-3 + e3.length * 22e-4), l.plushDensity.value = e3.density, l.plushThickness.value = e3.thickness, l.plushComb.value = e3.comb, l.plushShading.value = e3.shading;
  }, dispose() {
    v || (v = true, e2.remove(m2), e2.material = n, e2.onBeforeRender = r, d.dispose(), u.dispose(), i.release(), c.release());
  } };
}
ve();
export function attachFur(scene) {
  const surfaces = [];
  scene.traverse((mesh) => {
    if (isFurMesh(mesh)) surfaces.push(be(mesh, scene));
  });
  surfaces.forEach((surface) => {
    surface.update({ length: 3.2, density: 202, thickness: 0.35, comb: 0.65, shading: 0.3 });
    surface.attach();
  });
  return () => surfaces.forEach((surface) => surface.dispose());
}
