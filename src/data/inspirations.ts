const article = "/thoughts/how-tanstack-start-became-my-default-framework";

export const inspirations = [
  {
    id: "laura-email", name: "Laura Beatris", author: "Laura Beatris", url: "https://laurabeatris.com/",
    relation: "Adapted from",
    note: "The email composer, keyboard controls, mobile sheet and envelope-to-paper-plane animation. This version is a local preview: no email is sent.",
    features: [{ label: "Email composer", selector: "[data-home-email-trigger]", page: "/" }],
  },
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
    note: "The sticker stack’s fan-out, flip and return motion, adapted from Card Stack. Wake Slider’s notch sound is recreated for Moments and article navigation; Finds uses the original Step sound recipe.",
    license: { label: "MIT · Source", url: "https://github.com/cabralorenzo/bencho/tree/main/blocks/card-stack" },
    features: [{ label: "Sticker stack", selector: "[data-sticker-deck]", page: "/" }, { label: "Finds sound", selector: ".finds-segments", page: "/x-threads" }],
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
  {
    id: "holo", name: "Holo", author: "yashb.xyz", url: "https://holo.yashb.xyz/",
    relation: "Adapted from · Assets from",
    note: "The floating foil pack, ragged tear, curling strip, card reveal and synthesized sounds. The full-screen five-card scene retains the original artwork and motion, with a separate offer link for each card.",
    features: [{ label: "Card pack", selector: "[data-ride-coupon]", page: "/" }],
  },
  {
    id: "bubble-navbar", name: "Bubble Navbar", author: "yashb.xyz", url: "https://bubblenavbar.yashb.xyz/",
    relation: "Adapted from",
    note: "The Dock’s glass hover bubble and white selection pill, adapted from the original two-layer spring navigation.",
    features: [{ label: "Dock bubbles", selector: ".home-dock .dock-controls", page: "/" }],
  },
  {
    id: "mantras", name: "Devouring Details · Mantras", author: "Devouring Details", url: "https://devouringdetails.com/mantras",
    relation: "Adapted from",
    note: "The Finds card index’s perspective, tightly spaced papers, outward selection and spring motion, adapted from the original implementation for a finite, connected collection. Its selected card carries the orange circle from Devouring Details’ homepage.",
    features: [{ label: "Finds cards", selector: "[data-finds-rail]", page: "/x-threads" }],
  },
  {
    id: "segmented-navigation", name: "Segmented Navigation", author: "Till Janek", url: "https://www.framer.com/marketplace/components/segmented-navigation/",
    relation: "Inspired by",
    note: "The compact black-and-white Finds control and graduated marks reference Segmented Navigation. Its continuous ruler, direct dragging and magnetic detents are implemented for this card index.",
    license: { label: "Limited Commercial License", url: "https://www.framer.com/legal/community-terms#7-ownership-license-grants" },
    features: [{ label: "Card index", selector: ".finds-segments", page: "/x-threads" }],
  },
];
