"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import TumbleWall, { type TumbleWallHandle } from "./react-bits/tumble-wall";
import { useSections } from "../data/uses";
import { createMobileGravity, type Gravity, type MotionState } from "../lib/mobile-gravity";

const MotionPermission = lazy(() => import("./MotionPermission"));

const existingTools = useSections.flatMap((section) => section.groups.flatMap((group) => group.items));
const tools = [
  { title: "Tern", src: existingTools.find((item) => item.name === "Tern")!.logo, href: "https://stencil.so/tern" },
  { title: "Rex", src: "/uses/ai/rex.png", href: "https://www.superlogical.com/rex/docs/installation" },
  { title: "Herdr", src: existingTools.find((item) => item.name === "Herdr")!.logo, href: "https://herdr.dev/" },
  { title: "omp", src: "/uses/ai/omp.svg", href: "https://omp.sh/" },
  { title: "Kero", src: "/uses/ai/kero.png", href: "https://kero.sh/" },
  { title: "Otty", src: existingTools.find((item) => item.name === "Otty")!.logo, href: "https://otty.sh/" },
  { title: "Orca", src: existingTools.find((item) => item.name === "Orca")!.logo, href: "https://www.onorca.dev/" },
  { title: "Grok Bot", src: existingTools.find((item) => item.name === "Grok Bot")!.logo, href: "https://x.ai/bot" },
  { title: "ChatGPT", src: "/uses/ai/codex.png", href: "https://chatgpt.com/" },
  { title: "Claude", src: existingTools.find((item) => item.name === "Claude Code")!.logo, href: "https://claude.ai/" },
  { title: "Dots · Felipe", src: "/uses/ai/dots-felipe.webp", href: "https://chatgpt.com/features/dots/" },
  { title: "Dots · Todd", src: "/uses/ai/dots-todd.webp", href: "https://chatgpt.com/features/dots/" },
  { title: "Dots · Alfred", src: "/uses/ai/dots-alfred.webp", href: "https://chatgpt.com/features/dots/" },
  { title: "Dots · Iggy", src: "/uses/ai/dots-iggy.webp", href: "https://chatgpt.com/features/dots/" },
];

export default function AgentTools() {
  const [covered, setCovered] = useState(false);
  const [gravity, setGravity] = useState<Gravity>({ x: 0, y: 1 });
  const [motionState, setMotionState] = useState<MotionState>("checking");
  const [hasPrompt, setHasPrompt] = useState(false);
  const [landed, setLanded] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);
  const wallRef = useRef<TumbleWallHandle>(null);
  const coveredRef = useRef(false);
  const landedRef = useRef(false);
  const requestedRef = useRef(false);
  const motionRef = useRef<ReturnType<typeof createMobileGravity> | null>(null);

  useEffect(() => {
    // Folder overlays lock the document while their full-screen stage is open.
    const update = () => {
      coveredRef.current = document.documentElement.style.overflow === "hidden";
      setCovered(coveredRef.current);
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    const motion = regionRef.current
      ? createMobileGravity(regionRef.current, {
          onGravity: setGravity,
          onShake: (strength) => wallRef.current?.shake(strength),
          onState: (state) => {
            setMotionState(state);
            if (state === "prompt") setHasPrompt(true);
            if (state === "active" && requestedRef.current) {
              requestedRef.current = false;
              if (!coveredRef.current && !document.hidden) wallRef.current?.shake(0.35);
            }
          },
          isPaused: () => {
            // Remember the first landing so sensor motion does not pause itself.
            landedRef.current ||= wallRef.current?.isSettled() ?? false;
            return coveredRef.current || !landedRef.current;
          },
        })
      : null;
    motionRef.current = motion;
    return () => {
      observer.disconnect();
      motion?.destroy();
      motionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!hasPrompt || landed || covered) return;
    let frame = 0;
    const checkLanding = () => {
      if (landedRef.current || wallRef.current?.isSettled()) {
        landedRef.current = true;
        setLanded(true);
      } else frame = requestAnimationFrame(checkLanding);
    };
    frame = requestAnimationFrame(checkLanding);
    return () => cancelAnimationFrame(frame);
  }, [hasPrompt, landed, covered]);

  return (
    <div className="agent-tools" ref={regionRef}>
      <div className="agent-tools-stage">
        <TumbleWall
          ref={wallRef}
          items={tools}
          count={tools.length}
          shape="square"
          size={46}
          sizeVariance={0.08}
          radius={12}
          fill={0.45}
          gravity={gravity.y}
          gravityX={gravity.x}
          entrance="rain"
          shadow={0.15}
          hoverScale={1.08}
          frameColor="var(--agent-tool-surface)"
          textColor="var(--home-ink, #202221)"
          paused={covered}
          ariaLabel={`Agent tools: ${tools.map((tool) => tool.title).join(", ")}`}
          style={{ height: "100%", minHeight: 0, color: "var(--home-ink, #202221)" }}
        />
      </div>
      {hasPrompt && (
        <Suspense fallback={<div style={{ height: 76 }} aria-hidden="true" />}>
          <MotionPermission
            state={motionState}
            ready={landed}
            onRequest={() => {
              requestedRef.current = true;
              void motionRef.current?.requestAccess();
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
