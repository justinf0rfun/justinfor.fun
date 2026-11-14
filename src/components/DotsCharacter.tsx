import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { momentCharacters } from "../data/moments";
import type { CharacterViewState } from "../lib/dots/renderer";
import type { CharacterSurface } from "../lib/dots/dock-motion";
import "./DotsCharacter.css";

interface Props { character: number; facing?: number; animateSelection?: boolean; surface?: CharacterSurface; response?: number }

export default function DotsCharacter({ character, facing = 0, animateSelection = true, surface = "stage", response = 0 }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();
  const role = momentCharacters[character];
  const state = useRef<CharacterViewState>({ name: role.name, facing, reduced: !!reduced, animateSelection, surface, response });
  state.current = { name: role.name, facing, reduced: !!reduced, animateSelection, surface, response };
  useEffect(() => {
    setReady(false);
    const element = canvas.current!;
    let cleanup: (() => void) | undefined, cancelled = false, loading = false;
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting || loading) return;
      loading = true;
      import("../lib/dots/renderer").then(({ createCharacterRenderer }) => {
        if (!cancelled) cleanup = createCharacterRenderer(element, () => state.current, value => { if (!cancelled) setReady(value); });
      }).catch(error => { element.dataset.rendererError = String(error).slice(0, 300); });
    }, { rootMargin: "120px" });
    observer.observe(element);
    return () => { cancelled = true; observer.disconnect(); cleanup?.(); };
  }, []);
  return <span className="dots-character" data-renderer={ready ? "webgl" : "poster"} data-character={role.name} data-surface={surface}>
    <img src={`/moments-reference/${role.image}`} alt="" width="164" height="164" draggable={false} style={{ opacity: ready ? 0 : 1 }} />
    <canvas ref={canvas} aria-hidden="true" style={{ opacity: ready ? 1 : 0 }} />
  </span>;
}
