export interface UseItem {
  name: string;
  slogan: string;
  logo: string;
  href: string;
  animatedLogo?: "grok-bot";
  badge?: string;
  featured?: boolean;
  visualTreatment?: "banner";
}

export interface UseGroup {
  title?: string;
  items: UseItem[];
}

export interface UseSection {
  title: string;
  groups: UseGroup[];
}

export interface HardwareUse {
  name: string;
  image: string;
  visualTreatment?: "zoomed";
}

export const useSections: UseSection[] = [
  {
    title: "AI",
    groups: [
      {
        title: "Products",
        items: [
          {
            name: "Grok Bot",
            slogan: "AI teammates you can give real work to.",
            logo: "/uses/ai/grok-bot.svg",
            href: "https://x.ai/bot",
            animatedLogo: "grok-bot",
          },
          {
            name: "ChatGPT",
            slogan: "Helps you think, write, and solve problems.",
            logo: "/uses/software/chatgpt.png",
            href: "https://chatgpt.com/",
            featured: true,
          },
          {
            name: "Claude Code",
            slogan: "If you can describe it, you can build it.",
            logo: "/uses/software/claude-code.png",
            href: "https://www.anthropic.com/product/claude-code",
            featured: true,
          },
          {
            name: "Raft",
            slogan: "Where humans and AI agents build together.",
            logo: "/uses/ai/raft.png",
            href: "https://raft.build/",
          },
        ],
      },
      {
        title: "Trying Now",
        items: [
          {
            name: "Avec",
            slogan: "The best way to write emails.",
            logo: "/uses/ai/avec.png",
            href: "https://www.avec.ai/",
          },
        ],
      },
      {
        title: "Agent Infrastructure",
        items: [
          {
            name: "Herdr",
            slogan: "Run them anywhere. Leave them running.",
            logo: "/uses/ai/herdr.png",
            href: "https://herdr.dev/",
          },
          {
            name: "Orca",
            slogan: "Ship 100x with the Agent IDE.",
            logo: "/uses/ai/orca.png",
            href: "https://www.onorca.dev/",
          },
          {
            name: "ChatCut",
            slogan: "Your AI Video Editing Assistant.",
            logo: "/uses/ai/chatcut.svg",
            href: "https://chatcut.io/",
          },
          {
            name: "brainless",
            slogan: "Claude Code, Codex, and Grok interfaces as shadcn components.",
            logo: "/uses/ai/brainless.png",
            href: "https://brainless.swerdlow.dev/",
          },
        ],
      },
      {
        title: "Skills",
        items: [
          {
            name: "Skills for Real Engineers",
            slogan: "Small, composable skills for real engineering.",
            logo: "/uses/ai/matt-pocock-skills.png",
            href: "https://www.aihero.dev/skills",
            badge: "Featured",
            visualTreatment: "banner",
          },
          {
            name: "Taste Skill",
            slogan: "The Anti-Slop Frontend Framework for AI Agents.",
            logo: "/uses/ai/taste-skill.jpg",
            href: "https://www.tasteskill.dev/",
            visualTreatment: "banner",
          },
          {
            name: "Jakub’s Skills",
            slogan: "Accessibility, layout, writing, typography, color, and UI polish.",
            logo: "/uses/ai/jakub-skills.png",
            href: "https://jakub.kr/skills",
            visualTreatment: "banner",
          },
        ],
      },
    ],
  },
  {
    title: "Software",
    groups: [
      {
        items: [
          {
            name: "Dia",
            slogan: "A browser you won’t dread opening.",
            logo: "/uses/software/dia.png",
            href: "https://www.diabrowser.com/",
            featured: true,
          },
          {
            name: "Raycast",
            slogan: "Your shortcut to everything.",
            logo: "/uses/software/raycast.png",
            href: "https://www.raycast.com/",
            featured: true,
          },
          {
            name: "Warp",
            slogan: "The best place to build with agents.",
            logo: "/uses/software/warp.png",
            href: "https://www.warp.dev/terminal",
          },
          {
            name: "Otty",
            slogan: "A native, beautiful terminal app.",
            logo: "/uses/software/otty.png",
            href: "https://otty.sh/",
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
        ],
      },
    ],
  },
  {
    title: "Archived",
    groups: [
      {
        items: [
          {
            name: "Amie Calendar",
            slogan: "A joyful calendar for events, tasks, and email.",
            logo: "/uses/archived/amie.jpg",
            href: "https://amie.so/",
          },
          {
            name: "Arc Browser",
            slogan: "A browser built around spaces and vertical tabs.",
            logo: "/uses/archived/arc.png",
            href: "https://arc.net/",
          },
          {
            name: "HEY Email",
            slogan: "Email with screening, focused views, and fewer interruptions.",
            logo: "/uses/archived/hey.png",
            href: "https://www.hey.com/",
          },
          {
            name: "Things 3",
            slogan: "A calm personal task manager for Apple devices.",
            logo: "/uses/archived/things-3.png",
            href: "https://culturedcode.com/things/",
          },
        ],
      },
    ],
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
  {
    name: "Skylrk MagSafe Power Bank",
    image: "/uses/hardware/skylrk-power-bank.jpg",
  },
  {
    name: "iPod classic",
    image: "/uses/hardware/ipod-classic.jpg",
  },
];

export const folderPreviewUses = useSections
  .flatMap((section) => section.groups.flatMap((group) => group.items))
  .filter((item) => item.featured);
