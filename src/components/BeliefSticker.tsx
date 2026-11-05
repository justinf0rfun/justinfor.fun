"use client";

import { lazy, Suspense, useState, useSyncExternalStore } from "react";

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
  const image = (
    <div className="belief-sticker-static">
      <img src={src} alt={alt} width={width} height={height} loading="lazy"
        style={{
          display: "block", width: "100%", height: "auto", aspectRatio: `${width} / ${height}`,
        }} />
    </div>
  );

  if (!animated) return image;

  return (
    <div data-peeling={peeling} style={{ position: "relative" }}>
      <Suspense fallback={image}>
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
