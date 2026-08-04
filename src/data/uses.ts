export interface SoftwareUse {
  name: string;
  slogan: string;
  logo: string;
  href: string;
}

export interface HardwareUse {
  name: string;
  image: string;
  visualTreatment?: "zoomed";
}

export const softwareUses: SoftwareUse[] = [
  {
    name: "ChatGPT",
    slogan: "Helps you think, write, and solve problems.",
    logo: "/uses/software/chatgpt.webp",
    href: "https://chatgpt.com/",
  },
  {
    name: "Claude Code",
    slogan: "If you can describe it, you can build it.",
    logo: "/uses/software/claude-code.png",
    href: "https://www.anthropic.com/product/claude-code",
  },
  {
    name: "Dia",
    slogan: "A browser you won’t dread opening.",
    logo: "/uses/software/dia.png",
    href: "https://www.diabrowser.com/",
  },
  {
    name: "Raycast",
    slogan: "Your shortcut to everything.",
    logo: "/uses/software/raycast.png",
    href: "https://www.raycast.com/",
  },
  {
    name: "Warp",
    slogan: "The agentic development environment.",
    logo: "/uses/software/warp.png",
    href: "https://www.warp.dev/terminal",
  },
  {
    name: "Zed",
    slogan: "Code at the speed of thought.",
    logo: "/uses/software/zed.png",
    href: "https://zed.dev/",
  },
  {
    name: "Obsidian",
    slogan: "Sharpen your thinking.",
    logo: "/uses/software/obsidian.png",
    href: "https://obsidian.md/",
  },
  {
    name: "iA Writer",
    slogan: "Just write it.",
    logo: "/uses/software/ia-writer.png",
    href: "https://ia.net/writer",
  },
  {
    name: "Spatial",
    slogan: "Visually organize what you see, think and want to remember.",
    logo: "/uses/software/spatial.png",
    href: "https://www.get-spatial.com/",
  },
];

export const hardwareUses: HardwareUse[] = [
  {
    name: "MacBook Pro M1 Max",
    image: "/uses/hardware/macbook-pro-m1-max.png",
  },
  {
    name: "iPhone 17 Pro Max",
    image: "/uses/hardware/iphone-17-pro-max.png",
  },
  {
    name: "Apple Watch Ultra 1",
    image: "/uses/hardware/apple-watch-ultra.png",
  },
  {
    name: "AirPods Pro 2",
    image: "/uses/hardware/airpods-pro-2.png",
  },
  {
    name: "Studio Display",
    image: "/uses/hardware/studio-display.jpg",
    visualTreatment: "zoomed",
  },
  {
    name: "HHKB Professional BT",
    image: "/uses/hardware/hhkb-professional-bt.png",
  },
];

export const folderPreviewUses = softwareUses.slice(0, 6);
