import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const compile = path => stripTypeScriptTypes(read(path)).replace(/^export /gm, "");
const { inspiredGeometry } = runInNewContext(`${compile("../src/scripts/inspired-credits.ts")}\n({inspiredGeometry})`);
const { inspirations } = runInNewContext(`${compile("../src/data/inspirations.ts")}\n({inspirations})`);

test("mobile source bar occupies the opposite edge to the highlighted component", () => {
  const anchor = { left: 12, right: 378, top: 12, bottom: 90 };
  const dock = inspiredGeometry({ left: 80, right: 310, top: 720, bottom: 790 }, anchor, 390, 844);
  assert.equal(dock.side, "top"); assert.equal(dock.visible, true);
  const news = inspiredGeometry({ left: 16, right: 374, top: 16, bottom: 48 }, anchor, 390, 844);
  assert.equal(news.side, "bottom");
  for (const width of [320, 390, 768, 1440]) {
    const edge = inspiredGeometry({ left: -10, right: width + 10, top: 0, bottom: 100 }, anchor, width, 844);
    assert.equal(edge.left, 6); assert.equal(edge.width, width - 12); assert.equal(edge.top, 6);
  }
});

test("thread joins the nearest target edge and disappears beyond the viewport", () => {
  const target = { left: 432, right: 1008, top: 200, bottom: 520 };
  const left = inspiredGeometry(target, { left: 24, right: 354, top: 100, bottom: 168 }, 1440, 900);
  assert.equal(left.x2, 425); assert.match(left.path, /^M354,134 C/);
  const right = inspiredGeometry(target, { left: 1100, right: 1400, top: 100, bottom: 168 }, 1440, 900);
  assert.equal(right.x2, 1015); assert.match(right.path, /^M1100,134 C/);
  assert.equal(inspiredGeometry({ ...target, top: 901, bottom: 950 }, target, 1440, 900).visible, false);
});

test("all eight credits have unique identities, original URLs and real local destinations", () => {
  assert.equal(inspirations.length, 8);
  assert.equal(new Set(inspirations.map(source => source.id)).size, inspirations.length);
  for (const source of inspirations) {
    assert.equal(new URL(source.url).protocol, "https:");
    assert.ok(source.note && source.relation && source.features.length);
    for (const feature of source.features) {
      assert.match(feature.page, /^\//); assert.ok(feature.selector && feature.label);
    }
  }
  assert.match(inspirations.find(source => source.id === "dots").relation, /Assets from/);
  assert.match(inspirations.find(source => source.id === "bencho").license.label, /MIT/);
});
