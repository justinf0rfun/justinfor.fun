import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import casings from "../lib/devin-bots/casings.json";
import type { CognitionBotView, BotOptions } from "../lib/devin-bots/vendor.js";
import type { devinBots } from "../data/devin-bots";
import "./DevinBot.css";

type Bot = typeof devinBots[number];
const appCasings: Record<string, { shape: { color: string }; icon: unknown }> = casings;
const readMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const subscribeToMotion = (notify: () => void) => {
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};

export default function DevinBot({ bot, paused }: { bot: Bot; paused: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const view = useRef<CognitionBotView | null>(null);
  const sync = useRef(() => {});
  const reduced = useSyncExternalStore(subscribeToMotion, readMotion, () => false);
  const state = useRef({ bot, paused, reduced: !!reduced });
  state.current = { bot, paused, reduced: !!reduced };
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = canvas.current!;
    let cancelled = false, loading = false, visible = false, frame = 0, previous = "";
    let runtime: typeof import("../lib/devin-bots/vendor.js") | undefined;
    const apply = () => {
      if (!view.current || !runtime) return;
      const { bot, paused, reduced } = state.current;
      const custom = appCasings[bot.shape];
      const options: BotOptions = {
        shape: custom?.shape ?? bot.shape,
        color: custom?.shape.color ?? runtime.getShape(bot.shape).color,
        icon: custom?.icon ?? null,
        iconLook: custom ? "tube" : "plain", iconGlow: .75, iconEdge: .35,
        zoom: custom ? 288 / 390 : 1,
        animate: visible && !paused && !document.hidden && !reduced,
        expression: "idle",
      };
      view.current.update(options);
      if (previous === bot.shape) return;
      previous = bot.shape; setReady(false); cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const check = () => {
          if (cancelled || !view.current) return;
          if (view.current.drawn && !view.current.pending) {
            element.dataset.renderer = view.current.renderer ?? "static";
            setReady(true);
          } else frame = requestAnimationFrame(check);
        };
        frame = requestAnimationFrame(check);
      });
    };
    sync.current = apply;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      apply();
      if (!visible || loading) return;
      loading = true;
      import("../lib/devin-bots/vendor.js").then(async module => {
        runtime = module; await module.loadWebGL2();
        if (cancelled) return;
        view.current = new module.CognitionBotView(element, {
          shape: "g01-octagon", material: "plastic", referenceColor: false,
          renderer: "webgl2", quality: 128, maxPixelRatio: 2,
          interactive: false, intro: false, poster: false,
        });
        apply();
      }).catch(error => { element.dataset.rendererError = String(error).slice(0, 300); });
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", apply);
    return () => {
      cancelled = true; cancelAnimationFrame(frame); observer.disconnect();
      document.removeEventListener("visibilitychange", apply);
      view.current?.dispose(); view.current = null; sync.current = () => {};
    };
  }, []);

  useEffect(() => { sync.current(); }, [bot, paused, reduced]);

  return <span className="devin-bot" data-tw-custom data-devin-bot={bot.shape} data-live={ready}
    onPointerEnter={() => { if (!state.current.reduced) view.current?.update({ expression: "happy" }); }}
    onPointerMove={event => {
      if (state.current.reduced) return;
      const rect = event.currentTarget.getBoundingClientRect();
      view.current?.lookAt([(event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1]);
    }}
    onPointerDown={() => { if (!state.current.reduced) view.current?.wink(); }}
    onPointerLeave={() => { view.current?.lookAt(null); view.current?.update({ expression: "idle" }); }}>
    <img src={bot.src} alt="" draggable={false} />
    <canvas ref={canvas} aria-hidden="true" />
  </span>;
}
