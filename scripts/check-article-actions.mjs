import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import { setImmediate } from "node:timers/promises";
import test from "node:test";

const source = stripTypeScriptTypes(readFileSync(new URL("../src/scripts/article-actions.ts", import.meta.url), "utf8"))
  .replace(/^import .*;$/gm, "").replace(/^export /gm, "");
const appLinksSource = stripTypeScriptTypes(readFileSync(new URL("../src/scripts/ai-app-links.ts", import.meta.url), "utf8"))
  .replace(/^export /gm, "");

class Element {
  listeners = new Map(); attrs = new Map(); selectors = {}; dataset = {}; children = new Set();
  classList = { add() {}, remove() {} }; style = { setProperty() {} }; offsetHeight = 80;
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  fire(type, event = {}) { return this.listeners.get(type)?.(event); }
  querySelector(selector) { return this.selectors[selector] ?? null; }
  querySelectorAll(selector) { return this.selectors[selector] ?? []; }
  setAttribute(name, value) { this.attrs.set(name, value); }
  removeAttribute(name) { this.attrs.delete(name); }
  hasAttribute(name) { return this.attrs.has(name); }
  getAttribute(name) { return this.attrs.get(name) ?? null; }
  toggleAttribute(name, present) { if (present) this.setAttribute(name, ""); else this.removeAttribute(name); }
  contains(element) { return element === this || this.children.has(element); }
}

function fixture({ clipboardFails = false, reduced = false } = {}) {
  const document = new Element(), root = new Element(), actions = new Element(), dialog = new Element();
  const trigger = new Element(), close = new Element(), ai = new Element(), aiTrigger = new Element(), options = new Element();
  const markdownButton = new Element(), linkButton = new Element(), markdownStatus = new Element(), linkStatus = new Element();
  const writes = [], animations = [], timers = [];
  document.documentElement = root;
  document.selectors = { "[data-article-actions]": actions, "[data-article-share]": dialog, "[data-article-copy]": [markdownButton, linkButton] };
  actions.dataset.articleUrl = "https://justinfor.fun/thoughts/example";
  actions.selectors = {
    "[data-article-share-open]": trigger, "[data-article-ai]": ai,
    "[data-article-markdown]": { content: { textContent: "# Example\n\nThe complete **Markdown** body." } },
  };
  ai.selectors = { "[data-article-ai-toggle]": aiTrigger, "[data-article-ai-options]": options };
  ai.children = new Set([aiTrigger, options]);
  dialog.selectors = {
    "[data-share-papers]": new Element(), "[data-share-print]": new Element(),
    "[data-share-sheet]": [new Element(), new Element()], "[data-share-close]": close,
    "a[href], button:not(:disabled)": [close, linkButton],
  };
  dialog.open = false;
  dialog.showModal = () => { dialog.open = true; document.activeElement = close; };
  dialog.close = () => { dialog.open = false; };
  dialog.getBoundingClientRect = () => ({ left: 100, right: 500, top: 50, bottom: 550 });
  trigger.focus = () => { document.activeElement = trigger; };
  close.focus = () => { document.activeElement = close; };
  linkButton.focus = () => { document.activeElement = linkButton; };
  aiTrigger.focus = () => { document.activeElement = aiTrigger; };
  for (const [button, kind, status] of [[markdownButton, "markdown", markdownStatus], [linkButton, "link", linkStatus]]) {
    button.dataset.articleCopy = kind;
    button.closest = () => ({ querySelector: () => status });
  }
  const mount = runInNewContext(`${appLinksSource}\n${source}\nmountArticleActions`, {
    document, Node: Element, queueMicrotask, matchMedia: query => ({ matches: query.includes("reduced") ? reduced : true }),
    ResizeObserver: class { observe() {} },
    navigator: { userAgent: "Test desktop", maxTouchPoints: 0, clipboard: { async writeText(value) { if (clipboardFails) throw Error("Denied"); writes.push(value); } } },
    setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout: id => { timers[id - 1] = null; },
    animate: (target, keyframes, settings) => {
      animations.push({ target, keyframes, settings });
      return { stop() {}, finished: Promise.resolve() };
    },
  });
  mount();
  return { document, actions, dialog, trigger, close, ai, aiTrigger, options, markdownButton, linkButton, markdownStatus, linkStatus, writes, animations, timers };
}

test("Escape closes the modal, restores focus, and a second open starts cleanly", async () => {
  const f = fixture();
  f.trigger.fire("click");
  assert.equal(f.dialog.open, true);
  for (const [origin, shiftKey, target] of [[f.linkButton, false, f.close], [f.close, true, f.linkButton]]) {
    f.document.activeElement = origin;
    let trapped = false;
    f.dialog.fire("keydown", { key: "Tab", shiftKey, preventDefault() { trapped = true; } });
    assert.equal(trapped, true);
    assert.equal(f.document.activeElement, target);
  }
  let prevented = false;
  f.dialog.fire("cancel", { preventDefault() { prevented = true; } });
  f.close.fire("click");
  await setImmediate();
  assert.equal(prevented, true);
  assert.equal(f.dialog.open, false);
  assert.equal(f.document.activeElement, f.trigger);
  assert.equal(f.dialog.hasAttribute("data-closing"), false);
  f.trigger.fire("click");
  assert.equal(f.dialog.open, true);
});

test("outside clicks dismiss; dragging from the paper to outside does not", async () => {
  const f = fixture();
  f.trigger.fire("click");
  f.dialog.fire("pointerdown", { clientX: 200, clientY: 100 });
  f.dialog.fire("click", { clientX: 20, clientY: 20 });
  await setImmediate();
  assert.equal(f.dialog.open, true);
  f.dialog.fire("pointerdown", { clientX: 20, clientY: 20 });
  f.dialog.fire("click", { clientX: 20, clientY: 20 });
  await setImmediate();
  assert.equal(f.dialog.open, false);
});

test("AI disclosure keeps hidden links inert and supports click, outside dismissal and Escape", () => {
  const f = fixture();
  f.aiTrigger.fire("click");
  assert.equal(f.aiTrigger.getAttribute("aria-expanded"), "true");
  assert.equal(f.options.inert, false);
  f.document.fire("pointerdown", { target: new Element() });
  assert.equal(f.options.inert, true);
  f.aiTrigger.fire("click");
  f.document.activeElement = f.options;
  f.document.fire("keydown", { key: "Escape" });
  assert.equal(f.aiTrigger.getAttribute("aria-expanded"), "false");
  assert.equal(f.document.activeElement, f.aiTrigger);
});

test("copy controls use the correct full payload and never report failure as success", async () => {
  const f = fixture();
  await f.markdownButton.fire("click");
  await f.linkButton.fire("click");
  assert.deepEqual(f.writes, ["# Example\n\nThe complete **Markdown** body.", "https://justinfor.fun/thoughts/example"]);
  assert.equal(f.markdownButton.hasAttribute("data-copied"), true);
  f.timers[0]();
  assert.equal(f.markdownButton.hasAttribute("data-copied"), false);
  assert.equal(f.markdownStatus.textContent, "");
  const denied = fixture({ clipboardFails: true });
  await denied.markdownButton.fire("click");
  assert.equal(denied.markdownButton.hasAttribute("data-copied"), false);
  assert.match(denied.markdownStatus.textContent, /Couldn't copy/);
});

test("reduced motion removes every dialog entrance animation", () => {
  const f = fixture({ reduced: true });
  f.trigger.fire("click");
  assert.ok(f.animations.length > 0);
  assert.ok(f.animations.every(({ settings }) => settings.duration === 0));
});
