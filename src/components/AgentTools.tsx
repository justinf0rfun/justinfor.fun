"use client";

import { useEffect, useState } from "react";
import TumbleWall from "./react-bits/tumble-wall";
import { useSections } from "../data/uses";

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
];

export default function AgentTools() {
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    // Folder overlays lock the document while their full-screen stage is open.
    const update = () => setCovered(document.documentElement.style.overflow === "hidden");
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="agent-tools">
      <TumbleWall
        items={tools}
        count={tools.length}
        shape="square"
        size={46}
        sizeVariance={0.08}
        radius={12}
        fill={0.45}
        gravity={1}
        entrance="rain"
        shadow={0.15}
        hoverScale={1.08}
        frameColor="var(--agent-tool-surface)"
        textColor="var(--home-ink, #202221)"
        paused={covered}
        ariaLabel="Agent tools: Tern, Rex, Herdr, omp, Kero, Otty, Orca, Grok Bot and ChatGPT"
        style={{ height: "100%", minHeight: 0, color: "var(--home-ink, #202221)" }}
      />
    </div>
  );
}
