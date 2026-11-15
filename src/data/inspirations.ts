const article = "/thoughts/how-tanstack-start-became-my-default-framework";

export const inspirations = [
  {
    id: "noe", name: "Noé Chagué", author: "Design Engineer", url: "https://noechague.com/",
    relation: "Adapted from",
    note: "The expanding New pill, article navigation, and the Share and Ask AI interactions.",
    features: [
      { label: "New pill", selector: "[data-home-news]", page: "/" },
      { label: "Article navigation", selector: "[data-article-toc], [data-reading-toggle], [data-article-actions]", page: article },
    ],
  },
  {
    id: "ehsan", name: "Ehsan Designs", author: "Ehsan Masoomi", url: "https://ehsandesigns.com/index.html",
    relation: "Inspired by",
    note: "Spatial page transitions and soft clicks for back navigation and theme changes. The sound is synthesized on this site.",
    features: [
      { label: "Theme switcher", selector: "[data-theme-dial]", page: "/" },
      { label: "Back navigation", selector: "[data-parent-navigation]", page: "/thoughts" },
    ],
  },
  {
    id: "dots", name: "OpenAI · Dots", author: "OpenAI", url: "https://chatgpt.com/features/dots/",
    relation: "Adapted from · Assets from",
    note: "Moments characters, idle motion and timeline, plus the mobile reading bar’s entrance and material. Character models and textures come from the original site.",
    features: [
      { label: "Moments characters", selector: "[data-home-moments-trigger]", page: "/" },
      { label: "Mobile reading bar", selector: "[data-reading-capsule]", page: article, phoneOnly: true },
    ],
  },
  {
    id: "bencho", name: "Bencho", author: "Lorenzo Cabra", url: "https://bencho.dev/?c=card-stack&theme=light",
    relation: "Adapted from",
    note: "The sticker stack’s fan-out, flip and return motion, adapted from Card Stack. Wake Slider’s notch sound is recreated for Moments and article navigation.",
    license: { label: "MIT · Source", url: "https://github.com/cabralorenzo/bencho/tree/main/blocks/card-stack" },
    features: [{ label: "Sticker stack", selector: "[data-sticker-deck]", page: "/" }],
  },
  {
    id: "skullet", name: "Skullet", author: "Lochie Axon", url: "https://github.com/lochie/skullet",
    relation: "Adapted from",
    note: "The Say hi conversation, X profile hover card, and loading reveal effects.",
    license: { label: "MIT · Source", url: "https://github.com/lochie/skullet/tree/main/site/src/demos" },
    features: [
      { label: "Say hi", selector: "[data-home-chat-trigger]", page: "/" },
      { label: "X profile card", selector: ".intro-x-profile", page: "/" },
    ],
  },
  {
    id: "refero", name: "Refero", author: "Design references", url: "https://refero.design/styles",
    relation: "Inspired by",
    note: "The chat panel’s entrance: a narrow strip stretching into an open conversation.",
    features: [{ label: "Chat entry", selector: "[data-home-chat-trigger]", page: "/" }],
  },
  {
    id: "reactbits", name: "React Bits Pro", author: "Animated components", url: "https://pro.reactbits.dev/",
    relation: "Adapted from",
    note: "Physics-driven tool icons, sticker peeling and device interactions, built with adapted components.",
    features: [
      { label: "Tool icons", selector: ".agent-tools-slot", page: "/" },
      { label: "Sticker peel", selector: "[data-sticker-deck]", page: "/" },
    ],
  },
];
