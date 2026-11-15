import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { rideCouponLinks } from "../src/data/ride-coupon.ts";

const source = readFileSync(new URL("../public/holo/pack.js", import.meta.url), "utf8");
const { couponLink, couponLinks } = runInNewContext(`${source.split("const LINKS")[0]}\n({couponLink,couponLinks})`, { URL });

test("missing and unsafe coupon links stay inactive; valid HTTPS links retain their parameters", () => {
  for (const value of [null, "", "#", "javascript:alert(1)", "data:text/html,test", "http://example.com", "/coupon"]) {
    assert.equal(couponLink(value), "");
  }
  const link = "https://example.com/coupon?source=justin&code=ride%20gift";
  assert.equal(couponLink(link), link);
});


test("each original card gets its own safe URL independently of shuffled order", () => {
  const links = couponLinks(JSON.stringify({ blip: "https://example.com/blip", nova: "https://example.com/nova?code=star", facet: "javascript:alert(1)", unknown: "https://example.com/other" }));
  assert.deepEqual(Object.keys(links), ["blip", "cubit", "facet", "ringo", "nova"]);
  assert.equal(links.blip, "https://example.com/blip");
  assert.equal(links.nova, "https://example.com/nova?code=star");
  assert.equal(links.facet, "");assert.equal(links.cubit, "");assert.equal(links.ringo, "");
  for (const input of [null, "invalid", "null", "[]"]) assert.ok(Object.values(couponLinks(input)).every(value => value === ""));
});

test("all five cards retain the supplied DiDi offer and referral parameter", () => {
  const expected = "https://vv.didi.cn/p/__4rB5Aa6L4?ref_from=dunion";
  const links = couponLinks(JSON.stringify(rideCouponLinks));
  assert.equal(Object.keys(links).length, 5);
  assert.ok(Object.values(links).every(link => link === expected));
});

const releaseStart = source.indexOf("const letGo = e =>");
const releaseEnd = source.indexOf("for (const type of ['pointerup'", releaseStart);
const releaseSource = source.slice(releaseStart, releaseEnd);
function releaseFixture(progress = 1) {
  const events = [], captures = [];
  const context = {
    drag: { id: 7, moved: true }, wasDrag: false, state: "idle",
    tear: { p: { to: progress }, th: {}, ph: {} },
    notify: event => events.push(event), finish: () => events.push("finish"),
    sfx: { phew() {}, boing() {} },
    pack: { classList: { contains: () => true, remove() {} } },
    hit: { hasPointerCapture: () => true, releasePointerCapture(id) { captures.push(id); context.release({ pointerId: id, type: "lostpointercapture" }); } },
  };
  runInNewContext(`${releaseSource}\nglobalThis.release = letGo`, context);
  return { context, events, captures };
}

test("every native end path requests reveal once and clears capture before reentry", () => {
  for (const type of ["pointerup", "pointercancel", "lostpointercapture", "blur"]) {
    const f = releaseFixture();
    f.context.release(type === "blur" ? { type } : { type, pointerId: 7 });
    assert.equal(f.context.drag, null);
    assert.deepEqual(f.captures, [7]);
    assert.deepEqual(f.events, ["released", "finish"]);
  }
});

test("a different finger cannot end the active tear; partial tears stay partial", () => {
  const other = releaseFixture(); other.context.release({ pointerId: 8 });
  assert.ok(other.context.drag);assert.deepEqual(other.events, []);assert.deepEqual(other.captures, []);
  const partial = releaseFixture(.3);partial.context.release({ pointerId: 7, type: "lostpointercapture" });
  assert.equal(partial.context.tear.p.to, .3);assert.deepEqual(partial.events, ["released"]);
});
