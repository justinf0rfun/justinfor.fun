import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";

// Evaluate the data-only module without a production bundler or browser.
const data = stripTypeScriptTypes(readFileSync(new URL("../src/data/uses.ts", import.meta.url), "utf8")).replace(/^export /gm, "");
const model = stripTypeScriptTypes(readFileSync(new URL("../src/lib/uses-shelf.ts", import.meta.url), "utf8")).replace(/^import .*;$/gm, "").replace(/^export /gm, "");
const { items, categories, inset, tilt } = runInNewContext(`${data}\n${model}\n({items:usesShelfItems,categories:usesCategories,inset:shelfInset,tilt:shelfTilt})`);

test("the shelf preserves all current items, links and four ordered folder targets", () => {
  assert.equal(items.length, 51);
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
  assert.equal(items.filter(item => item.category === "Hardware").length, 8);
  assert.deepEqual(Array.from(items.slice(0,4),item=>item.name), ["ChatGPT", "Claude Code", "Dia", "Raycast"]);
  assert.deepEqual(Array.from(items.slice(0,4),item=>item.preview), [0,1,2,3]);
  for (const item of items) {
    assert.ok(categories.includes(item.category));
    assert.ok(item.width>0 && item.height>0 && item.size>0);
    if(item.bounds){const [x,y,w,h]=item.bounds;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=item.width&&y+h<=item.height);}
    if(item.category!=="Hardware") assert.ok(item.href);
  }
});

test("category counts and source row insets remain correct on filtered lists", () => {
  for (const [category,count] of [["AI",29],["Software",9],["Hardware",8],["Archived",5]]) assert.equal(items.filter(item=>item.category===category).length,count);
  assert.deepEqual(Array.from({length:14},(_,i)=>inset(i,4)),[undefined,undefined,undefined,undefined,"start",undefined,"end",undefined,undefined,undefined,undefined,"start",undefined,"end"]);
  assert.deepEqual(Array.from({length:10},(_,i)=>inset(i,3)),[undefined,undefined,undefined,"start","end",undefined,undefined,undefined,"start","end"]);
});

test("source tilt uses the pointer position and moves its floor in the opposite direction", () => {
  const corner=tilt(.5,-.5);
  assert.equal(corner.rx,"5.00deg");assert.equal(corner.ry,"7.00deg");assert.equal(corner.sx,"-5.0px");
  const center=tilt(0,0);assert.equal(Number.parseFloat(center.rx),0);assert.equal(Number.parseFloat(center.ry),0);
});
