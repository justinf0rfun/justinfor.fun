export interface SoftwareUse {
  name: string;
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
    logo: "/uses/software/chatgpt.webp",
    href: "https://chatgpt.com/",
  },
  {
    name: "Claude Code",
    logo: "/uses/software/claude-code.png",
    href: "https://www.anthropic.com/product/claude-code",
  },
  {
    name: "Dia",
    logo: "/uses/software/dia.png",
    href: "https://www.diabrowser.com/",
  },
  {
    name: "Raycast",
    logo: "/uses/software/raycast.png",
    href: "https://www.raycast.com/",
  },
  {
    name: "Warp",
    logo: "/uses/software/warp.png",
    href: "https://www.warp.dev/terminal",
  },
  {
    name: "Zed",
    logo: "/uses/software/zed.png",
    href: "https://zed.dev/",
  },
  {
    name: "Obsidian",
    logo: "/uses/software/obsidian.png",
    href: "https://obsidian.md/",
  },
  {
    name: "iA Writer",
    logo: "/uses/software/ia-writer.png",
    href: "https://ia.net/writer",
  },
  {
    name: "Spatial",
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
