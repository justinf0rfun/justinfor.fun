"use client";

import { useEffect, useRef, useState } from "react";
import TumbleWall, { type TumbleWallHandle } from "./react-bits/tumble-wall";
import { useSections } from "../data/uses";
import { createMobileGravity, type Gravity, type MotionStatus } from "../lib/mobile-gravity";

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
];

export default function AgentTools() {
  const [covered, setCovered] = useState(false);
  const [gravity, setGravity] = useState<Gravity>({ x: 0, y: 1 });
  const [motionStatus, setMotionStatus] = useState<MotionStatus>("unavailable");
  const regionRef = useRef<HTMLDivElement>(null);
  const wallRef = useRef<TumbleWallHandle>(null);
  const coveredRef = useRef(false);
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
    if (regionRef.current) {
      motionRef.current = createMobileGravity(regionRef.current, {
        onGravity: setGravity,
        onShake: (strength) => wallRef.current?.shake(strength),
        onStatus: setMotionStatus,
        isPaused: () => coveredRef.current,
      });
    }
    return () => {
      observer.disconnect();
      motionRef.current?.destroy();
      motionRef.current = null;
    };
  }, []);

  return (
    <div className="agent-tools" ref={regionRef}>
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
        ariaLabel="Agent tools: Tern, Rex, Herdr, omp, Kero, Otty, Orca, Grok Bot, ChatGPT and Claude"
        style={{ height: "100%", minHeight: 0, color: "var(--home-ink, #202221)" }}
      />
      {(motionStatus === "ready" || motionStatus === "requesting") && (
        <button
          type="button"
          className="agent-tools-motion"
          disabled={motionStatus === "requesting"}
          aria-label="Enable tilt and shake for these icons"
          aria-busy={motionStatus === "requesting"}
          onClick={() => void motionRef.current?.enable()}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="7" y="3" width="10" height="18" rx="2" transform="rotate(-15 12 12)" />
            <path d="M3 8 1 12l2 4M21 8l2 4-2 4" />
          </svg>
          {motionStatus === "requesting" ? "Enabling…" : "Tilt & shake"}
        </button>
      )}
      {motionStatus === "denied" && (
        <span className="agent-tools-motion" role="status">Motion access is off</span>
      )}
    </div>
  );
}
