"use client";

import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { together } from "skullet";
import { Skeleton, SkulletProvider } from "skullet/react";

const ElasticSticker = lazy(() => import("./react-bits/elastic-sticker"));
const motionQuery = "(prefers-reduced-motion: no-preference)";
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
const canAnimate = () => window.matchMedia(motionQuery).matches;

interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
  backColor: string;
}

export default function BeliefSticker({ src, alt, width, height, backColor }: Props) {
  const animated = useSyncExternalStore(subscribe, canAnimate, () => false);
  const [peeling, setPeeling] = useState(false);
  const [phase, setPhase] = useState<"loading" | "revealing" | "ready" | "error">("loading");
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let cancelled = false;
    let revealTimer: number | undefined;
    const enteredAt = performance.now();
    const displayed = imageRef.current;
    const cached = !!(displayed?.complete && displayed.naturalWidth);
    const loader = cached ? displayed! : new Image();
    const finish = async () => {
      loader.onload = loader.onerror = null;
      await loader.decode().catch(() => {});
      if (!cancelled) {
        if (!loader.naturalWidth) {
          setPhase("error");
          return;
        }
        // This is a once-per-visit entrance, including when the image is cached.
        const remaining = canAnimate() ? Math.max(0, 550 - (performance.now() - enteredAt)) : 0;
        revealTimer = window.setTimeout(() => setPhase("revealing"), remaining);
      }
    };
    if (cached) {
      void finish();
    } else {
      setPhase("loading");
      loader.onload = finish;
      loader.onerror = () => { if (!cancelled) setPhase("error"); };
      loader.crossOrigin = "anonymous";
      loader.src = src;
      if (loader.complete) void finish();
    }
    return () => {
      cancelled = true;
      window.clearTimeout(revealTimer);
      loader.onload = loader.onerror = null;
    };
  }, [src]);

  const image = (
    <div className="belief-sticker-static">
      <img ref={imageRef} src={src} alt={alt} width={width} height={height} loading="lazy" crossOrigin="anonymous"
        style={{
          display: "block", width: "100%", height: "auto", aspectRatio: `${width} / ${height}`,
        }} />
    </div>
  );
  const preview = (
    <div style={{ position: "relative", aspectRatio: `${width} / ${height}` }}>
      <SkulletProvider reveal={{ ...together, duration: 320 }} theme={{ animation: "group-shimmer", speed: "fast" }}>
        <Skeleton
          id={`belief-poster:${src}`}
          data={src}
          className="belief-sticker-reveal"
          loading={phase === "loading"}
          label={`Loading poster: ${alt}`}
          style={{ position: "absolute", inset: 0 }}
          onReveal={() => setPhase((current) => current === "revealing" ? "ready" : current)}
        >
          {() => image}
        </Skeleton>
      </SkulletProvider>
      <noscript>
        <style>{".belief-sticker-reveal{display:none!important}"}</style>
        <div className="belief-sticker-static">
          <img src={src} alt={alt} width={width} height={height} loading="lazy" crossOrigin="anonymous"
            style={{ display: "block", width: "100%", height: "auto" }} />
        </div>
      </noscript>
    </div>
  );

  // Only the image is measured; mount the interactive canvas after its reveal finishes.
  if (!animated || phase !== "ready") return preview;

  return (
    <div data-peeling={peeling} style={{ position: "relative" }}>
      <Suspense fallback={preview}>
        <ElasticSticker
          src={src} alt={alt} width={width} height={height}
          radius={0} border={0} backColor={backColor}
          finish="matte" sheen={0.08} shadow={0.25}
          hoverPeel={0.32} bend={0.65} elasticity={0.45}
          lift={65} tilt={22}
          draggable bounds="parent" snapBack idleHint={false} autoplay={false}
          raiseOnDrag={false}
          onDragStart={() => setPeeling(true)}
          onDragEnd={() => setPeeling(false)}
          style={{ display: "block", width: "100%", touchAction: "pan-y pinch-zoom" }}
        />
      </Suspense>
    </div>
  );
}
