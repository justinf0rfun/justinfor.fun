import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { projects, projectsSummary } from "../src/data/projects.ts";

const read = (path) => readFileSync(new URL(`../dist/${path}`, import.meta.url), "utf8");

test("the Projects folder, overlay, and direct page share the same ordered covers", () => {
  const home = read("index.html");
  const folder = home.match(/<a\b[^>]*data-folder="projects"[^>]*>[\s\S]*?<\/a>/)?.[0];
  assert.ok(folder);
  assert.ok(folder.includes(`data-meta="${projectsSummary}"`));

  const cards = [...folder.matchAll(/<div\b[^>]*\bdata-folder-item\b[^>]*data-w="(\d+)"[^>]*>[\s\S]*?<img\b[^>]*src="([^"]+)"/g)];
  assert.deepEqual(cards.map(([, width, image]) => [Number(width), image]),
    projects.map(({ image, preview }) => [preview.w, image]));

  for (const html of [home, read("projects/index.html")]) {
    const summary = html.match(/<h1\b[^>]*>Projects<\/h1>\s*<p\b[^>]*>([^<]+)<\/p>/)?.[1];
    assert.equal(summary, projectsSummary);

    const targets = [...html.matchAll(/<a\b[^>]*data-project-visual-target="(\d+)"[^>]*href="([^"]+)"[^>]*>\s*<img\b[^>]*src="([^"]+)"/g)];
    assert.deepEqual(targets.map(([, index, href, image]) => [Number(index), href, image]),
      projects.map(({ href, image }, index) => [index, href, image]));
  }
});
