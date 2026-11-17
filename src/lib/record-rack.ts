export interface RackRect { left: number; top: number; width: number; height: number; }
export interface RackGeometry extends RackRect { cx: number; cy: number; cover: number; step: number; perspective: number; }
export interface SleevePose { x: number; y: number; z: number; angle: number; flip: number; }
export const INITIAL_RECORD = 4;
export const clampRecord = (value: number, count: number) => Math.max(0, Math.min(count - 1, value));

export function rackGeometry(rect: RackRect, compact: boolean): RackGeometry {
  const shortPortrait=rect.width<600&&rect.height<552;
  const widthRatio=rect.width>=600&&rect.width<1000&&rect.height<632?.4:.68;
  const heightRatio=shortPortrait?(rect.height<472?.36:.42):.6;
  return { left:rect.left,top:rect.top,width:rect.width,height:rect.height,cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2,
    cover: compact ? Math.min(rect.width * .66, rect.height * 1.25) : Math.min(rect.width*widthRatio,340,rect.height*heightRatio),
    step: compact ? rect.height / 5.2 : Math.max(44, Math.min(76, rect.height / 9.5)),
    perspective: compact ? Math.max(420, rect.width * 1.8) : Math.max(950, rect.width * .75),
  };
}

export function mixRack(from: RackGeometry, to: RackGeometry, progress: number): RackGeometry {
  const mix = (key: keyof RackGeometry) => from[key] + (to[key] - from[key]) * progress;
  return { left:mix("left"),top:mix("top"),width:mix("width"),height:mix("height"),cx:mix("cx"),cy:mix("cy"),cover:mix("cover"),step:mix("step"),perspective:mix("perspective") };
}

export function sleevePose(index: number, position: number, geometry: RackGeometry): SleevePose {
  const y = (index - position) * geometry.step;
  const splay = Math.max(-1, Math.min(1, y / (geometry.height / 2))) * 6;
  return { x: 0, y, z: 0, angle: 90 - splay, flip: y < 0 ? 180 : 0 };
}

export function recordFocus(geometry: RackGeometry, viewport: { width: number; height: number }) {
  const side = viewport.width >= 1000 || (viewport.width >= 600 && viewport.height < 720);
  const z = Math.min(96, geometry.cover * .28);
  const surfaceZ = z + geometry.cover / 56 + .2;
  const size = geometry.cover * geometry.perspective / (geometry.perspective - surfaceZ);
  const x = viewport.width * (side ? .38 : .5), y = viewport.height * (side ? .52 : viewport.height<640 ? .35 : .4);
  return { side, z, x, y, size, detailTop: y + size / 2 + 24 };
}

export function pullSleeve(pose: SleevePose, geometry: RackGeometry, progress: number, viewport: { width: number; height: number }, flip = pose.flip): SleevePose {
  const focus = recordFocus(geometry, viewport);
  const projection = 1 - (focus.z + geometry.cover / 56 + .2) / geometry.perspective;
  return { x: (focus.x - geometry.cx) * projection * progress,
    y: pose.y + ((focus.y - geometry.cy) * projection - pose.y) * progress,
    z: focus.z * progress, angle: pose.angle + ((flip ? 180 : 0) - pose.angle) * progress, flip };
}

const radians = (angle: number) => angle * Math.PI / 180;
function project(x: number, y: number, z: number, geometry: RackGeometry) {
  const scale = geometry.perspective / (geometry.perspective - z);
  return { x: geometry.cx + x * scale, y: geometry.cy + y * scale };
}

export function sleevePolygons(pose: SleevePose, geometry: RackGeometry) {
  const half = geometry.cover / 2, thickness = geometry.cover / 56;
  const sin = Math.sin(radians(pose.angle)), cos = Math.cos(radians(pose.angle));
  const faceZ = (pose.flip ? -1 : 1) * (thickness + .2);
  const cover = [[-half,-half],[half,-half],[half,half],[-half,half]].map(([x,y]) => project(pose.x+x,pose.y+y*cos-faceZ*sin,pose.z+y*sin+faceZ*cos,geometry));
  const spine = [[-half,-thickness],[half,-thickness],[half,thickness],[-half,thickness]].map(([x,z]) => project(pose.x+x,pose.y+half*cos-z*sin,pose.z+half*sin+z*cos,geometry));
  return [cover,spine];
}

// Keep the projected cover under the grab point while its depth and angle change.
export function placeSleeve(pose: SleevePose, geometry: RackGeometry, center: {x:number;y:number}): SleevePose {
  const cover=sleevePolygons(pose,geometry)[0];
  const angle=radians(pose.angle),faceZ=(pose.flip?-1:1)*(geometry.cover/56+.2);
  const depth=pose.z+faceZ*Math.cos(angle),halfDepth=geometry.cover/2*Math.sin(angle);
  const scale=(geometry.perspective/(geometry.perspective-depth-halfDepth)+geometry.perspective/(geometry.perspective-depth+halfDepth))/2;
  return {...pose,x:pose.x+(center.x-cover.reduce((sum,p)=>sum+p.x,0)/4)/scale,y:pose.y+(center.y-cover.reduce((sum,p)=>sum+p.y,0)/4)/scale};
}

export function shouldReturnRecord(distance: number, velocity: number, size: number) {
  const threshold=Math.max(52,Math.min(84,size*.23));
  return velocity>-.35 && (distance>=threshold || (distance>=14&&velocity>=.45&&distance+velocity*100>=threshold));
}

function inside(point: { x: number; y: number }, polygon: { x: number; y: number }[]) {
  let positive = false, negative = false, area = 0;
  for (let i=0;i<polygon.length;i++) {
    const a=polygon[i],b=polygon[(i+1)%polygon.length];
    const cross=(b.x-a.x)*(point.y-a.y)-(b.y-a.y)*(point.x-a.x);
    positive ||= cross>.01; negative ||= cross<-.01; area += a.x*b.y-b.x*a.y;
  }
  return Math.abs(area)>.5 && !(positive&&negative);
}

export function pickSleeve(point: { x: number; y: number }, position: number, count: number, geometry: RackGeometry) {
  const indices=Array.from({length:count},(_,i)=>i).sort((a,b)=>Math.abs(a-position)-Math.abs(b-position));
  for(const index of indices) if(sleevePolygons(sleevePose(index,position,geometry),geometry).some(polygon=>inside(point,polygon))) return index;
  return null;
}
