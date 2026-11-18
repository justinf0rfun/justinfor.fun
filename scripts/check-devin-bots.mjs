import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { devinBots } from "../src/data/devin-bots.ts";

const root = new URL("../public/uses/ai/devin-bots/", import.meta.url);
test("the Devin collection keeps one representative for each of its 30 casings", () => {
  assert.equal(devinBots.length, 30);
  assert.equal(new Set(devinBots.map(bot => bot.src)).size, 30);
  assert.equal(new Set(devinBots.map(bot => bot.title)).size, 30);
  assert.equal(devinBots.filter(bot => bot.src.endsWith(".webp")).length, 24);
  assert.equal(devinBots.filter(bot => bot.src.endsWith(".png")).length, 6);
});
test("every bot points to a local image and the original Devin page", () => {
  const files = readdirSync(root);
  assert.equal(files.length, devinBots.length);
  for (const bot of devinBots) {
    assert.equal(bot.href, "https://devin.ai/bots");
    const file = bot.src.split("/").at(-1);
    assert.ok(files.includes(file), `Missing ${file}`);
    const data = readFileSync(new URL(file, root));
    if (file.endsWith(".png")) assert.equal(data.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    else { assert.equal(data.toString("ascii", 0, 4), "RIFF"); assert.equal(data.toString("ascii", 8, 12), "WEBP"); }
  }
});
