import { mountRecordRack } from "./record-rack";
import { mountMusicPreviews, pauseMusicPreviews } from "./music-preview";
import { INITIAL_RECORD, clampRecord } from "../lib/record-rack";

export function mountMusicPage(page: HTMLElement) {
  const overlay=page.dataset.musicStage==="overlay";
  const rack=mountRecordRack(page.querySelector<HTMLElement>("[data-record-rack=full]")!);
  const entry=overlay?document.querySelector<HTMLAnchorElement>("[data-music-entry]"):null;
  const miniRoot=entry?.querySelector<HTMLElement>("[data-record-rack=compact]");
  const mini=miniRoot?mountRecordRack(miniRoot):null;
  const main=document.querySelector<HTMLElement>(".home-content");
  const parent=page.querySelector<HTMLElement>("[data-parent-navigation]")!;
  const parentLabel=parent.querySelector<HTMLElement>(".parent-link-label")!;
  const panels=[...page.querySelectorAll<HTMLElement>("[data-record-panel]")];
  const returnButton=page.querySelector<HTMLButtonElement>("[data-record-return]")!;
  const returnSpines=[...returnButton.querySelectorAll<HTMLElement>("[data-return-spine]")];
  const title=page.querySelector<HTMLElement>("[data-record-current]")!,artist=page.querySelector<HTMLElement>("[data-record-artist-label]")!,count=page.querySelector<HTMLElement>("[data-record-count]")!;
  let open=!overlay,run=0,restore: (()=>void)|null=null,keyboard=false,mediaInRack=false;
  let returning=0,detailReturning=false;
  const swapMotionArtwork = () => {
    mini?.records.forEach((record,index)=>{
      const small=record.querySelector("video"),large=rack.records[index].querySelector("video");
      if(!small||!large)return;
      small.removeAttribute("data-running");large.removeAttribute("data-running");
      const parent=large.parentElement!;
      small.replaceWith(large);parent.prepend(small);
    });
  };

  const update = (index: number) => {
    const record=rack.records[Math.round(clampRecord(index,rack.records.length))];
    title.textContent=record.dataset.recordTitle??"";artist.textContent=record.dataset.recordArtist??"";
    count.textContent=`${String(index+1).padStart(2,"0")} / ${rack.records.length}`;
  };
  const setDetail = (index: number|null) => {
    detailReturning=false;
    pauseMusicPreviews();rack.select(index);
    const slug=index===null?null:rack.records[index].dataset.recordSlug;
    if(index!==null){
      returnButton.setAttribute("aria-label",`Put back ${rack.records[index].dataset.recordTitle}`);
      returnSpines.forEach((spine,i)=>{const record=rack.records[clampRecord(index+(i?1:-1),rack.records.length)];spine.style.setProperty("--spine-art",record.style.getPropertyValue("--record-art"));});
    }
    panels.forEach(panel=>panel.hidden=panel.dataset.recordPanel!==slug);
    page.dataset.musicView=index===null?"browse":"detail";
    parentLabel.textContent=index===null?"Home":"Music";
    parent.setAttribute("aria-label",`Back to ${index===null?"Home":"Music"}`);
    if(keyboard){if(index===null)rack.root.focus({preventScroll:true});else panels.find(panel=>panel.dataset.recordPanel===slug)?.querySelector<HTMLElement>("[data-music-action],a[href]")?.focus({preventScroll:true});}
  };
  const take = (index: number) => {
    const slug=rack.records[index].dataset.recordSlug;
    history.pushState({...history.state,record:slug},"",location.href);
    setDetail(index);
  };
  const show = async (push: boolean) => {
    if(!mini||!entry)return;
    const generation=++run;open=true;
    clearTimeout(returning);delete page.dataset.musicReturning;
    if(push)history.pushState({folder:"music"},"","/music");
    if(!restore) {
      const inert=main?.inert,overflow=document.documentElement.style.overflow;
      restore=()=>{if(main)main.inert=!!inert;document.documentElement.style.overflow=overflow;};
    }
    if(main)main.inert=true;document.documentElement.style.overflow="hidden";
    page.classList.add("is-open");page.classList.remove("is-closing");page.setAttribute("aria-hidden","false");page.inert=false;
    mini.setActive(false);mini.root.style.visibility="hidden";
    if(!mediaInRack){swapMotionArtwork();mediaInRack=true;}
    const completed=await rack.morph(mini,true);
    if(!completed||generation!==run||!open)return;
    if(keyboard&&rack.getSelected()===null)rack.root.focus({preventScroll:true});
  };
  const hide = async () => {
    if(!mini||!open)return;
    const generation=++run;open=false;pauseMusicPreviews();setDetail(null);
    page.dataset.musicReturning="true";
    rack.setPosition(rack.getPosition());
    mini.setPosition(rack.getPosition());
    page.classList.add("is-closing");page.inert=true;
    const completed=await rack.morph(mini,false);
    if(!completed||generation!==run||open)return;
    if(mediaInRack){swapMotionArtwork();mediaInRack=false;}
    mini.setPosition(rack.getPosition());mini.setActive(true);mini.root.style.visibility="";
    page.classList.remove("is-open","is-closing");page.setAttribute("aria-hidden","true");rack.setActive(false);
    restore?.();restore=null;
    returning=window.setTimeout(()=>{delete page.dataset.musicReturning;},160);
    if(keyboard)entry?.focus({preventScroll:true});
  };
  const back = () => {
    if(rack.getSelected()!==null) {
      if(detailReturning)return;
      detailReturning=true;
      if(history.state?.record)history.back();else setDetail(null);
    }else if(overlay) {
      if(history.state?.folder==="music")history.back();else void hide();
    }else location.assign("/");
  };

  entry?.addEventListener("click",event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();keyboard=event.detail===0;void show(true);
  });
  parent.addEventListener("click",event=>{
    if(overlay||rack.getSelected()!==null){event.preventDefault();keyboard=(event as MouseEvent).detail===0;back();}
  });
  rack.root.addEventListener("record-index",event=>update((event as CustomEvent<{index:number}>).detail.index));
  rack.root.addEventListener("record-select",event=>{const detail=(event as CustomEvent<{index:number;keyboard:boolean}>).detail;keyboard=detail.keyboard;take(detail.index);});
  rack.root.addEventListener("record-return",event=>{keyboard=(event as CustomEvent<{keyboard:boolean}>).detail.keyboard;back();});
  returnButton.addEventListener("click",event=>{if(rack.getSelected()!==null){keyboard=event.detail===0;back();}});
  page.querySelector("[data-record-open]")?.addEventListener("click",event=>{keyboard=(event as MouseEvent).detail===0;take(rack.getCurrentIndex());});
  addEventListener("popstate",()=>{
    if(overlay) {
      const isMusic=location.pathname.replace(/\/$/,"")==="/music";
      if(isMusic&&!open)void show(false);else if(!isMusic&&open)void hide();
      if(!isMusic)return;
    }
    const index=rack.records.findIndex(record=>record.dataset.recordSlug===history.state?.record);
    setDetail(index>=0?index:null);
  });
  addEventListener("keydown",event=>{
    if(!open)return;
    if(event.key==="Escape"){event.preventDefault();keyboard=true;back();}
    else if(overlay&&event.key==="Tab") {
      const focusable=[...page.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),[tabindex="0"]')].filter(el=>!el.closest("[hidden]")&&el.getClientRects().length&&getComputedStyle(el).visibility!=="hidden");
      const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  });
  if(!overlay) {
    const system=matchMedia("(prefers-color-scheme:dark)");system.addEventListener("change",()=>{if(document.documentElement.dataset.homeMode==="system")document.documentElement.dataset.homeTheme=system.matches?"dark":"light";});
    rack.setActive(true);
  }else rack.setActive(false);
  update(INITIAL_RECORD);mountMusicPreviews(page);
}
