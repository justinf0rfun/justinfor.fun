export type Gravity = { x: number; y: number };
export type MotionState = "checking" | "prompt" | "requesting" | "active" | "unavailable";

type PermissionSource = { requestPermission?: () => Promise<"granted" | "denied"> };
type Callbacks = {
  onGravity: (gravity: Gravity) => void;
  onShake: (strength: number) => void;
  onState: (state: MotionState) => void;
  isPaused: () => boolean;
};

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export function createMobileGravity(element: HTMLElement, callbacks: Callbacks) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const orientation = window.DeviceOrientationEvent as PermissionSource | undefined;
  const motion = window.DeviceMotionEvent as PermissionSource | undefined;
  const supported = window.isSecureContext && window.matchMedia("(pointer: coarse)").matches && !!orientation;
  let state: MotionState = supported && !reduced.matches ? "checking" : "unavailable";
  let destroyed = false;
  let visible = false;
  let request = 0;
  let timeout = 0;
  let lastSample = 0;
  let lastPublish = -Infinity;
  let lastShake = -Infinity;
  let filtered: Gravity = { x: 0, y: 1 };
  let published = filtered;

  const setState = (next: MotionState) => {
    if (destroyed || state === next) return;
    state = next;
    callbacks.onState(next);
  };
  const canMove = () => !destroyed && visible && !document.hidden && !reduced.matches && !callbacks.isPaused();

  const onOrientation = (event: DeviceOrientationEvent) => {
    if (!finite(event.beta) || !finite(event.gamma)) return;
    window.clearTimeout(timeout);
    setState("active");
    if (!canMove()) return;
    const angle = window.screen.orientation?.angle;
    const legacyAngle = window.orientation;
    const screenAngle = finite(angle) ? angle : finite(legacyAngle) ? legacyAngle : 0;
    const b = event.beta * Math.PI / 180;
    const g = event.gamma * Math.PI / 180;
    const a = screenAngle * Math.PI / 180;
    // Project world gravity into the device plane, then into the rotated screen.
    const x = Math.cos(b) * Math.sin(g);
    const y = Math.sin(b);
    const target = { x: x * Math.cos(a) + y * Math.sin(a), y: -x * Math.sin(a) + y * Math.cos(a) };
    const now = performance.now();
    const dt = lastSample ? Math.min(50, Math.max(0, now - lastSample)) : 1000 / 60;
    lastSample = now;
    const blend = 1 - Math.exp(-dt / 85);
    filtered = { x: filtered.x + (target.x - filtered.x) * blend, y: filtered.y + (target.y - filtered.y) * blend };
    if (now - lastPublish < 1000 / 30 || Math.hypot(filtered.x - published.x, filtered.y - published.y) < 0.008) return;
    lastPublish = now;
    published = filtered;
    callbacks.onGravity(published);
  };

  const onMotion = (event: DeviceMotionEvent) => {
    if (state !== "active" || !canMove()) return;
    const acceleration = event.acceleration;
    if (!acceleration || !finite(acceleration.x) || !finite(acceleration.y) || !finite(acceleration.z)) return;
    const magnitude = Math.hypot(acceleration.x, acceleration.y, acceleration.z);
    const now = performance.now();
    if (magnitude < 12 || now - lastShake < 350) return;
    lastShake = now;
    callbacks.onShake(Math.min(1.2, 0.35 + (magnitude - 12) / 16));
  };

  const stop = () => {
    request += 1;
    window.clearTimeout(timeout);
    window.removeEventListener("deviceorientation", onOrientation);
    window.removeEventListener("devicemotion", onMotion);
    lastSample = 0;
    lastPublish = lastShake = -Infinity;
    filtered = published = { x: 0, y: 1 };
  };
  const onReducedMotion = () => {
    if (destroyed) return;
    stop();
    callbacks.onGravity({ x: 0, y: 1 });
    setState("unavailable");
    void start();
  };

  const start = async (manual = false) => {
    if (destroyed || !supported || reduced.matches || state === "active" || state === "requesting") return;
    stop();
    const currentRequest = request;
    setState(manual ? "requesting" : "checking");
    try {
      // Both requests run before awaiting, preserving activation from the phone button.
      const permissions = await Promise.all([orientation, motion].map(async (source) =>
        source?.requestPermission ? source.requestPermission() : "granted",
      ));
      if (destroyed || currentRequest !== request || reduced.matches) return;
      if (permissions.some((permission) => permission !== "granted")) { setState("prompt"); return; }
      window.addEventListener("deviceorientation", onOrientation, { passive: true });
      window.addEventListener("devicemotion", onMotion, { passive: true });
      timeout = window.setTimeout(() => {
        stop();
        callbacks.onGravity({ x: 0, y: 1 });
        setState("unavailable");
      }, 3000);
    } catch {
      if (!destroyed && currentRequest === request) setState("prompt");
    }
  };
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  observer.observe(element);
  reduced.addEventListener("change", onReducedMotion);
  callbacks.onGravity(published);
  callbacks.onState(state);
  void start();

  return {
    requestAccess: () => start(true),
    destroy() {
      destroyed = true;
      stop();
      observer.disconnect();
      reduced.removeEventListener("change", onReducedMotion);
    },
  };
}
