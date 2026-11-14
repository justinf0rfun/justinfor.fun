import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import { setImmediate } from "node:timers/promises";
import test from "node:test";
import { createReturnSound } from "../src/lib/return-sound.ts";

class Param {
  value = 0; events = [];
  setValueAtTime(value, time) { this.events.push(["set", value, time]); }
  exponentialRampToValueAtTime(value, time) { this.events.push(["ramp", value, time]); }
}
class AudioNode {
  disconnected = false;
  connect(target) { return target; }
  disconnect() { this.disconnected = true; }
}
function audioFixture({ suspended = false, denied = false } = {}) {
  const contexts = [];
  class Context {
    currentTime = 4; sampleRate = 1000; destination = {}; nodes = []; tones = []; noises = []; buffers = [];
    state = suspended ? "suspended" : "running";
    constructor() { contexts.push(this); }
    node(values) { const node = Object.assign(new AudioNode(), values); this.nodes.push(node); return node; }
    createDynamicsCompressor() { return this.compressor = this.node({ threshold: new Param(), ratio: new Param() }); }
    createStereoPanner() { return this.node({ pan: new Param() }); }
    createGain() { return this.node({ gain: new Param() }); }
    createBiquadFilter() { return this.filter = this.node({ frequency: new Param(), Q: new Param() }); }
    createBuffer(channels, length, rate) {
      const samples = new Float32Array(length);
      const buffer = { channels, length, rate, samples, getChannelData: () => samples };
      this.buffers.push(buffer); return buffer;
    }
    createOscillator() {
      const node = this.node({ frequency: new Param(), start(time) { this.started = time; }, stop(time) { this.stopped = time; } });
      this.tones.push(node); return node;
    }
    createBufferSource() {
      const node = this.node({ playbackRate: new Param(), start(time) { this.started = time; } });
      this.noises.push(node); return node;
    }
    async resume() { if (denied) throw Error("Blocked"); this.state = "running"; }
  }
  return { Context, contexts };
}

test("the lazy synth matches the reference envelopes and disconnects its transient nodes", async () => {
  const f = audioFixture(), play = createReturnSound(f.Context);
  assert.equal(f.contexts.length, 0, "no context or autoplay before a return activation");
  assert.equal(await play(), true);
  const c = f.contexts[0], tone = c.tones[0], noise = c.noises[0];
  assert.equal(c.compressor.threshold.value, -18);
  assert.equal(c.compressor.ratio.value, 6);
  assert.equal(c.buffers[0].length, 30);
  assert.ok(c.buffers[0].samples.every(value => value >= -1 && value <= 1));
  const pitch = noise.playbackRate.value;
  assert.ok(pitch >= 0.94 && pitch <= 1.06);
  assert.equal(tone.type, "sine");
  assert.deepEqual(tone.frequency.events, [["set", 170 * pitch, 4], ["ramp", 110 * pitch, 4 + 0.04]]);
  const gains = c.nodes.filter(node => node.gain);
  assert.deepEqual(gains[0].gain.events, [["set", 0.0001, 4], ["ramp", 0.4, 4 + 0.004], ["ramp", 0.0001, 4 + 0.06]]);
  assert.deepEqual(gains[1].gain.events, [["set", 0.12, 4], ["ramp", 0.0001, 4 + 0.015]]);
  assert.equal(c.filter.type, "lowpass");
  assert.equal(c.filter.frequency.value, 1200 * pitch);
  assert.equal(tone.stopped, 4 + 0.08);
  tone.onended();
  assert.ok(c.nodes.filter(node => node !== c.compressor).every(node => node.disconnected));
  assert.equal(await play(), false, "duplicate activations inside 30ms stay silent");
  c.currentTime += 0.05;
  assert.equal(await play(), true);
  assert.equal(c.buffers.length, 1, "reuse the noise buffer and compressor");
});

