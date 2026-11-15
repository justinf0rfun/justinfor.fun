import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import { setImmediate } from "node:timers/promises";
import test from "node:test";
import { createWakeSound } from "../src/lib/wake-sound.ts";

class Param {
  value = 0; events = [];
  setValueAtTime(value, time) { this.value = value; this.events.push(["set", value, time]); }
  exponentialRampToValueAtTime(value, time) { this.events.push(["ramp", value, time]); }
}
function fixture(suspended = false) {
  const contexts = [];
  class Context {
    state = suspended ? "suspended" : "running"; currentTime = 1; destination = {}; nodes = []; tones = [];
    constructor() { contexts.push(this); }
    node(values) {
      const node = { ...values, connect(target) { return target; }, disconnect() { this.disconnected = true; } };
      this.nodes.push(node);return node;
    }
    createOscillator() {
      const tone = this.node({ frequency: new Param(), start(time) { this.started = time; }, stop(time) { this.stopped = time; } });
      this.tones.push(tone);return tone;
    }
    createBiquadFilter() { return this.filter = this.node({ frequency: new Param() }); }
    createGain() { return this.gain = this.node({ gain: new Param() }); }
    resume() { return new Promise(resolve => { this.resumeNow = () => { this.state = "running"; resolve(); }; }); }
  }
  return { Context, contexts };
}

test("Notch keeps the reference envelope, pitch range and 28ms gap, then releases nodes", () => {
  const f = fixture(), sound = createWakeSound(f.Context);
  assert.equal(sound.play(), false);assert.equal(f.contexts.length, 0);
  sound.unlock();const c = f.contexts[0];
  assert.equal(sound.play(0), true);
  assert.equal(c.tones[0].type, "sine");assert.equal(c.tones[0].frequency.value, 230 * .75);
  assert.equal(c.filter.type, "lowpass");assert.equal(c.filter.frequency.value, 820);
  assert.deepEqual(c.gain.gain.events, [["set", .0001, 1], ["ramp", .048, 1.006], ["ramp", .0001, 1.049]]);
  assert.equal(c.tones[0].stopped, 1.069);
  c.currentTime += .02;assert.equal(sound.play(.5), false);
  c.currentTime += .01;assert.equal(sound.play(1), true);assert.equal(c.tones[1].frequency.value, 230 * 1.5);
  c.tones[0].onended();assert.ok(c.nodes.slice(0, 3).every(node => node.disconnected));
  c.currentTime += .03;sound.unlock();assert.equal(f.contexts.length, 1);
});

test("blocked or suspended audio stays silent without queuing delayed hover sounds", async () => {
  const f = fixture(true), sound = createWakeSound(f.Context);
  sound.unlock();assert.equal(sound.play(), false);
  f.contexts[0].resumeNow();await setImmediate();
  assert.equal(f.contexts[0].tones.length, 0);
  assert.equal(sound.play(), true);
  const unavailable = createWakeSound(class { constructor() { throw Error("Unavailable"); } });
  unavailable.unlock();assert.equal(unavailable.play(), false);
});

const source = stripTypeScriptTypes(readFileSync(new URL("../src/scripts/wake-sound.ts", import.meta.url), "utf8"))
  .replace(/^import .*;$/gm, "").replace(/^export /gm, "");
test("trusted gestures unlock audio; only real mouse entry on a hover device plays a TOC notch", () => {
  const handlers = new Map(), played = [];let unlocked = 0;
  const entries = Array.from({ length: 3 }, () => ({
    events: new Map(), addEventListener(type, listener) { this.events.set(type, listener); }, removeEventListener(type) { this.events.delete(type); },
  }));
  const document = { hidden: false, addEventListener(type, listener) { handlers.set(type, listener); }, removeEventListener(type) { handlers.delete(type); } };
  const hover = { matches: true };
  const mount = runInNewContext(`${source}\n({mountWakeSound,mountTocSound})`, {
    document, matchMedia: () => hover, wakeSound: { unlock: () => unlocked++, play: at => played.push(at) },
  });
  const removeGestures = mount.mountWakeSound(), removeToc = mount.mountTocSound({ querySelectorAll: () => entries });
  handlers.get("pointerdown")({ isTrusted: false });assert.equal(unlocked, 0);
  handlers.get("pointerdown")({ isTrusted: true });assert.equal(unlocked, 1);
  const enter = (index, options = {}) => entries[index].events.get("pointerenter")({ isTrusted: true, pointerType: "mouse", ...options });
  enter(0);enter(2);assert.deepEqual(played, [0, 1]);
  enter(1, { pointerType: "touch" });enter(1, { isTrusted: false });
  hover.matches = false;enter(1);hover.matches = true;document.hidden = true;enter(1);
  assert.deepEqual(played, [0, 1]);
  assert.equal(entries[0].events.has("pointermove"), false);
  removeGestures();removeToc();assert.equal(handlers.size, 0);assert.ok(entries.every(entry => !entry.events.size));
});
