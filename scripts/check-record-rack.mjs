import assert from "node:assert/strict";
import test from "node:test";
import { clampRecord, mixRack, pickSleeve, pullSleeve, rackGeometry, recordFocus, sleevePolygons, sleevePose } from "../src/lib/record-rack.ts";

const rect={left:0,top:88,width:390,height:756};
test("rack geometry reads DOMRect getters rather than spreading away its dimensions",()=>{
  const domRect=Object.create(null);
  for(const [key,value] of Object.entries(rect))Object.defineProperty(domRect,key,{get:()=>value});
  const geometry=rackGeometry(domRect,false);
  assert.equal(geometry.width,390);assert.equal(geometry.height,756);assert.equal(geometry.cx,195);assert.equal(geometry.cy,466);
  for(const value of Object.values(geometry))assert.ok(Number.isFinite(value));
});
test("the eye-level sleeve presents its spine while covers fan on both sides",()=>{
  const geometry=rackGeometry(rect,false);
  const center=sleevePose(2,2,geometry),above=sleevePose(1,2,geometry),below=sleevePose(3,2,geometry);
  assert.equal(center.angle,90);assert.equal(center.y,0);assert.equal(above.flip,180);assert.equal(below.flip,0);
  assert.ok(above.angle>90&&below.angle<90);
  assert.equal(pickSleeve({x:geometry.cx,y:geometry.cy},2,21,geometry),2);
  assert.equal(pickSleeve({x:-1000,y:-1000},2,21,geometry),null);
});
test("pulling either face ends upright at the intended readable cover position",()=>{
  const geometry=rackGeometry(rect,false),viewport={width:390,height:844},focus=recordFocus(geometry,viewport);
  for(const index of [0,4]){
    const pose=sleevePose(index,2,geometry),pulled=pullSleeve(pose,geometry,1,viewport);
    assert.equal((pulled.angle+pulled.flip)%360,0);
    const cover=sleevePolygons(pulled,geometry)[0];
    assert.ok(Math.abs(cover.reduce((s,p)=>s+p.x,0)/4-focus.x)<.01);
    assert.ok(Math.abs(cover.reduce((s,p)=>s+p.y,0)/4-focus.y)<.01);
  }
});
test("compact and large racks share geometry at exact handoff endpoints",()=>{
  const small=rackGeometry({left:22,top:400,width:180,height:140},true),large=rackGeometry(rect,false);
  assert.deepEqual(mixRack(small,large,0),small);assert.deepEqual(mixRack(small,large,1),large);
  assert.ok(small.cover<large.cover&&small.step<large.step);
  assert.equal(clampRecord(-3,21),0);assert.equal(clampRecord(29,21),20);
});
