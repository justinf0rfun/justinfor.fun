import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { prepareCharacter, REST_POSE, sampleExpression, type PreparedCharacter } from "./character-core.js";
import { attachFur } from "./fur.js";
import { createSelection, updateSelection } from "./selection";
import { createDotsPostprocess } from "./postprocess.js";
import { advanceDockMotion, consumeDockHover, createDockMotion, greetDockCompanion, leaveDockResponse, pulseDockMotion, type CharacterSurface } from "./dock-motion";

const names = ["O", "Alfred", "Felipe", "Iggy", "Todd"] as const;
type Name = typeof names[number];
const templates = new Map<string, ReturnType<GLTFLoader["loadAsync"]>>();
const load = (name: Name) => {
  let pending = templates.get(name);
  if (!pending) {
    pending = new GLTFLoader().loadAsync(`/moments-reference/${name.toLowerCase()}.glb`);
    templates.set(name, pending);
    pending.catch(() => templates.delete(name));
  }
  return pending;
};

function makeRing(): PreparedCharacter {
  const geometry = new THREE.TorusGeometry(0.6978056422417614 / 2, (0.5 - 15.8399 / 80.0781) / 2, 16, 96);
  const material = new THREE.MeshBasicMaterial({ color: "#bac1d3", toneMapped: false });
  const scene = new THREE.Mesh(geometry, material);
  const box = new THREE.Box3().setFromObject(scene);
  return { scene, center: box.getCenter(new THREE.Vector3()), size: box.getSize(new THREE.Vector3()),
    pose() {}, poseHero() {}, dispose() { geometry.dispose(); material.dispose(); } };
}

export interface CharacterViewState { name: Name; facing: number; reduced: boolean; animateSelection: boolean; surface: CharacterSurface; response: number }

