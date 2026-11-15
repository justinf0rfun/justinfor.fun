import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Belief } from "../data/beliefs";
import { paperTransform, stickerPose } from "../lib/belief-deck";
import { mountBeliefDeck } from "../scripts/belief-deck";
import BeliefSticker from "./BeliefSticker";
import "./BeliefDeck.css";

export default function BeliefDeck({ items }: { items: Belief[] }) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!root.current) return;
    const cleanup = mountBeliefDeck(root.current, setActive);
    setReady(true);
    return cleanup;
  }, []);
  const front = items[active];
  const size = (item: Belief) => ({ width: Math.min(276, 226 * item.width / item.height), height: Math.min(226, 276 * item.height / item.width) });
  return <section ref={root} className="belief-notes belief-deck" data-sticker-deck aria-label="Things I believe">
    <p id="belief-deck-help" className="sr-only">Swipe the middle of a sticker either way to draw the next one. Drag its lower right corner to peel. Use arrow keys to browse, or the previous and next buttons.</p>
    <div className="belief-stage" data-sticker-stage>
      {items.map((item, index) => <figure key={item.id} className="belief-card" data-sticker-card={index} data-sticker-label={item.label} data-front={active === index} data-taped={!!item.tape}
        role="group" tabIndex={active === index ? 0 : -1} aria-label={`${item.label}, ${index + 1} of ${items.length}`} aria-describedby="belief-deck-help"
        style={{ "--paper-ratio": item.width / item.height, "--tape-wash": item.tape, zIndex: items.length - index,
          transform: paperTransform(stickerPose(index, items.length, size(item), size(items[0]), 576, false)),
        } as CSSProperties}>
        <div className="belief-card-art" data-sticker-art>
          {active === index && ready ? <BeliefSticker {...item} reveal={false} /> :
            <button className="belief-pick" type="button" data-sticker-pick={index} tabIndex={-1} aria-label={`Show ${item.label}`}>
              <img src={item.src} alt={item.alt} width={item.width} height={item.height} loading="lazy" crossOrigin="anonymous" draggable={false} />
            </button>}
        </div>
        <figcaption className="belief-card-credit"><a href={item.href} target="_blank" rel="noopener noreferrer">{item.source}</a></figcaption>
      </figure>)}
    </div>
    <div className="belief-deck-footer">
      <button type="button" data-sticker-step="-1" aria-label="Previous sticker" disabled={!ready}><svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="m12 5-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
      <a className="belief-source" href={front.href} target="_blank" rel="noopener noreferrer">{front.source}<span aria-hidden="true">↗</span></a>
      <button type="button" data-sticker-step="1" aria-label="Next sticker" disabled={!ready}><svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="m8 5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
    </div>
    <span className="sr-only" data-sticker-status role="status" aria-live="polite"></span>
    <noscript><style>{`.belief-deck .belief-stage{display:grid;gap:32px;height:auto;padding:20px}.belief-deck .belief-card{position:relative;left:auto;top:auto;translate:none;transform:none!important;margin:auto}.belief-deck .belief-card-credit{display:block}.belief-deck .belief-deck-footer{display:none}`}</style></noscript>
  </section>;
}
