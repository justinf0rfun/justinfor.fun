"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { TextMorph } from "torph/react";
import XProfileLink from "./XProfileLink";
import { artwork, type ArtworkId } from "./intro-artwork/assets";
import "./intro-artwork/artwork.css";
import "./IntroCopy.css";

type Choice = { label: string } & ({ art: ArtworkId } | { image: string });
const companies = [
  { label: "Zuoyebang", image: "/zuoyebang-icon.png", tense: "Currently building agents" },
  { label: "DiDi", image: "/didi-icon.png", tense: "Previously worked on user growth" },
];
const groups: readonly (readonly Choice[])[] = [
  [{ label: "agents", art: "systems" }, { label: "products", art: "themes" }, { label: "tools", art: "icons" }],
  [{ label: "playful things", art: "colors" }, { label: "useful things", art: "states" }, { label: "things for fun", art: "effects" }],
  [{ label: "Claude Code", art: "claude" }, { label: "Codex", art: "chatgpt" }, { label: "Grok", art: "grok" }],
  companies,
];

function Artwork({ id }: { id: ArtworkId }) {
  const prefix = useId().replace(/[^a-z0-9]/gi, "-");
  const asset = artwork[id];
  if ("src" in asset) return <img className="intro-brand-art" src={asset.src} alt="" />;
  const html = asset.html
    .replace(/id="([^"]+)"/g, (_, key: string) => `id="${prefix}-${key}"`)
    .replace(/url\(#([^)]+)\)/g, (_, key: string) => `url(#${prefix}-${key})`)
    .replace(/href="#([^"]+)"/g, (_, key: string) => `href="#${prefix}-${key}"`);
  return <span className="intro-source-art" dangerouslySetInnerHTML={{ __html: html }} />;
}

function Token({ choices, index, onClick, label }: { choices: readonly Choice[]; index: number; onClick: () => void; label: string }) {
  const reduced = useReducedMotion();
  const measureRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [widths, setWidths] = useState<number[]>([]);
  const item = choices[index];
  const angle = "art" in item ? artwork[item.art].rotation : 0;
  const sign = angle < 0 ? -1 : 1;
  useLayoutEffect(() => {
    const measure = () => {
      if (!buttonRef.current || !measureRef.current) return;
      const style = getComputedStyle(buttonRef.current);
      const padding = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
      setWidths([...measureRef.current.children].map(span => Math.ceil(span.getBoundingClientRect().width + padding)));
    };
    const observer = new ResizeObserver(measure);
    if (measureRef.current) observer.observe(measureRef.current);
    measure();
    document.fonts.addEventListener("loadingdone", measure);
    return () => { observer.disconnect(); document.fonts.removeEventListener("loadingdone", measure); };
  }, [choices]);
  return <motion.button ref={buttonRef} type="button" className="intro-token" onClick={onClick}
    aria-label={`${label}: ${item.label}. Show ${choices[(index + 1) % choices.length].label}`}
    animate={{ width: widths[index] ?? "auto" }} transition={reduced ? { duration: 0 } : { type: "spring", visualDuration: .24, bounce: .2 }}>
    <AnimatePresence initial={false}>
      <motion.span className="intro-token-art" key={"art" in item ? item.art : item.image} aria-hidden="true"
        initial={reduced ? false : { opacity: 0, scale: .4, rotate: angle - 16 * sign }}
        animate={{ opacity: 1, scale: reduced ? 1 : [.4, 1.2, 1], rotate: reduced ? angle : [angle - 16 * sign, angle + 5 * sign, angle] }}
        exit={{ opacity: 0, scale: reduced ? 1 : .5, rotate: angle + 5 * sign }}
        transition={{ duration: reduced ? 0 : .6, times: [0, 2 / 3, 1], ease: [.16, .55, .3, 1], opacity: { duration: reduced ? 0 : .18 }, scale: { duration: reduced ? 0 : .6, times: [0, 2 / 3, 1] } }}>
        {"image" in item ? <img className="intro-brand-art intro-company-art" src={item.image} alt="" /> : <Artwork id={item.art} />}
      </motion.span>
    </AnimatePresence>
    <TextMorph as="span" className="intro-token-label" duration={200} respectReducedMotion>{item.label}</TextMorph>
    <span ref={measureRef} className="intro-token-measures" aria-hidden="true">{choices.map(choice => <span key={choice.label}>{choice.label}</span>)}</span>
  </motion.button>;
}

export default function IntroCopy({ location }: { location: ReactNode }) {
  const [indices, setIndices] = useState([0, 0, 0, 0]);
  const [visible, setVisible] = useState(true);
  const nextGroup = useRef(2);
  const first = useRef(true);
  const guideRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const company = companies[indices[3]];
  const cycle = (slot: number) => {
    nextGroup.current = (slot + 1) % groups.length;
    first.current = false;
    setIndices(current => current.map((value, i) => i === slot ? (value + 1) % groups[i].length : value));
  };
  useEffect(() => {
    const change = () => setVisible(!document.hidden);
    change();
    document.addEventListener("visibilitychange", change);
    const guide = guideRef.current;
    if (guide) guide.dataset.guideReady = "true";
    document.dispatchEvent(new CustomEvent("home-intro-ready"));
    return () => {
      document.removeEventListener("visibilitychange", change);
      if (guide) delete guide.dataset.guideReady;
    };
  }, []);
  useEffect(() => {
    if (reduced || !visible) return;
    const timer = window.setTimeout(() => cycle(nextGroup.current), first.current ? 600 : 1800);
    return () => window.clearTimeout(timer);
  }, [indices, reduced, visible]);

  return <div className="intro-copy">
    <h2 className="intro-copy-line">
      <span className="intro-copy-phrase">I turn ideas into <Token choices={groups[0]} index={indices[0]} onClick={() => cycle(0)} label="I turn ideas into" /></span>
      <span className="intro-copy-phrase">and build <Token choices={groups[1]} index={indices[1]} onClick={() => cycle(1)} label="And build" /> with help from <Token choices={groups[2]} index={indices[2]} onClick={() => cycle(2)} label="With help from" />.</span>
    </h2>
    <div className="intro-copy-body">
      <p>
        <span className="intro-employment-row"><TextMorph as="span" className="intro-employment-prefix" duration={200} respectReducedMotion>{company.tense}</TextMorph>{" "}<motion.span className="intro-employment-company" layout="position" transition={reduced ? { duration: 0 } : { type: "spring", visualDuration: .24, bounce: .2 }}>at <Token choices={groups[3]} index={indices[3]} onClick={() => cycle(3)} label={`${company.tense} at`} /></motion.span></span>
        {location}
      </p>
      <div>You can reach me on <XProfileLink />, or tap <button ref={guideRef} type="button" className="intro-contact-action" data-home-chat-guide disabled aria-controls="home-chat"><span className="intro-contact-icon" aria-hidden="true"><Artwork id="languages" /></span>Say hi</button> below to chat with me.</div>
    </div>
  </div>;
}