test("suspended contexts resume on activation and rejected audio safely reports failure", async () => {
  assert.equal(await createReturnSound(audioFixture({ suspended: true }).Context)(), true);
  const denied = audioFixture({ suspended: true, denied: true });
  assert.equal(await createReturnSound(denied.Context)(), false);
  assert.equal(denied.contexts[0].tones.length, 0);
  assert.equal(await createReturnSound(class { constructor() { throw Error("Unavailable"); } })(), false);
});

const source = stripTypeScriptTypes(readFileSync(new URL("../src/scripts/return-sound.ts", import.meta.url), "utf8"))
  .replace(/^import .*;$/gm, "").replace(/^export /gm, "");
class Element {
  constructor(control = null) { this.control = control; }
  closest() { return this.control; }
}
class Anchor extends Element {
  href = "https://justinfor.fun/thoughts"; target = "";
  constructor() { super(); this.control = this; }
}
function navigationFixture(playback = Promise.resolve(true)) {
  const listeners = new Map(), timers = new Map(), navigations = [];
  let now = 0, nextTimer = 0, sounds = 0;
  const mount = runInNewContext(`${source}\nmountReturnSound`, {
    Element, HTMLAnchorElement: Anchor,
    createReturnSound: () => () => { sounds++; return playback; },
    document: { addEventListener: (type, callback) => listeners.set(type, callback), removeEventListener: type => listeners.delete(type) },
    window: { location: { assign: href => navigations.push(href) } },
    setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, { callback, at: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  const destroy = mount();
  return {
    destroy, navigations, listeners, get sounds() { return sounds; },
    click(target, options = {}) {
      const event = { target, isTrusted: true, button: 0, defaultPrevented: false, ...options, preventDefault() { this.defaultPrevented = true; } };
      listeners.get("click")?.(event); return event;
    },
    advance(ms) {
      const end = now + ms;
      while (true) {
        const next = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        now = next[1].at; timers.delete(next[0]); next[1].callback();
      }
      now = end;
    },
  };
}

test("only trusted return activations sound; overlay actions and modifiers are not delayed", () => {
  const f = navigationFixture(), button = new Element(); button.control = button;
  f.click(new Element());
  f.click(button, { isTrusted: false });
  f.click(button, { button: 1 });
  assert.equal(f.sounds, 0);
  assert.equal(f.click(new Element(button)).defaultPrevented, false);
  assert.equal(f.sounds, 1);
  assert.equal(f.click(new Anchor(), { metaKey: true }).defaultPrevented, false);
  assert.equal(f.sounds, 2);
  f.advance(1000);
  assert.deepEqual(f.navigations, []);
});

test("same-tab returns allow the short click to finish and navigate only once", async () => {
  const f = navigationFixture(), anchor = new Anchor();
  assert.equal(f.click(new Element(anchor)).defaultPrevented, true);
  await setImmediate();
  f.advance(79); assert.deepEqual(f.navigations, []);
  f.advance(1); assert.deepEqual(f.navigations, [anchor.href]);
  f.advance(1000); assert.equal(f.navigations.length, 1);
});

test("audio failure or a stalled resume cannot trap parent navigation", async () => {
  const failed = navigationFixture(Promise.resolve(false)), anchor = new Anchor();
  failed.click(anchor); await setImmediate();
  assert.deepEqual(failed.navigations, [anchor.href]);
  let resolve;
  const stalled = navigationFixture(new Promise(done => { resolve = done; }));
  stalled.click(anchor); stalled.advance(120);
  assert.deepEqual(stalled.navigations, [anchor.href]);
  resolve(true); await setImmediate(); stalled.advance(1000);
  assert.equal(stalled.navigations.length, 1);
});

test("cleanup cancels a pending return without navigating during teardown", async () => {
  const f = navigationFixture();
  f.click(new Anchor()); f.destroy();
  await setImmediate(); f.advance(1000);
  assert.deepEqual(f.navigations, []);
  assert.equal(f.listeners.size, 0);
});
