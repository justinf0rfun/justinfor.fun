import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { TextMorph } from "./vendor/torph/dist/react/index.mjs";
import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import manifest from "../manifest.json";
import signature from "./assets/signature.svg?raw";
import badge from "./assets/verified.svg?raw";
import "../artwork/artwork.css";
import "./style.css";

const fragments = import.meta.glob("../artwork/*.fragment.html", { eager: true, query: "?raw", import: "default" });
const images = import.meta.glob("../agents/*.{png,svg}", { eager: true, query: "?url", import: "default" });
const inventory = Object.fromEntries(manifest.assets.map(asset => [asset.id, asset]));
const referenceBase = import.meta.env.PROD ? "/reference" : `/@fs/${__REFERENCE_ROOT__}`;
const groups = [
  [{label:"agents",art:"systems"},{label:"products",art:"themes"},{label:"tools",art:"icons"}],
  [{label:"playful things",art:"colors"},{label:"useful things",art:"states"},{label:"things for fun",art:"effects"}],
  [{label:"Claude Code",art:"claude"},{label:"Codex",art:"chatgpt"},{label:"Grok",art:"grok"}],
  [{label:"Zuoyebang",image:"/zuoyebang-icon.png",tense:"Currently building agents"},{label:"DiDi",image:"/didi-icon.png",tense:"Previously worked on user growth"}],
];

function Artwork({ id }) {
  const prefix = useId().replace(/[^a-z0-9]/gi,"-");
  const asset = inventory[id];
  if (asset.group === "agent") return <img className="brand-art" src={images[`../${asset.presentationPath}`]} alt="" />;
  const raw = fragments[`../${asset.originalFragmentPath}`]
    .replace(/id="([^"]+)"/g, (_,key) => `id="${prefix}-${key}"`)
    .replace(/url\(#([^)]+)\)/g, (_,key) => `url(#${prefix}-${key})`)
    .replace(/href="#([^"]+)"/g, (_,key) => `href="#${prefix}-${key}"`);
  return <span className="source-art" dangerouslySetInnerHTML={{__html:raw}} />;
}

