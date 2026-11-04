import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

// Run after building: checks the actual prerendered island and shipped assets.
const html = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
const strip = html.match(/<astro-island\b[^>]*component-url="[^"]*AgentTools[^>]*>[\s\S]*?<\/astro-island>/)?.[0];
assert.ok(strip, "Homepage must render the AgentTools island");
assert.equal((strip.match(/data-tw-item="/g) ?? []).length, 10, "Render ten icons, without duplicates");
for (const name of ["Tern", "Rex", "Herdr", "omp", "Kero", "Otty", "Orca", "Grok Bot", "ChatGPT", "Claude"]) {
  assert.ok(strip.includes(`data-tw-title="${name}"`), `Missing ${name}`);
}
const destinations = {
  Tern: "https://stencil.so/tern",
  Rex: "https://www.superlogical.com/rex/docs/installation",
  Herdr: "https://herdr.dev/",
  omp: "https://omp.sh/",
  Kero: "https://kero.sh/",
  Otty: "https://otty.sh/",
  Orca: "https://www.onorca.dev/",
  "Grok Bot": "https://x.ai/bot",
  ChatGPT: "https://chatgpt.com/",
  Claude: "https://claude.ai/",
};
const links = [...strip.matchAll(/<a\b[^>]*data-tw-item="[^>]*>/g)].map(([tag]) => ({
  title: tag.match(/data-tw-title="([^"]+)"/)?.[1],
  href: tag.match(/href="([^"]+)"/)?.[1],
}));
assert.equal(links.length, 10, "Every icon must be a navigable link");
for (const link of links) assert.equal(link.href, destinations[link.title], `Wrong destination for ${link.title}`);
const chatgpt = strip.match(/<a\b[^>]*data-tw-title="ChatGPT"[^>]*>[\s\S]*?<\/a>/)?.[0];
assert.ok(chatgpt?.includes('src="/uses/ai/codex.png"'), "ChatGPT must use the Codex icon");
assert.ok(!strip.includes("agent-tools-pause"), "Do not render the removed pause control");
for (const [, src] of strip.matchAll(/<img\b[^>]*src="([^"]+)"/g)) {
  assert.ok(src.startsWith("/uses/"), "Use local official assets, not remote demo images");
  assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), `Missing asset: ${src}`);
}
assert.ok(html.indexOf('data-signature') < html.indexOf(strip), "Icons must follow the signature");
assert.ok(html.indexOf(strip) < html.indexOf('data-contributions'), "Icons must precede Contributions");
const thoughts = readFileSync(new URL("../dist/thoughts/index.html", import.meta.url), "utf8");
assert.ok(!thoughts.includes('data-tw-item'), "Thoughts must not include the homepage animation");
const source = readFileSync(new URL("../src/components/AgentTools.tsx", import.meta.url), "utf8");
assert.match(source, /entrance="rain"/, "Keep the requested staggered falling entrance");
console.log("Agent tools: ten local icons, falling entrance, correct homepage position, no Thoughts changes.");
