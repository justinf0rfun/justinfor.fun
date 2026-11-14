import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";

const source = stripTypeScriptTypes(readFileSync(new URL("../src/lib/intro-images.ts", import.meta.url), "utf8"))
  .replace(/^export /gm, "");
const component = readFileSync(new URL("../src/components/IntroCopy.tsx", import.meta.url), "utf8");
const cycleStart = component.indexOf("  const cycle = ");
const cycleSource = stripTypeScriptTypes(component.slice(cycleStart, component.indexOf("\n  useEffect(", cycleStart)));

function fixture() {
  const images = [];
  const prepare = runInNewContext(`${source}\nprepareIntroImage`, {
    Image: class {
      set src(value) { this.url = value; }
      decode() { return new Promise((resolve, reject) => images.push({ src: this.url, resolve, reject })); }
    },
  });
  const indices = [0], pending = { current: false }, mounted = { current: true };
  const loading = [];
  const cycle = runInNewContext(`${cycleSource}\ncycle`, {
    indices, pending, mounted, nextGroup: { current: 0 }, first: { current: true },
    groups: [[{ image: "/intro/claude-color.svg" }, { image: "/intro/grok.svg" }]],
    imageSource: choice => choice.image, prepareIntroImage: prepare,
    setLoading: value => loading.push(value),
    setIndices: update => { indices.splice(0, indices.length, ...update(indices)); },
  });
  return { cycle, indices, images, pending, mounted, loading };
}

test("the actual intro cycle keeps the old choice while decoding and ignores duplicate requests", async () => {
  const f = fixture();
  const change = f.cycle(0);
  await f.cycle(0);
  assert.equal(f.indices[0], 0, "text and icon must both stay on the existing choice");
  assert.equal(f.images.length, 1);
  f.images[0].resolve();
  await change;
  assert.equal(f.indices[0], 1);
  assert.equal(f.pending.current, false);
  assert.deepEqual(f.loading, [true, false]);
});

test("the actual intro cycle retains the current choice on failure or unmount", async () => {
  const failed = fixture();
  const change = failed.cycle(0);
  failed.images[0].reject(new Error("offline"));
  await change;
  assert.equal(failed.indices[0], 0);
  assert.equal(failed.pending.current, false);
  assert.deepEqual(failed.loading, [true, false]);

  const unmounted = fixture();
  const abandoned = unmounted.cycle(0);
  unmounted.mounted.current = false;
  unmounted.images[0].resolve();
  await abandoned;
  assert.equal(unmounted.indices[0], 0);
  assert.deepEqual(unmounted.loading, [true], "do not set state after unmount");
});

test("cold images wait for decoding, concurrent callers share work, and failures can retry", async () => {
  const requests = [];
  const prepare = runInNewContext(`${source}\nprepareIntroImage`, {
    Image: class {
      set src(value) { this.url = value; }
      decode() { return new Promise((resolve, reject) => requests.push({ src: this.url, resolve, reject })); }
    },
  });
  let changed = false;
  const cold = prepare("/intro/grok.svg");
  cold.then(ready => { if (ready) changed = true; });
  assert.equal(prepare("/intro/grok.svg"), cold);
  await Promise.resolve();
  assert.equal(changed, false, "a slow image must not permit the visual switch");
  assert.equal(requests.length, 1);
  requests[0].resolve();
  assert.equal(await cold, true);
  assert.equal(changed, true);
  assert.equal(await prepare("/intro/grok.svg"), true);
  assert.equal(requests.length, 1, "decoded images must be reused");

  const failed = prepare("/didi-icon.png");
  requests[1].reject(new Error("network failure"));
  assert.equal(await failed, false, "failed images must not permit the visual switch");
  const retry = prepare("/didi-icon.png");
  assert.equal(requests.length, 3);
  requests[2].resolve();
  assert.equal(await retry, true);
});
