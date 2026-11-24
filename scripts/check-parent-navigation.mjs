import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const dist = new URL("../dist/", import.meta.url);
const read = path => readFileSync(new URL(path, dist), "utf8");
const parents = html => [...html.matchAll(/<a\b[^>]*\sdata-parent-navigation(?=[\s=>])[^>]*>[\s\S]*?<\/a>/g)].map(match => match[0]);

test("selector text in an Inspired link is not a parent navigation control", () => {
  assert.equal(parents('<a href="/thoughts" data-selector="[data-parent-navigation]">Back navigation</a>').length,0);
  assert.equal(parents('<a data-parent-navigation="true" href="/">Home</a>').length,1);
});

test("all standalone pages return to their explicit parent, including direct article visits", () => {
  let checked = 0;
  for (const file of readdirSync(dist, { recursive: true })) {
    if (!file.endsWith("/index.html") || file.startsWith("writing/")) continue;
    const html = read(file);
    if (/http-equiv="refresh"/.test(html)) continue;
    const controls = parents(html);
    const article = file.startsWith("thoughts/") && file !== "thoughts/index.html";
    const book = file.startsWith("books/") && file !== "books/index.html";
    assert.equal(controls.length, article ? 2 : 1, file);
    if (article) {
      assert.equal(controls.filter(control => /class="[^"]*\barticle-parent\b/.test(control)).length, 1);
      assert.equal(controls.filter(control => /class="[^"]*\breading-back\b/.test(control)).length, 1);
    }
    for (const control of controls) {
      assert.ok(control.includes(`href="${article ? "/thoughts" : book ? "/books" : "/"}"`), file);
      assert.ok(control.includes(`aria-label="Back to ${article ? "Thoughts" : book ? "Books" : "Home"}"`), file);
      assert.match(control, /src="\/justin-avatar\.png"/);
      assert.match(control, /width="32" height="32"/);
      assert.doesNotMatch(control, /history\.back/);
    }
    checked++;
  }
  assert.ok(checked >= 10, "six collections and four articles must be covered");
});

test("homepage overlay returns are buttons wired to the existing animation controller", () => {
  const html = read("index.html");
  for (const hook of ["uses", "projects", "music", "memory", "writing", "x-bookmarks"]) {
    const opening = html.match(new RegExp(`<[^>]+data-${hook}-stage="overlay"[^>]*>`))?.[0];
    assert.ok(opening, hook);
    assert.match(opening, /\binert\b/, `${hook} must not expose a hidden return control`);
    const start = html.indexOf(opening);
    const header = html.slice(start).match(/<header\b[^>]*>[\s\S]*?<\/header>/)?.[0];
    assert.ok(header, hook);
    const button = header.match(/<button\b[^>]*data-parent-navigation\b[^>]*>/)?.[0];
    assert.ok(button, hook);
    assert.ok(button.includes(`data-${hook}-close`), hook);
    assert.match(button, /type="button"/);
    assert.match(button, /aria-label="Back to Home"/);
    assert.doesNotMatch(button, /\bhref=/, "an overlay return must not reload the homepage");
    assert.equal((header.match(/data-parent-navigation\b/g) ?? []).length, 1);
    assert.doesNotMatch(header, /aria-label="Close"/);
  }
});

test("generic folder stages clone a self-contained shared return control", () => {
  const html = read("index.html");
  const templates = [...html.matchAll(/<template\b[^>]*data-folder-parent-control[^>]*>([\s\S]*?)<\/template>/g)];
  assert.ok(templates.length > 0);
  for (const [, template] of templates) {
    assert.match(template, /<button\b[^>]*data-folder-parent-close[^>]*data-parent-navigation/);
    assert.match(template, /<svg\b/);
    assert.match(template, /<path\b/);
    assert.doesNotMatch(template, /<use\b/, "a cloned arrow must not rely on an inert symbol definition");
  }
});
