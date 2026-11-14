import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const dist = new URL("../dist/", import.meta.url);
const read = path => readFileSync(new URL(path, dist), "utf8");
const parents = html => [...html.matchAll(/<a\b[^>]*data-parent-navigation\b[^>]*>[\s\S]*?<\/a>/g)].map(match => match[0]);

test("all standalone pages return to their explicit parent, including direct article visits", () => {
  let checked = 0;
  for (const file of readdirSync(dist, { recursive: true })) {
    if (!file.endsWith("/index.html") || file.startsWith("writing/")) continue;
    const html = read(file);
    if (/http-equiv="refresh"/.test(html)) continue;
    const controls = parents(html);
    assert.equal(controls.length, 1, file);
    const article = file.startsWith("thoughts/") && file !== "thoughts/index.html";
    assert.ok(controls[0].includes(`href="${article ? "/thoughts" : "/"}"`), file);
    assert.ok(controls[0].includes(`aria-label="Back to ${article ? "Thoughts" : "Home"}"`), file);
    assert.match(controls[0], /src="\/justin-avatar\.png"/);
    assert.match(controls[0], /width="32" height="32"/);
    assert.doesNotMatch(controls[0], /history\.back/);
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
