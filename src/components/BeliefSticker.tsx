"use client";

import { lazy, Suspense, useSyncExternalStore } from "react";

const ElasticSticker = lazy(() => import("./react-bits/elastic-sticker"));
const motionQuery = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
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
  const image = (
    <img src={src} alt={alt} width={width} height={height} loading="lazy"
      style={{ display: "block", width: "100%", height: "auto" }} />
  );

  if (!animated) return image;

  return (
    <Suspense fallback={image}>
      <ElasticSticker
        src={src} alt={alt} width={width} height={height}
        radius={0} border={0} backColor={backColor}
        finish="matte" sheen={0.08} shadow={0.15}
        hoverPeel={0.32} bend={0.35} elasticity={0.3}
        lift={0} tilt={0}
        draggable={false} idleHint={false} autoplay={false}
        style={{ display: "block", width: "100%" }}
      />
    </Suspense>
  );
}