export function createCharacterRenderer(canvas: HTMLCanvasElement, read: () => CharacterViewState, ready: (value: boolean) => void) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 2, -2, 0.1, 100);
  camera.position.z = 25;
  RectAreaLightUniformsLib.init();
  scene.add(new THREE.AmbientLight("#fff", 1.8), new THREE.HemisphereLight("#fff", "#d8e3f0", 0.35));
  const directional = new THREE.DirectionalLight("#fff", 1.85);
  directional.position.set(-5, 7, 6); scene.add(directional);
  for (const [x, y, z, width, height, intensity] of [[-6, 7, 1, 5, 6, 0.2], [5, 1, -2, 4, 7, 1.3], [0, -5, -1, 5, 3, 1]]) {
    const light = new THREE.RectAreaLight("#fff", intensity, width, height);
    light.position.set(x, y, z); light.lookAt(0, 0, 0); scene.add(light);
  }
  const postprocess = createDotsPostprocess(renderer, scene, camera);
  const models = new Map<string, { model: PreparedCharacter; root: THREE.Group; clearFur: () => void; elapsed: number; playExpression: boolean; dockResponse: boolean }>();
  let disposed = false, failed = false, frame = 0, lastTime = 0, painted = false, dirty = true, previousReduced = false;
  let previousFacing = NaN;
  const selection = createSelection(read().name);
  const dockMotion = createDockMotion(read().response);
  renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
    failed = true; painted = false; ready(false);
    const message = [gl.getProgramInfoLog(program), gl.getShaderInfoLog(vertex), gl.getShaderInfoLog(fragment)].filter(Boolean).join(" ");
    canvas.dataset.rendererError = message.slice(0, 1000);
    console.error("Dots shader failed", message);
  };
  function insert(name: Name, model: PreparedCharacter) {
    const clearFur = name === "O" ? () => {} : attachFur(model.scene);
    const root = new THREE.Group(); root.visible = false;
    model.scene.position.copy(model.center).negate(); root.add(model.scene); scene.add(root);
    models.set(name, { model, root, clearFur, elapsed: 0, playExpression: false, dockResponse: false });
    dirty = true;
  }
  insert("O", makeRing());
  async function prepare(name: Name) {
    if (name === "O" || models.has(name)) return;
    const gltf = await load(name);
    if (disposed) return;
    insert(name, prepareCharacter(gltf.scene, name));
  }
  const initial = read().name;
  let initialReady = false, warmed = false;
  // Warm the selected model first; keep the poster until its shaders have drawn.
  prepare(initial).then(() => { initialReady = true; }).catch(error => { canvas.dataset.rendererError = `Model: ${String(error).slice(0, 200)}`; });
  async function warmOthers() {
    if (warmed || !initialReady || read().surface === "dock") return;
    warmed = true;
    for (const name of names) {
      if (disposed) return;
      await prepare(name);
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    }
  }

  const observer = new ResizeObserver(() => {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.left = -width / 200; camera.right = width / 200;
    camera.top = height / 200; camera.bottom = -height / 200;
    camera.updateProjectionMatrix(); dirty = true;
  });
  observer.observe(canvas);
  const contextLost = (event: Event) => { event.preventDefault(); painted = false; ready(false); };
  const contextRestored = () => { dirty = true; };
  canvas.addEventListener("webglcontextlost", contextLost);
  canvas.addEventListener("webglcontextrestored", contextRestored);
  function render(time: number) {
    if (disposed || failed) return;
    frame = requestAnimationFrame(render);
    const dt = Math.min(0.05, lastTime ? (time - lastTime) / 1000 : 0); lastTime = time;
    if (document.hidden || canvas.getBoundingClientRect().bottom < 0 || !canvas.clientWidth) return;
    const state = read();
    if (state.facing !== previousFacing) { previousFacing = state.facing; dirty = true; }
    warmOthers().catch(error => {
      failed = true; painted = false; ready(false); cancelAnimationFrame(frame);
      canvas.dataset.rendererError = `Model: ${String(error).slice(0, 200)}`;
    });
    if (!models.has(state.name)) return;
    if (previousReduced !== state.reduced) {
      models.forEach(({ model }) => { model.motion?.setReducedMotion(state.reduced); if (!state.reduced) model.motion?.ambient(); });
      previousReduced = state.reduced; dirty = true;
    }
    const previous = selection.revealed;
    const selecting = updateSelection(selection, state.name, dt, !state.reduced && state.animateSelection);
    const responding = consumeDockHover(dockMotion, state.response, state.surface, state.reduced);
    let displayedMotion = "rest";
    for (const [name, item] of models) {
      item.root.visible = name === selection.revealed;
      if (!item.root.visible) continue;
      if (name !== previous || !painted) {
        item.elapsed = 0;
        item.dockResponse = false;
        item.playExpression = state.animateSelection && !state.reduced;
        if (!state.reduced) {
          if (state.animateSelection) item.model.motion?.excite({ restart: true });
          else item.model.motion?.ambient();
        }
      }
      if (state.surface !== "dock") leaveDockResponse(item);
      if (responding) {
        if (name === "O") pulseDockMotion(dockMotion);
        else greetDockCompanion(item, name);
      }
      item.elapsed += dt;
      if (item.model.motion) {
        item.model.motion.update(state.reduced ? 0 : dt, { apply: false });
        item.model.poseHero(0, 0, { x: 0, y: 0 });
      } else item.model.pose(name === "Todd" && item.playExpression && !state.reduced ? sampleExpression("Todd", item.elapsed) : REST_POSE);
      item.root.rotation.set(name === "O" ? 0 : 0.035, selection.yaw + state.facing * Math.PI / 180, 0);
      const viewWidth = camera.right - camera.left;
      const scale = Math.min(viewWidth * 0.6 / item.model.size.y, viewWidth * 0.72 / Math.max(item.model.size.x, item.model.size.z)) * selection.scale;
      const motion = item.model.motion?.state;
      if (motion?.name === "ambient") item.dockResponse = false;
      const dockPose = advanceDockMotion(dockMotion, dt, state.surface, state.reduced,
        item.model.motion ? motion?.name === "ambient" ? item.model.motion.values.lift / 0.016 : 0 : null,
        0.016 * scale * 100);
      item.root.position.y = dockPose.liftPixels / 100;
      item.root.scale.setScalar(scale * dockPose.scale);
      displayedMotion = motion?.name ?? (name === "Todd" && item.playExpression && item.elapsed < 2.5 ? "expression" : dockPose.scale > 1 ? "pulse" : "rest");
    }
    if (!state.reduced || dirty || selecting || previous !== selection.revealed) {
      try {
        postprocess.render(selection.revealed !== "O"); dirty = false;
        if (!failed) canvas.dataset.renderedCharacter = selection.revealed;
        if (!failed && canvas.dataset.motion !== displayedMotion) canvas.dataset.motion = displayedMotion;
        if (!failed && !painted && selection.revealed === state.name) { painted = true; ready(true); }
      } catch (error) {
        canvas.dataset.rendererError = (error instanceof Error ? error.stack ?? error.message : String(error)).slice(0, 2200);
        console.error("Dots render failed", error);
        failed = true; ready(false); cancelAnimationFrame(frame);
      }
    }
  }
  frame = requestAnimationFrame(render);
  return () => {
    disposed = true; cancelAnimationFrame(frame); observer.disconnect();
    canvas.removeEventListener("webglcontextlost", contextLost); canvas.removeEventListener("webglcontextrestored", contextRestored);
    models.forEach(({ clearFur, model }) => { clearFur(); model.dispose(); });
    postprocess.dispose(); renderer.dispose();
  };
}
