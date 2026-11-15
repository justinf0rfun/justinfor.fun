import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import test from "node:test";
import { createStepSound } from "../src/lib/step-sound.ts";
class Param {
  value = 0; events = [];
  setValueAtTime(value, time) { this.value = value; this.events.push(["set", value, time]); }
  exponentialRampToValueAtTime(value, time) { this.events.push(["ramp", value, time]); }
  cancelAndHoldAtTime(time) { this.events.push(["hold", time]); }
  setTargetAtTime(value, time, constant) { this.events.push(["target", value, time, constant]); }
}
function fixture(suspended = false) {
  const contexts = [];
  class Context {
    state = suspended ? "suspended" : "running"; currentTime = 1; destination = {}; nodes = []; tones = []; gains = [];
    constructor() { contexts.push(this); }
    node(values) { const node = { ...values, connect(target) { return target; }, disconnect() { this.disconnected = true; } }; this.nodes.push(node); return node; }
    createOscillator() { const tone = this.node({ frequency: new Param(), stops: [], start(time) { this.started = time; }, stop(time) { this.stops.push(time); } }); this.tones.push(tone); return tone; }
    createBiquadFilter() { return this.filter = this.node({ frequency: new Param() }); }
    createGain() { const gain = this.node({ gain: new Param() }); this.gains.push(gain); return gain; }
    resume() { return new Promise(resolve => { this.resumeNow = () => { this.state = "running"; resolve(); }; }); }
  }
  return { Context, contexts };
}
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8);
test("Step retains Bencho's pitch glide, lowpass, 90ms attack and 311ms envelope", () => {
  const f = fixture(), sound = createStepSound(f.Context);
  assert.equal(sound.play(), false); assert.equal(f.contexts.length, 0);
  sound.unlock(); const c = f.contexts[0]; assert.equal(sound.play(), true);
  assert.equal(c.tones[0].type, "sine");
  assert.deepEqual(c.tones[0].frequency.events[0], ["set", 227, 1.005]);
  assert.equal(c.tones[0].frequency.events[1][1], 114); near(c.tones[0].frequency.events[1][2], 1.316);
  assert.equal(c.filter.type, "lowpass"); assert.equal(c.filter.frequency.value, 820);
  assert.equal(c.gains[0].gain.events[0][1], .0001);
  assert.equal(c.gains[0].gain.events[1][1], .051); near(c.gains[0].gain.events[1][2], 1.095);
  near(c.tones[0].stops[0], 1.336);
  c.tones[0].onended(); assert.ok(c.nodes.every(node => node.disconnected));
});
test("rapid navigation is rate-limited and replaces the previous tail without orphaned nodes", () => {
  const f = fixture(), sound = createStepSound(f.Context); sound.unlock(); const c = f.contexts[0];
  assert.equal(sound.play(), true); c.currentTime = 1.03; assert.equal(sound.play(), false);
  c.currentTime = 1.08; assert.equal(sound.play(), true);
  assert.deepEqual(c.gains[0].gain.events.slice(-2), [["hold", 1.08], ["target", .0001, 1.08, .004]]);
  near(c.tones[0].stops.at(-1), 1.1);
  c.tones[0].onended(); sound.stop();
  assert.equal(c.gains[1].gain.events.at(-1)[0], "target");
  c.tones[1].onended(); assert.ok(c.nodes.every(node => node.disconnected)); sound.stop();
});
test("suspended or unavailable audio never queues a late card sound", async () => {
  const f = fixture(true), sound = createStepSound(f.Context); sound.unlock(); assert.equal(sound.play(), false);
  f.contexts[0].resumeNow(); await setImmediate(); assert.equal(f.contexts[0].tones.length, 0);
  assert.equal(sound.play(), true);
  const blocked = createStepSound(class { constructor() { throw new Error("blocked"); } }); blocked.unlock(); assert.equal(blocked.play(), false); blocked.stop();
});
