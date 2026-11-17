import { animate, motionValue } from "motion";
import { INITIAL_RECORD, clampRecord, mixRack, pickSleeve, pullSleeve, rackGeometry, recordFocus, sleevePose, type RackGeometry } from "../lib/record-rack";

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
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover:hover) and (pointer:fine)");
  const compactPosition = motionValue(INITIAL_RECORD), morphPosition = motionValue(1), pull = motionValue(0);
  let layout = rackGeometry(root.getBoundingClientRect(), compact), active = compact, visible = true, frame = 0;
  let paintedPosition=INITIAL_RECORD;
  let resting = INITIAL_RECORD, announced = -1, requested: number | null = null, selected: number | null = null, selectedFlip = 0;
  let selectionRun = 0, morphRun = 0, morphSource: RecordRack | null = null, morphTarget = 1;
  let finishMorph: ((complete: boolean) => void) | null = null;
  let completeMorph: (()=>void) | undefined;
  let stopMorph: (() => void) | undefined, coast = 0, velocity = 0;
  let keyboard = false, keyboardIndex = INITIAL_RECORD, suppressClick = false;
  let gesture: { id:number;x:number;y:number;top:number;index:number;time:number;last:number;v:number;moved:boolean;type:string } | null = null;

  const geometry = () => rackGeometry(root.getBoundingClientRect(), compact);
  const getPosition = () => compact ? compactPosition.get() : scroll.scrollTop / layout.step;
  const schedule = () => { if (!frame && active && !document.hidden) frame = requestAnimationFrame(paint); };
  const stopCoast = () => { cancelAnimationFrame(coast); coast=0; if(!morphSource)delete scroll.dataset.coasting; };

  function paint() {
    frame = 0;
    if (!active || document.hidden) return;
    const own = geometry(), progress = morphPosition.get();
    const g = morphSource ? mixRack(morphSource.geometry(), own, progress) : own;
    const origin = morphSource ? {left:0,top:0} : own;
    const scale = g.cover / layout.cover;
    camera.style.perspective = `${g.perspective}px`;
    camera.style.perspectiveOrigin = `${g.cx-origin.left}px ${g.cy-origin.top}px`;
    scene.style.transform = `translate3d(${g.cx-origin.left}px,${g.cy-origin.top}px,0) scale(${scale})`;
    if (morphSource) {
      camera.dataset.morph = "true";
      camera.style.clipPath = `inset(${g.top}px ${innerWidth-g.left-g.width}px ${innerHeight-g.top-g.height}px ${g.left}px round ${Math.max(0,(1-progress)*18)}px)`;
      const endSolid=.9-.22*progress,endClear=1-.15*progress;
      camera.style.maskImage=selected!==null?"none":`linear-gradient(transparent ${g.top}px,#000 ${g.top+g.height*.1}px,#000 ${g.top+g.height*endSolid}px,transparent ${g.top+g.height*endClear}px)`;
    } else { delete camera.dataset.morph; camera.style.clipPath = ""; camera.style.maskImage=""; }
    const position = getPosition(), extraction = pull.get();paintedPosition=position;
    const current = keyboard ? keyboardIndex : Math.round(clampRecord(position,records.length));
    if (current!==announced) {
      announced=current;
      if(!compact) root.setAttribute("aria-activedescendant",records[current].id);
      root.dispatchEvent(new CustomEvent("record-index",{bubbles:true,detail:{index:current}}));
    }
    const range = Math.ceil(g.height/g.step/2)+3;
    records.forEach((record,index)=>{
      const shown = Math.abs(index-position)<range || index===selected || (keyboard&&index===keyboardIndex);
      record.style.visibility=shown?"visible":"hidden";
      if(!compact) record.setAttribute("aria-selected",String(index===current));
      const video=record.querySelector<HTMLVideoElement>("video");
      const faceVisible=Math.abs(index-position)>.25||(index===selected&&extraction>.02);
      const playVideo=shown&&visible&&!reduced.matches&&faceVisible&&!(selected!==null&&index!==selected&&extraction>.98);
      if(video&&video.dataset.running!==String(playVideo)) {
        video.dataset.running=String(playVideo);
        if(playVideo) void video.play().catch(()=>undefined);else video.pause();
      }
      if(!shown)return;
      let pose=sleevePose(index,position,g);
      if(index===selected)pose=pullSleeve(pose,g,extraction,{width:innerWidth,height:innerHeight},selectedFlip);
      record.style.transform=`translate3d(${pose.x/scale}px,${pose.y/scale}px,${pose.z/scale}px) rotateX(${pose.angle}deg)`;
      record.style.setProperty("--record-flip",`${pose.flip}deg`);
      record.style.setProperty("--record-opacity",String(index===selected?1:Math.max(0,Math.min(1,1-extraction))));
      record.style.zIndex=String(index===selected?2000:1000-Math.round(Math.abs(index-position)*10));
    });
  }

  function measure() {
    // Viewport changes can clamp native scrollTop before ResizeObserver runs.
    const position=compact?getPosition():keyboard?keyboardIndex:paintedPosition;layout=geometry();
    root.style.setProperty("--record-size",`${layout.cover}px`);
    root.style.setProperty("--record-step",`${layout.step}px`);
    root.style.setProperty("--record-height",`${layout.height}px`);
    if(!compact)scroll.scrollTop=clampRecord(position,records.length)*layout.step;
    const page=root.closest<HTMLElement>("[data-record-page]");
    if(page){const focus=recordFocus(layout,{width:innerWidth,height:innerHeight});page.style.setProperty("--record-detail-top",`${focus.detailTop}px`);page.dataset.detailLayout=focus.side?"side":"stack";}
    schedule();
  }
  const choose = (index: number, fromKeyboard=false) => root.dispatchEvent(new CustomEvent("record-select",{bubbles:true,detail:{index,keyboard:fromKeyboard}}));

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
      if(!value){stopCoast();compactPosition.stop();records.forEach(record=>record.querySelector("video")?.pause());records.forEach(record=>record.querySelector("video")?.removeAttribute("data-running"));}
      else {measure();paint();}
    },
    select(index) {
      const run=++selectionRun;requested=index;
      if(!compact)root.tabIndex=index===null?0:-1;
      if(index!==null) {
        if(selected!==index){pull.jump(0);selected=index;selectedFlip=sleevePose(index,getPosition(),geometry()).flip;}
        root.dataset.detail="true";stopCoast();
      }
      const done=()=>{if(run!==selectionRun)return;if(index===null){selected=null;delete root.dataset.detail;}schedule();};
      if(reduced.matches){pull.jump(index===null?0:1);done();}
      else animate(pull,index===null?0:1,{type:"spring",stiffness:240,damping:30,onComplete:done});
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

  compactPosition.on("change",schedule);morphPosition.on("change",schedule);pull.on("change",schedule);
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
      if(compact&&active&&fine.matches&&event.pointerType==="mouse") {
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
  scroll.addEventListener("pointerleave",()=>{if(compact&&!gesture&&active)animate(compactPosition,resting,{type:"spring",stiffness:200,damping:28});});
  scroll.addEventListener("click",event=>{
    if(suppressClick){event.preventDefault();event.stopPropagation();suppressClick=false;return;}
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
  const intersection=new IntersectionObserver(([entry])=>{visible=!!entry?.isIntersecting;schedule();});intersection.observe(root);
  document.addEventListener("visibilitychange",()=>{if(document.hidden)records.forEach(record=>record.querySelector("video")?.pause());else{records.forEach(record=>record.querySelector("video")?.removeAttribute("data-running"));schedule();}});
  reduced.addEventListener("change",()=>{
    stopCoast();
    if(reduced.matches){compactPosition.stop();pull.jump(requested===null?0:1);if(requested===null){selected=null;delete root.dataset.detail;}stopMorph?.();completeMorph?.();}
    schedule();
  });
  racks.set(root,api);measure();api.setPosition(INITIAL_RECORD);paint();return api;
}
