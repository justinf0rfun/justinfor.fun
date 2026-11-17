// Adapted from Ashwin's ThingsShelf production component; see uses-shelf/SOURCE.md.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { shelfInset, shelfTilt, usesCategories, usesShelfItems, type ShelfItem } from "../lib/uses-shelf";
import "./uses-shelf/shelf.css";

function ShelfCard({ item, eager, reduced }: { item: ShelfItem; eager: boolean; reduced: boolean }) {
  const artwork = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (!item.animatedLogo || !artwork.current) return;
    const target = artwork.current;
    const store = target.closest(".uses-stage")?.querySelector<HTMLElement>("[data-uses-grok-storage]");
    const svg = store?.querySelector<SVGSVGElement>("[data-grok-bot-mark]");
    const fallback = target.querySelector("img");
    if (!store || !svg || !fallback) return;
    // Keep the native animated SVG alive when a filtered Motion item unmounts.
    target.append(svg); fallback.hidden = true;
    return () => { store.append(svg); fallback.hidden = false; };
  }, [item.animatedLogo]);

  const move = (event: PointerEvent<HTMLElement>) => {
    if (reduced || event.pointerType !== "mouse") return;
    const target = event.currentTarget, rect = target.getBoundingClientRect();
    const tilt = shelfTilt((event.clientX - rect.left) / rect.width - .5, (event.clientY - rect.top) / rect.height - .5);
    target.style.setProperty("--rx", tilt.rx); target.style.setProperty("--ry", tilt.ry); target.style.setProperty("--sx", tilt.sx);
  };
  const leave = (event: PointerEvent<HTMLElement>) => {
    for (const property of ["--rx", "--ry", "--sx"]) event.currentTarget.style.removeProperty(property);
  };
  const Tag = item.href ? "a" : "article";
  const ratio = item.bounds ? item.bounds[2] / item.bounds[3] : item.width / item.height;
  const style = { "--h": item.size, "--ratio": ratio, "--ground": "82%" } as CSSProperties;
  const imageStyle: CSSProperties | undefined = item.bounds ? {
    position: "absolute", width: `${item.width / item.bounds[2] * 100}%`, height: `${item.height / item.bounds[3] * 100}%`,
    left: `${-item.bounds[0] / item.bounds[2] * 100}%`, top: `${-item.bounds[1] / item.bounds[3] * 100}%`,
  } : undefined;

  return <Tag className={`uses-card${item.visualTreatment === "banner" ? " uses-banner" : ""}`} href={item.href} target={item.href ? "_blank" : undefined} rel={item.href ? "noreferrer" : undefined}
    onPointerMove={move} onPointerLeave={leave} style={style}>
    <span className="uses-artwork" data-use-logo-target={item.preview >= 0 ? String(item.preview) : undefined}>
      <span className="uses-floor" aria-hidden="true" />
      <span className={`uses-object${item.visualTreatment === "zoomed" ? " uses-cropped-photo" : ""}${item.bounds ? " uses-cropped-art" : ""}`} ref={artwork}>
        <img className="uses-photo" src={item.image} alt="" width={item.width} height={item.height} style={imageStyle} draggable={false} loading={eager ? "eager" : "lazy"} decoding="async" data-use-preview-logo={item.preview >= 0 ? "" : undefined} />
      </span>
    </span>
    <span className="uses-caption">
      <span className="uses-name">{item.name}{item.badge && <span className="uses-badge">{item.badge}</span>}</span>
      <span className="uses-meta"><span className="uses-group-label">{item.group}</span>{item.slogan && <span>{item.slogan}</span>}</span>
    </span>
  </Tag>;
}

export default function UsesShelf({ mode }: { mode: "overlay" | "standalone" }) {
  const [category, setCategory] = useState("All"), [generation, setGeneration] = useState(0), [ready, setReady] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const reduced = !!useReducedMotion();

  useEffect(() => {
    setReady(true);
    if (mode !== "overlay") return;
    const stage = root.current?.closest(".uses-stage");
    const prepare = () => flushSync(() => { setCategory("All"); setGeneration(value => value + 1); });
    stage?.addEventListener("uses-prepare", prepare);
    return () => stage?.removeEventListener("uses-prepare", prepare);
  }, [mode]);

  const items = category === "All" ? usesShelfItems : usesShelfItems.filter(item => item.category === category);
  const transition = reduced ? { duration: 0 } : {
    layout: { type: "spring" as const, stiffness: 260, damping: 32 },
    default: { duration: .28, ease: [.3, 1, .4, 1] as const },
  };

  return <MotionConfig reducedMotion="user">
    <div className="uses-gallery" ref={root} data-uses-ready={ready}>
      <div className="uses-filters" role="group" aria-label="Filter tools by category" data-use-reveal="">
        {usesCategories.map((name, index) => <button key={name} className="uses-filter" type="button" disabled={!ready} aria-pressed={category === name} onClick={() => setCategory(name)}>
          {name}{index < usesCategories.length - 1 && <span aria-hidden="true">,</span>}
          <sup>{name === "All" ? usesShelfItems.length : usesShelfItems.filter(item => item.category === name).length}</sup>
        </button>)}
      </div>
      <ul className="uses-shelf" key={generation} aria-label={`${category === "All" ? "All tools" : category} collection`}>
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((item, index) => <motion.li key={item.id} layout className="uses-item" data-use-id={item.id}
            data-inset4={shelfInset(index, 4)} data-inset3={shelfInset(index, 3)}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: .94, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={reduced ? { opacity: 0 } : { opacity: 0, scale: .94, filter: "blur(10px)" }} transition={transition}>
            <ShelfCard item={item} eager={index < 4} reduced={reduced} />
          </motion.li>)}
        </AnimatePresence>
      </ul>
    </div>
  </MotionConfig>;
}
