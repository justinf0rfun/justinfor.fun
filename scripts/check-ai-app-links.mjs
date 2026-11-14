import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { articleAiTargets } from "../src/lib/article-sharing.ts";

const source = stripTypeScriptTypes(readFileSync(new URL("../src/scripts/ai-app-links.ts", import.meta.url), "utf8"))
  .replace(/^export /gm, "");
const targets = articleAiTargets("https://justinfor.fun/thoughts/example");
const events = () => {
  const handlers = new Map();
  return {
    addEventListener(type, callback) { if (!handlers.has(type)) handlers.set(type, new Set()); handlers.get(type).add(callback); },
    removeEventListener(type, callback) { handlers.get(type)?.delete(callback); },
    fire(type) { for (const callback of [...(handlers.get(type) ?? [])]) callback(); },
  };
};

function fixture({ userAgent = "Macintosh", maxTouchPoints = 0, unsupported = false } = {}) {
  const timers = new Map(), destinations = [], delays = [];
  const document = { ...events(), hidden: false, hasFocus: () => true };
  const links = targets.map(target => ({
    href: target.href, dataset: { aiApp: target.appHref },
    hasAttribute: name => name === "data-ai-desktop-only" && target.desktopOnly,
    addEventListener(type, callback) { this[type] = callback; },
  }));
  const window = { ...events(), location: { assign(url) {
    if (unsupported && !url.startsWith("https:")) throw Error("Unsupported protocol");
    destinations.push(url);
  } } };
  let nextTimer = 0;
  const mount = runInNewContext(`${source}\nmountAiAppLinks`, {
    navigator: { userAgent, maxTouchPoints }, document, window,
    setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, callback); delays.push(delay); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  mount({ querySelectorAll: () => links });
  return {
    document, window, destinations, timers, delays,
    click(index, modifiers = {}) {
      let prevented = false;
      links[index].click({ button: 0, ...modifiers, preventDefault() { prevented = true; } });
      return prevented;
    },
    expire() { for (const callback of [...timers.values()]) callback(); },
  };
}

test("each provider attempts its official app URI and falls back while the page remains focused", () => {
  for (let index = 0; index < targets.length; index++) {
    const f = fixture();
    assert.equal(f.click(index), true);
    assert.deepEqual(f.destinations, [targets[index].appHref]);
    assert.deepEqual(f.delays, [2000]);
    f.expire();
    assert.deepEqual(f.destinations, [targets[index].appHref, targets[index].href]);
    assert.equal(f.timers.size, 0);
  }
});

test("app handoff or a browser confirmation cancels fallback and never redirects on return", () => {
  for (const event of ["blur", "pagehide", "visibilitychange"]) {
    const f = fixture();
    f.click(0);
    if (event === "visibilitychange") { f.document.hidden = true; f.document.fire(event); }
    else f.window.fire(event);
    f.document.hidden = false;
    f.window.fire("focus");
    f.expire();
    assert.deepEqual(f.destinations, [targets[0].appHref]);
    assert.equal(f.timers.size, 0);
  }
});

test("a second provider selection cancels the first provider's fallback", () => {
  const f = fixture();
  f.click(0); f.click(2); f.expire();
  assert.deepEqual(f.destinations, [targets[0].appHref, targets[2].appHref, targets[2].href]);
});

test("modified clicks retain normal web navigation", () => {
  for (const modifiers of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
    const f = fixture();
    assert.equal(f.click(0, modifiers), false);
    assert.deepEqual(f.destinations, []);
    assert.equal(f.timers.size, 0);
  }
});

test("phones and iPad desktop mode keep HTTPS links for desktop-only protocols", () => {
  for (const options of [{ userAgent: "iPhone" }, { userAgent: "Android" }, { userAgent: "Macintosh", maxTouchPoints: 5 }]) {
    const f = fixture(options);
    assert.equal(f.click(0), false);
    assert.equal(f.click(1), false);
    assert.equal(f.click(2), true, "Grok Bot documents its protocol for both desktop and phones");
    assert.deepEqual(f.destinations, [targets[2].appHref]);
  }
});

test("a rejected protocol immediately uses the fallback", () => {
  const f = fixture({ unsupported: true });
  f.click(0);
  assert.deepEqual(f.destinations, [targets[0].href]);
  assert.equal(f.timers.size, 0);
});
