import assert from "node:assert/strict";
import test from "node:test";
import { clampRecord, mixRack, pickSleeve, placeSleeve, pullSleeve, rackGeometry, recordFocus, shouldReturnRecord, sleevePolygons, sleevePose, sleeveSurfaceTransforms } from "../src/lib/record-rack.ts";

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
test("a grabbed cover tracks the same screen point while flipping either face",()=>{
  const geometry=rackGeometry(rect,false),center={x:207,y:400};
  for(const index of [0,4])for(const progress of [.3,.7,1]){
    const pose=pullSleeve(sleevePose(index,2,geometry),geometry,progress,{width:390,height:844});
    const cover=sleevePolygons(placeSleeve(pose,geometry,center),geometry)[0];
    assert.ok(Math.abs(cover.reduce((sum,p)=>sum+p.x,0)/4-center.x)<.01);
    assert.ok(Math.abs(cover.reduce((sum,p)=>sum+p.y,0)/4-center.y)<.01);
  }
});
test("return intent accepts a short flick or a deliberate drag, with room to change your mind",()=>{
  for(const size of [218,265,340]){
    assert.equal(shouldReturnRecord(12,0,size),false);
    assert.equal(shouldReturnRecord(8,1.5,size),false);
    assert.equal(shouldReturnRecord(25,.7,size),true);
    assert.equal(shouldReturnRecord(90,0,size),true);
    assert.equal(shouldReturnRecord(90,-.6,size),false);
    assert.equal(shouldReturnRecord(-20,1,size),false);
  }
});
test("short portrait layouts leave space for the return control below record details",()=>{
  for(const height of [480,568,640,844]){
    const geometry=rackGeometry({left:0,top:88,width:320,height:height-88},false);
    const focus=recordFocus(geometry,{width:320,height});
    assert.ok(focus.y-focus.size/2>88);
    assert.ok(focus.detailTop+197<height-12,`${height}: ${focus.detailTop+197}`);
  }
});
test("short tablet windows keep the cover beside its controls with a clear gap",()=>{
  for(const [width,height] of [[600,568],[768,600],[844,390],[1024,768]]){
    const geometry=rackGeometry({left:0,top:88,width,height:height-88},false),focus=recordFocus(geometry,{width,height});
    assert.equal(focus.side,true);
    assert.ok(focus.x+focus.size/2<width*.62-8);
    assert.ok(focus.y-focus.size/2>88);
  }
});

function transformPoint(css,point){
  let [x,y,z,w]=[...point,1];
  for(const [,name,args]of [...css.matchAll(/(\w+)\(([^)]+)\)/g)].reverse()){
    const [a,b=0,c=0]=args.split(',').map(parseFloat);
    if(name==="perspective")w-=z/a;
    else if(name==="translate"||name==="translate3d"){x+=a*w;y+=b*w;z+=c*w;}
    else if(name==="translateY")y+=a*w;
    else if(name==="translateZ")z+=a*w;
    else if(name==="rotateX"){const cos=Math.cos(a*Math.PI/180),sin=Math.sin(a*Math.PI/180);[y,z]=[y*cos-z*sin,y*sin+z*cos];}
    else assert.fail(`Unexpected transform ${name}`);
  }
  return [x,y,z,w];
}
test("independent mobile faces retain the original projected geometry through flips and handoff",()=>{
  const g=rackGeometry(rect,false);
  for(const position of[3.9,3.99,4,4.01,4.1,4.49,4.99,5])for(const index of[3,4,5])for(const scale of[.4,1,1.8]){
    const pose=sleevePose(index,position,g),transforms=sleeveSurfaceTransforms(pose,g,scale),half=g.cover/scale/2,t=g.cover/scale/28;
    const surfaces={cover:[[-half,-half,0],[half,-half,0],[half,half,0],[-half,half,0]],spine:[[-half,-t/2,0],[half,-t/2,0],[half,t/2,0],[-half,t/2,0]]};
    for(const [name,vertices]of Object.entries(surfaces)){
      const expected=sleevePolygons(pose,g)[name==="cover"?0:1];
      for(const point of vertices){
        // Parent translation acts after the child's homogeneous perspective divide.
        const child=transformPoint(transforms[name],point),parent=transformPoint(transforms.parent,[child[0]/child[3],child[1]/child[3],child[2]/child[3]]);
        const x=g.cx+parent[0]*scale,y=g.cy+parent[1]*scale;
        assert.ok(expected.some(q=>Math.hypot(q.x-x,q.y-y)<.5),`${name}: ${position}, ${index}, ${scale}`);
      }
    }
    assert.equal(transforms.parent.includes("rotate"),false);
  }
});
test("the hidden back edge cannot survive alone at the eye-line",()=>{
  const g=rackGeometry(rect,false),pose=sleevePose(4,4,g);
  assert.equal(sleeveSurfaceTransforms(pose,g,1).edgeVisible,false);
  assert.equal(sleeveSurfaceTransforms({...pose,x:-g.cover},g,1).edgeVisible,true);
});
