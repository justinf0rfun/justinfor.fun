import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { minimapProgress, tickScale, majorTick, currentSection } from "../src/lib/resume-scroll.ts";

test("minimap preserves the reference's travel and clamps Safari overscroll", () => {
  assert.equal(minimapProgress(0, 2000, 1000), 0);
  assert.equal(minimapProgress(500, 2000, 1000), 157.5);
  assert.equal(minimapProgress(1000, 2000, 1000), 315);
  assert.equal(minimapProgress(-40, 2000, 1000), 0);
  assert.equal(minimapProgress(1200, 2000, 1000), 315);
  assert.equal(minimapProgress(0, 800, 800), 0);
});

test("tick shape and major marks match the original public implementation", () => {
  assert.equal(tickScale(0), 3);
  assert.equal(tickScale(24), 1.5);
  assert.equal(tickScale(-24), 1.5);
  assert.equal(tickScale(48), 1);
  assert.equal(tickScale(49), 1);
  assert.deepEqual(Array.from({ length: 36 }, (_, i) => i).filter(i => majorTick(i)), [0, 7, 14, 22, 29, 35]);
});

test("section marker follows the last heading above the original 40% threshold", () => {
  assert.equal(currentSection([200, 800, 1300], 1000, 0), -1);
  assert.equal(currentSection([200, 800, 1300], 1000, 50), 0);
  assert.equal(currentSection([-500, 200, 700], 1000, 900), 1);
  assert.equal(currentSection([-500, 450, 700], 1000, 700), 0);
  assert.equal(currentSection([400, 500], 1000, 1), -1);
});

test("resume is unlisted and does not publish the supplied private header", () => {
  const page = readFileSync(new URL("../src/pages/resume.astro", import.meta.url), "utf8");
  const data = readFileSync(new URL("../src/data/resume.ts", import.meta.url), "utf8");
  const component = readFileSync(new URL("../src/components/Resume.tsx", import.meta.url), "utf8");
  assert.match(page, /noindex, nofollow/);
  assert.match(page, /ParentLink label="Home" href="\/"/);
  assert.doesNotMatch(page + data + component, /(?:tel:|mailto:|github\.com|\b1[3-9]\d{9}\b|\.pdf\b)/);
  const home = readFileSync(new URL("../src/pages/index.astro", import.meta.url), "utf8");
  const credits = readFileSync(new URL("../src/data/inspirations.ts", import.meta.url), "utf8");
  assert.doesNotMatch(home + credits, /["']\/resume(?:["'?#/])/);
});