function Token({ choices, index, onClick, label }) {
  const reduced = useReducedMotion();
  const measureRef = useRef(null);
  const buttonRef = useRef(null);
  const [widths,setWidths] = useState([]);
  const item = choices[index];
  const angle = inventory[item.art]?.renderingNotes?.outerRotationDegrees ?? (item.art === "chatgpt" ? -12 : 0);
  const sign = angle < 0 ? -1 : 1;
  useLayoutEffect(() => {
    const measure = () => {
      const style = getComputedStyle(buttonRef.current);
      const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      setWidths([...measureRef.current.children].map(span => Math.ceil(span.getBoundingClientRect().width + padding)));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(measureRef.current);
    measure(); document.fonts.addEventListener("loadingdone",measure);
    return () => {observer.disconnect();document.fonts.removeEventListener("loadingdone",measure);};
  }, [choices]);
  return <motion.button ref={buttonRef} type="button" className="hero-token" onClick={onClick}
    aria-label={`${label}: ${item.label}. Show ${choices[(index+1)%choices.length].label}`}
    animate={{width:widths[index] ?? "auto"}} transition={reduced ? {duration:0} : {type:"spring",visualDuration:.24,bounce:.2}}>
    <AnimatePresence initial={false}>
      <motion.span className="token-art" key={item.art ?? item.image}
        initial={reduced ? false : {opacity:0,scale:.4,rotate:angle-16*sign}}
        animate={{opacity:1,scale:reduced?1:[.4,1.2,1],rotate:reduced?angle:[angle-16*sign,angle+5*sign,angle]}}
        exit={{opacity:0,scale:reduced?1:.5,rotate:angle+5*sign}}
        transition={{duration:reduced?0:.6,times:[0,2/3,1],ease:[.16,.55,.3,1],opacity:{duration:reduced?0:.18},scale:{duration:reduced?0:.6,times:[0,2/3,1]}}}>
        {item.image ? <img className="brand-art company-art" src={item.image} alt="" /> : <Artwork id={item.art} />}
      </motion.span>
    </AnimatePresence>
    <TextMorph as="span" className="token-label" duration={200} respectReducedMotion>{item.label}</TextMorph>
    <span ref={measureRef} className="token-measures" aria-hidden="true">{choices.map(choice=><span key={choice.label}>{choice.label}</span>)}</span>
  </motion.button>;
}

function App() {
  const [indices,setIndices] = useState([0,0,0,0]);
  const [automatic,setAutomatic] = useState(true);
  const [dark,setDark] = useState(false);
  const [visible,setVisible] = useState(!document.hidden);
  const nextGroup = useRef(2);
  const first = useRef(true);
  const signatureRef = useRef(null);
  const reduced = useReducedMotion();
  const company = groups[3][indices[3]];
  const cycle = slot => {
    nextGroup.current=(slot+1)%groups.length; first.current=false;
    setIndices(current=>current.map((value,i)=>i===slot?(value+1)%groups[i].length:value));
  };
  useEffect(()=>{
    const change=()=>setVisible(!document.hidden);
    document.addEventListener("visibilitychange",change);
    return()=>document.removeEventListener("visibilitychange",change);
  },[]);
  useEffect(()=>{
    if(!automatic || reduced || !visible)return;
    const timer=setTimeout(()=>cycle(nextGroup.current),first.current?600:1800);
    return()=>clearTimeout(timer);
  },[indices,automatic,reduced,visible]);
  useEffect(()=>{document.documentElement.dataset.theme=dark?"dark":"light";},[dark]);
  useLayoutEffect(()=>{
    if(reduced)return;
    gsap.registerPlugin(DrawSVGPlugin);
    const context=gsap.context(()=>{
      const paths=[...signatureRef.current.querySelectorAll("path")];
      const total=paths.reduce((sum,path)=>sum+path.getTotalLength(),0);
      gsap.set(paths,{drawSVG:"0% 0%"});
      const timeline=gsap.timeline({defaults:{ease:"none"}});
      paths.forEach(path=>timeline.to(path,{drawSVG:"0% 100%",duration:path.getTotalLength()/total*2.6}));
    },signatureRef);
    return()=>context.revert();
  },[reduced]);
  return <>
    <main className="intro">
      <header className="identity">
        <img className="avatar" src="/justin-avatar.png" width="48" height="48" alt="Justin" />
        <div><h1>Justin <span className="verified" dangerouslySetInnerHTML={{__html:badge}} /></h1><p>AI Agent Engineer</p></div>
      </header>
      <h2 className="intro-line"><span className="intro-phrase">I turn ideas into <Token choices={groups[0]} index={indices[0]} onClick={()=>cycle(0)} label="I turn ideas into" /></span><span className="intro-phrase intro-combined">and build <Token choices={groups[1]} index={indices[1]} onClick={()=>cycle(1)} label="And build" /> with help from <Token choices={groups[2]} index={indices[2]} onClick={()=>cycle(2)} label="With help from" />.</span></h2>
      <div className="body-copy">
        <p><span className="employment-row"><TextMorph as="span" className="employment-prefix" duration={200} respectReducedMotion>{company.tense}</TextMorph>{" "}<motion.span className="employment-company" layout="position" transition={reduced ? {duration:0} : {type:"spring",visualDuration:.24,bounce:.2}}>at <Token choices={groups[3]} index={indices[3]} onClick={()=>cycle(3)} label={`${company.tense} at`} /></motion.span></span><span className="employment-location">Based in <a href="https://www.openstreetmap.org/?mlat=39.9042&mlon=116.4074#map=12/39.9042/116.4074" target="_blank" rel="noreferrer">Beijing</a>, China.</span></p>
        <p>You can reach me on <a href="https://x.com/justinforfun" target="_blank" rel="noreferrer">X</a>, or tap <span className="contact-action"><span className="contact-action-icon" aria-hidden="true"><Artwork id="languages" /></span>Say hi</span> below to chat with me.</p>
      </div>
      <div ref={signatureRef} className="signature-wrap" dangerouslySetInnerHTML={{__html:signature}} />
      <aside className="demo-controls" aria-label="Demo controls"><span>INTRO DEMO</span><label><input type="checkbox" checked={automatic} onChange={event=>setAutomatic(event.target.checked)} />自动轮换</label><button type="button" aria-pressed={dark} onClick={()=>setDark(value=>!value)}>{dark?"浅色":"深色"}</button></aside>
      <details className="inventory" open><summary>原站素材已收齐 · 16 / 16 <span>3 + 8 + 5</span></summary>
        <p>上方使用 10 个原站图标，另沿用本站的 2 个公司图标。下面展示完整的 16 个原站状态，点图标可单独查看。</p>
        {[['language','视觉概念'],['detail','设计细节'],['agent','工具 / 品牌']].map(([group,title])=><section key={group}><h3>{title}</h3><div className="asset-grid">{manifest.assets.filter(asset=>asset.group===group).map(asset=><a key={asset.id} href={`${referenceBase}/${asset.presentationPath}`} target="_blank" rel="noreferrer" className="asset-cell"><span className="asset-art" style={{rotate:`${asset.renderingNotes?.outerRotationDegrees??0}deg`}}><Artwork id={asset.id}/></span><span>{asset.label}</span></a>)}</div></section>)}
      </details>
    </main>
  </>;
}

createRoot(document.getElementById("root")).render(<App />);
