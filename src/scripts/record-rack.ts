import { animate, motionValue } from "motion";
import { INITIAL_RECORD, SLEEVE_FACES, clampRecord, mixRack, pickSleeve, placeSleeve, pullSleeve, rackGeometry, recordFocus, shouldReturnRecord, sleevePolygons, sleevePose, sleeveSurfaceTransforms, sleeveFaceVisibility, type RackGeometry, type SleevePose } from "../lib/record-rack";

export interface RecordRack {
  root: HTMLElement;
  records: HTMLElement[];
  getPosition(): number;
  getSelected(): number | null;
  getCurrentIndex(): number;
  geometry(): RackGeometry;
  setPosition(position: number): void;
  setActive(active: boolean): void;
  select(index: number | null): void;
  morph(source: RecordRack, open: boolean): Promise<boolean>;
}
const racks = new WeakMap<HTMLElement, RecordRack>();

export function mountRecordRack(root: HTMLElement): RecordRack {
  const mounted = racks.get(root); if (mounted) return mounted;
  const compact = root.dataset.recordRack === "compact";
  const camera = root.querySelector<HTMLElement>("[data-record-camera]")!;
  const scene = root.querySelector<HTMLElement>("[data-record-scene]")!;
  scene.style.left="0px";scene.style.top="0px";
  const scroll = root.querySelector<HTMLElement>("[data-record-scroll]")!;
  const records = [...root.querySelectorAll<HTMLElement>("[data-record-option]")];
  const surfaces=records.map(record=>({cover:record.querySelector<HTMLElement>("[data-record-cover]")!,reverse:record.querySelector<HTMLElement>(".record-reverse")!,spine:record.querySelector<HTMLElement>(".record-spine")!,rim:record.querySelector<HTMLElement>(".record-rim")!,edge:record.querySelector<HTMLElement>(".record-edge")!,left:record.querySelector<HTMLElement>(".record-left")!}));
  const grab=root.querySelector<HTMLButtonElement>("[data-record-grab]");
  const page=root.closest<HTMLElement>("[data-record-page]");
  const browseLabel=root.getAttribute("aria-label")??"Record collection";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover:hover) and (pointer:fine)");
  const surfaceProjection=matchMedia("(pointer:coarse)");
  const compactPosition = motionValue(INITIAL_RECORD), morphPosition = motionValue(1), pull = motionValue(0);
  const handX=motionValue(0),handY=motionValue(0),lift=motionValue(0);
  let layout = rackGeometry(root.getBoundingClientRect(), compact), active = compact, visible = true, frame = 0;
  let paintedPosition=INITIAL_RECORD;
  let resting = INITIAL_RECORD, announced = -1, requested: number | null = null, selected: number | null = null, selectedFlip = 0;
  let selectionRun = 0, morphRun = 0, morphSource: RecordRack | null = null, morphTarget = 1;
  let finishMorph: ((complete: boolean) => void) | null = null;
  let completeMorph: (()=>void) | undefined;
  let stopMorph: (() => void) | undefined, coast = 0, velocity = 0;
  let keyboard = false, keyboardIndex = INITIAL_RECORD, suppressClick = false;
  let gesture: { id:number;x:number;y:number;top:number;index:number;time:number;last:number;v:number;moved:boolean;type:string } | null = null;
  let returnGesture: {id:number;x:number;y:number;cx:number;cy:number;pull:number;distance:number;moved:boolean;width:number;height:number;samples:{y:number;t:number}[]} | null=null;
  let coverPose: SleevePose|null=null,suppressReturnClick=false,returnPending=false;

  const geometry = () => rackGeometry(root.getBoundingClientRect(), compact);
  const currentGeometry=()=>morphSource?mixRack(morphSource.geometry(),geometry(),morphPosition.get()):geometry();
  const getPosition = () => compact ? compactPosition.get() : scroll.scrollTop / layout.step;
  const schedule = () => { if (!frame && active && !document.hidden) frame = requestAnimationFrame(paint); };
  const stopCoast = () => { cancelAnimationFrame(coast); coast=0; if(!morphSource)delete scroll.dataset.coasting; };

  function paint() {
    frame = 0;
    if (!active || document.hidden) return;
    const own = geometry(), progress = morphPosition.get();
    const expansion = compact ? 0 : Math.max(0, Math.min(1, progress));
    const g = morphSource ? mixRack(morphSource.geometry(), own, progress) : own;
    const origin = morphSource ? {left:0,top:0} : own;
    const scale = g.cover / layout.cover;
    const projectSurfaces=surfaceProjection.matches;
    const faceView=projectSurfaces||scale===1?g:{...g,perspective:g.perspective*scale};
    root.dataset.recordRenderer=projectSurfaces?"surfaces":"nested";
    camera.style.perspective = projectSurfaces?"none":`${g.perspective}px`;
    camera.style.perspectiveOrigin = `${g.cx-origin.left}px ${g.cy-origin.top}px`;
    scene.style.transform = `translate3d(${g.cx-origin.left}px,${g.cy-origin.top}px,0) scale(${scale})`;
    if (morphSource) {
      camera.dataset.morph = "true";
      camera.style.clipPath = `inset(${g.top}px ${innerWidth-g.left-g.width}px ${innerHeight-g.top-g.height}px ${g.left}px)`;
      const endSolid=1-.32*expansion,endClear=1-.15*expansion;
      camera.style.maskImage=selected!==null||expansion===0?"none":`linear-gradient(transparent ${g.top}px,#000 ${g.top+g.height*.1*expansion}px,#000 ${g.top+g.height*endSolid}px,transparent ${g.top+g.height*endClear}px)`;
    } else { delete camera.dataset.morph; camera.style.clipPath = ""; camera.style.maskImage=""; }
    const position = getPosition(), extraction = pull.get();paintedPosition=position;
    page?.style.setProperty("--record-detail-opacity",String(Math.max(0,Math.min(1,(extraction-.72)/.28))));
    page?.style.setProperty("--record-return-gap",String(Math.max(0,1-extraction)*12));
    const current = keyboard ? keyboardIndex : Math.round(clampRecord(position,records.length));
    if (current!==announced) {
      announced=current;
      if(!compact&&requested===null) root.setAttribute("aria-activedescendant",records[current].id);
      root.dispatchEvent(new CustomEvent("record-index",{bubbles:true,detail:{index:current}}));
    }
    const range = Math.ceil(g.height/g.step/2)+3;
    records.forEach((record,index)=>{
      const shown = Math.abs(index-position)<range || index===selected || (keyboard&&index===keyboardIndex);
      // Inherit hiding from the miniature during handoff and from the closed overlay.
      record.style.visibility=shown?"":"hidden";
      if(!compact) record.setAttribute("aria-selected",String(index===current));
      const video=record.querySelector<HTMLVideoElement>("video");
      const faceVisible=Math.abs(index-position)>.25||(index===selected&&extraction>.02);
      const playVideo=shown&&visible&&!reduced.matches&&faceVisible&&!(selected!==null&&index!==selected&&extraction>.98);
      if(video&&video.dataset.running!==String(playVideo)) {
        video.dataset.running=String(playVideo);
        if(playVideo) void video.play().catch(()=>undefined);else video.pause();
      }
      if(!shown)return;
      let pose=sleevePose(index,position,g,expansion);
      if(index===selected){
        pose=pullSleeve(pose,g,extraction,{width:innerWidth,height:innerHeight},selectedFlip);
        pose.x+=handX.get();pose.y+=handY.get();pose.z+=lift.get()*6;
        coverPose=pose;
        if(grab&&requested!==null){
          const polygon=sleevePolygons(pose,g)[0],xs=polygon.map(p=>p.x),ys=polygon.map(p=>p.y);
          grab.style.left=`${Math.min(...xs)-own.left}px`;grab.style.top=`${Math.min(...ys)-own.top}px`;
          grab.style.width=`${Math.max(...xs)-Math.min(...xs)}px`;grab.style.height=`${Math.max(...ys)-Math.min(...ys)}px`;
        }
      }else if(selected!==null&&!reduced.matches)pose.y+=Math.sign(index-selected)*Math.sin(Math.PI*extraction)*18;
      const surface=surfaces[index];
      if(projectSurfaces){
        // Keep the parent nondegenerate at 90°; each face carries the same complete projection.
        const transforms=sleeveSurfaceTransforms(pose,g,scale);
        record.style.transform=transforms.parent;
        for(const face of SLEEVE_FACES)surface[face].style.transform=transforms[face];
      }else{
        record.style.transform=`translate3d(${pose.x/scale}px,${pose.y/scale}px,${pose.z/scale}px) rotateX(${pose.angle}deg)`;
        if(surface.cover.style.transform)for(const face of SLEEVE_FACES)surface[face].style.transform="";
      }
      const visibleFaces=sleeveFaceVisibility(pose,faceView);
      for(const face of SLEEVE_FACES)surface[face].style.visibility=visibleFaces[face]?"":"hidden";
      record.style.setProperty("--record-flip",`${pose.flip}deg`);
      const distance = index - position;
      const storedOpacity = Math.max(0, Math.min(1, distance + 3, 2 - distance));
      const opacity = storedOpacity + (1 - storedOpacity) * expansion;
      record.style.setProperty("--record-opacity",String(index===selected?1:opacity*Math.max(0,Math.min(1,1-extraction))));
      const order = index * (1 - expansion) - Math.abs(distance) * 10 * expansion;
      record.style.zIndex=String(index===selected?2000:1000+Math.round(order));
    });
  }

  function measure() {
    if(returnGesture)api.select(requested);
    // Viewport changes can clamp native scrollTop before ResizeObserver runs.
    const position=compact?getPosition():keyboard?keyboardIndex:paintedPosition;layout=geometry();
    root.style.setProperty("--record-size",`${layout.cover}px`);
    root.style.setProperty("--record-step",`${layout.step}px`);
    root.style.setProperty("--record-height",`${layout.height}px`);
    if(!compact)scroll.scrollTop=clampRecord(position,records.length)*layout.step;
    if(page){const focus=recordFocus(layout,{width:innerWidth,height:innerHeight});page.style.setProperty("--record-detail-top",`${focus.detailTop}px`);page.dataset.detailLayout=focus.side?"side":"stack";}
    schedule();
  }
  const choose = (index: number, fromKeyboard=false) => root.dispatchEvent(new CustomEvent("record-select",{bubbles:true,detail:{index,keyboard:fromKeyboard}}));
  const putBack=(fromKeyboard=false)=>{if(requested!==null&&!returnPending){returnPending=true;root.dispatchEvent(new CustomEvent("record-return",{bubbles:true,detail:{keyboard:fromKeyboard}}));}};
  const clearReturnGesture=()=>{
    if(returnGesture?.moved)suppressReturnClick=true;
    const pointer=returnGesture?.id;returnGesture=null;delete root.dataset.returnDrag;delete page?.dataset.returnReady;
    if(pointer!==undefined&&grab?.hasPointerCapture(pointer))grab.releasePointerCapture(pointer);
  };

  const api: RecordRack = {root,records,getPosition,getSelected:()=>requested,getCurrentIndex:()=>keyboard?keyboardIndex:Math.round(clampRecord(getPosition(),records.length)),geometry,
    setPosition(value) {
      stopCoast();
      resting=clampRecord(value,records.length);keyboardIndex=Math.round(resting);keyboard=false;
      paintedPosition=resting;
      if(compact)compactPosition.jump(resting);else scroll.scrollTo({top:resting*layout.step,behavior:"instant"});
      schedule();
    },
    setActive(value) {
      active=value;
      if(!value){clearReturnGesture();stopCoast();compactPosition.stop();records.forEach(record=>record.querySelector("video")?.pause());records.forEach(record=>record.querySelector("video")?.removeAttribute("data-running"));}
      else {measure();paint();}
    },
    select(index) {
      clearReturnGesture();
      const run=++selectionRun;requested=index;returnPending=false;
      if(grab){grab.hidden=index===null;if(index!==null)grab.setAttribute("aria-label",`Put back ${records[index].dataset.recordTitle}. You can also drag the cover down.`);}
      if(!compact){
        root.tabIndex=index===null?0:-1;root.setAttribute("role",index===null?"listbox":"group");
        root.setAttribute("aria-label",index===null?browseLabel:`Selected record: ${records[index].dataset.recordTitle}`);
        camera.setAttribute("aria-hidden",String(index!==null));
        if(index===null)root.setAttribute("aria-activedescendant",records[api.getCurrentIndex()].id);else root.removeAttribute("aria-activedescendant");
      }
      if(index!==null) {
        if(selected!==index){handX.jump(0);handY.jump(0);lift.jump(0);pull.jump(0);selected=index;selectedFlip=sleevePose(index,getPosition(),geometry()).flip;}
        root.dataset.detail="true";stopCoast();
      }
      if(index===null&&selected!==null)root.dataset.recordReturning="true";else delete root.dataset.recordReturning;
      const done=()=>{if(run!==selectionRun)return;if(index===null){selected=null;delete root.dataset.detail;delete root.dataset.recordReturning;}schedule();};
      if(reduced.matches){handX.jump(0);handY.jump(0);lift.jump(0);pull.jump(index===null?0:1);done();}
      else {
        const spring={type:"spring" as const,stiffness:240,damping:28};
        animate(handX,0,spring);animate(handY,0,spring);animate(lift,0,spring);
        animate(pull,index===null?0:1,{...spring,onComplete:done});
      }
    },
    morph(source,open) {
      const run=++morphRun;stopMorph?.();finishMorph?.(false);
      if(!morphSource){morphSource=source;morphPosition.jump(open?0:1);}
      morphTarget=open?1:0;
      scroll.dataset.coasting="";
      if(open)api.setPosition(source.getPosition());
      api.setActive(true);paint();
      return new Promise(resolve=>{
        finishMorph=resolve;
        const done=()=>{
          if(run!==morphRun)return;
          morphSource=null;morphPosition.jump(1);delete camera.dataset.morph;camera.style.clipPath="";delete scroll.dataset.coasting;
          stopMorph=undefined;completeMorph=undefined;finishMorph=null;paint();resolve(true);
        };
        completeMorph=done;
        if(reduced.matches){morphPosition.jump(morphTarget);done();}
        else {const animation=animate(morphPosition,morphTarget,{type:"spring",stiffness:210,damping:29,onComplete:done});stopMorph=()=>animation.stop();}
      });
    },
  };

  compactPosition.on("change",schedule);morphPosition.on("change",schedule);pull.on("change",schedule);handX.on("change",schedule);handY.on("change",schedule);lift.on("change",schedule);
  grab?.addEventListener("pointerenter",()=>{if(fine.matches&&!returnGesture&&!reduced.matches)animate(lift,1,{type:"spring",stiffness:280,damping:26});});
  grab?.addEventListener("pointerleave",()=>{if(!returnGesture)animate(lift,0,{type:"spring",stiffness:280,damping:26});});
  grab?.addEventListener("pointerdown",event=>{
    if(event.button!==0||requested===null||!coverPose)return;
    if(returnGesture){api.select(requested);return;}
    ++selectionRun;pull.stop();handX.stop();handY.stop();lift.stop();
    const polygon=sleevePolygons(coverPose,currentGeometry())[0];
    returnGesture={id:event.pointerId,x:event.clientX,y:event.clientY,cx:polygon.reduce((sum,p)=>sum+p.x,0)/4,cy:polygon.reduce((sum,p)=>sum+p.y,0)/4,pull:pull.get(),distance:0,moved:false,width:innerWidth,height:innerHeight,samples:[{y:event.clientY,t:event.timeStamp}]};
    suppressReturnClick=false;root.dataset.returnDrag="true";grab.setPointerCapture(event.pointerId);
    if(!reduced.matches)animate(lift,1,{type:"spring",stiffness:280,damping:26});
  });
  grab?.addEventListener("pointermove",event=>{
    const drag=returnGesture;if(!drag||drag.id!==event.pointerId||selected===null)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y,g=currentGeometry();
    if(Math.hypot(dx,dy)>6)drag.moved=true;
    if(!drag.moved)return;
    event.preventDefault();drag.distance=Math.abs(dy)>Math.abs(dx)*.7?Math.max(0,dy):0;
    drag.samples.push({y:event.clientY,t:event.timeStamp});while(drag.samples.length>2&&event.timeStamp-drag.samples[0].t>90)drag.samples.shift();
    if(page)page.dataset.returnReady=String(shouldReturnRecord(drag.distance,0,g.cover));
    if(reduced.matches)return;
    pull.set(drag.pull*(1-Math.min(.72,drag.distance/(g.cover*.7))));
    const pose=pullSleeve(sleevePose(selected,getPosition(),g),g,pull.get(),{width:innerWidth,height:innerHeight},selectedFlip);pose.z+=lift.get()*6;
    const moved=placeSleeve(pose,g,{x:drag.cx+dx*.4,y:drag.cy+(dy>=0?dy:dy*.2)});
    handX.set(moved.x-pose.x);handY.set(moved.y-pose.y);
  });
  const endReturn=(event:PointerEvent)=>{
    const drag=returnGesture;if(!drag||drag.id!==event.pointerId)return;
    const first=drag.samples[0],last=drag.samples.at(-1)!,elapsed=last.t-first.t;
    const speed=event.timeStamp-last.t<100&&elapsed>0?(last.y-first.y)/elapsed:0;
    suppressReturnClick=drag.moved;clearReturnGesture();
    if(event.type==="pointerup"&&drag.moved&&drag.width===innerWidth&&drag.height===innerHeight&&shouldReturnRecord(drag.distance,speed,geometry().cover))putBack();
    else api.select(requested);
  };
  grab?.addEventListener("pointerup",endReturn);grab?.addEventListener("pointercancel",endReturn);grab?.addEventListener("lostpointercapture",endReturn);
  grab?.addEventListener("click",event=>{if(suppressReturnClick&&event.detail!==0){suppressReturnClick=false;event.preventDefault();return;}suppressReturnClick=false;putBack(event.detail===0);});
  scroll.addEventListener("scroll",()=>{if(!compact)schedule();},{passive:true});
  scroll.addEventListener("wheel",()=>{stopCoast();keyboard=false;},{passive:true});
  scroll.addEventListener("pointerdown",event=>{
    if(event.button!==0||requested!==null)return;
    stopCoast();keyboard=false;suppressClick=false;
    if(compact)compactPosition.stop();else scroll.scrollTo({top:scroll.scrollTop,behavior:"instant"});
    gesture={id:event.pointerId,x:event.clientX,y:event.clientY,top:scroll.scrollTop,index:getPosition(),time:event.timeStamp,last:event.clientY,v:0,moved:false,type:event.pointerType};
    if(event.pointerType==="mouse"){scroll.setPointerCapture(event.pointerId);scroll.dataset.dragging="";if(!compact)root.focus({preventScroll:true});}
  });
  scroll.addEventListener("pointermove",event=>{
    if(!gesture) {
      if(compact&&active&&!reduced.matches&&fine.matches&&event.pointerType==="mouse") {
        const rect=root.getBoundingClientRect(),target=clampRecord(resting+(.5-(event.clientY-rect.top)/rect.height)*.8,records.length);
        animate(compactPosition,target,{type:"spring",stiffness:220,damping:28});
      }
      return;
    }
    if(gesture.id!==event.pointerId)return;
    const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
    if(Math.hypot(dx,dy)>6)gesture.moved=true;
    if(compact) {
      if(event.pointerType==="touch"&&Math.abs(dx)<=Math.abs(dy))return;
      if(event.pointerType==="touch"&&gesture.moved)scroll.setPointerCapture(event.pointerId);
      const delta=event.pointerType==="touch"?dx:dy;
      compactPosition.set(clampRecord(gesture.index-delta/layout.step,records.length));
      if(gesture.moved)event.preventDefault();
    } else if(event.pointerType==="mouse") {
      const next=gesture.top-dy,delta=event.timeStamp-gesture.time;
      gesture.v=delta>0?(gesture.last-event.clientY)/delta:0;gesture.time=event.timeStamp;gesture.last=event.clientY;
      scroll.scrollTop=next;if(gesture.moved)event.preventDefault();
    }
  });
  const end = (event: PointerEvent) => {
    if(!gesture||gesture.id!==event.pointerId)return;
    const drag=gesture;gesture=null;delete scroll.dataset.dragging;suppressClick=drag.moved;
    if(compact&&drag.moved) {
      resting=clampRecord(Math.round(compactPosition.get()+compactPosition.getVelocity()*.1),records.length);
      if(reduced.matches)compactPosition.jump(resting);else animate(compactPosition,resting,{type:"spring",stiffness:200,damping:28});
    } else if(!compact&&drag.type==="mouse"&&drag.moved&&!reduced.matches) {
      velocity=event.timeStamp-drag.time<100?Math.max(-3,Math.min(3,drag.v)):0;
      scroll.dataset.coasting="";let last=performance.now();
      const tick=(now:number)=>{
        const dt=Math.min(32,now-last);last=now;velocity*=Math.exp(-dt/240);
        const before=scroll.scrollTop;scroll.scrollTop+=velocity*dt;
        if(Math.abs(velocity)>.02&&Math.abs(scroll.scrollTop-before)>.01)coast=requestAnimationFrame(tick);
        else{stopCoast();scroll.scrollTo({top:Math.round(getPosition())*layout.step,behavior:"smooth"});}
      };coast=requestAnimationFrame(tick);
    }
  };
  scroll.addEventListener("pointerup",end);scroll.addEventListener("pointercancel",end);
  scroll.addEventListener("pointerleave",()=>{if(compact&&!gesture&&active&&!reduced.matches)animate(compactPosition,resting,{type:"spring",stiffness:200,damping:28});});
  scroll.addEventListener("click",event=>{
    if(suppressClick){event.preventDefault();event.stopPropagation();suppressClick=false;return;}
    if(root.hasAttribute("data-record-returning")&&event.detail>1){event.preventDefault();return;}
    if(compact||requested!==null)return;
    const g=morphSource?mixRack(morphSource.geometry(),geometry(),morphPosition.get()):geometry();
    const index=pickSleeve({x:event.clientX,y:event.clientY},getPosition(),records.length,g);if(index!==null)choose(index);
  },true);
  root.addEventListener("keydown",event=>{
    if(compact||requested!==null)return;
    const deltas:Record<string,number>={ArrowDown:1,ArrowUp:-1,PageDown:4,PageUp:-4};
    if(event.key in deltas||event.key==="Home"||event.key==="End") {
      event.preventDefault();stopCoast();if(!keyboard)keyboardIndex=Math.round(clampRecord(getPosition(),records.length));keyboard=true;
      keyboardIndex=event.key==="Home"?0:event.key==="End"?records.length-1:clampRecord(keyboardIndex+deltas[event.key],records.length);
      scroll.scrollTo({top:keyboardIndex*layout.step,behavior:reduced.matches?"instant":"smooth"});schedule();
    }else if(event.key==="Enter"||event.key===" "){event.preventDefault();choose(keyboard?keyboardIndex:Math.round(clampRecord(getPosition(),records.length)),true);}
  });
  const observer=new ResizeObserver(measure);observer.observe(root);
  surfaceProjection.addEventListener("change",schedule);
  const intersection=new IntersectionObserver(([entry])=>{visible=!!entry?.isIntersecting;schedule();});intersection.observe(root);
  document.addEventListener("visibilitychange",()=>{if(document.hidden){if(returnGesture)api.select(requested);records.forEach(record=>record.querySelector("video")?.pause());}else{records.forEach(record=>record.querySelector("video")?.removeAttribute("data-running"));schedule();}});
  reduced.addEventListener("change",()=>{
    stopCoast();
    if(reduced.matches){clearReturnGesture();handX.jump(0);handY.jump(0);lift.jump(0);compactPosition.stop();pull.jump(requested===null?0:1);if(requested===null){selected=null;delete root.dataset.detail;delete root.dataset.recordReturning;}stopMorph?.();completeMorph?.();}
    schedule();
  });
  racks.set(root,api);measure();api.setPosition(INITIAL_RECORD);paint();return api;
}
