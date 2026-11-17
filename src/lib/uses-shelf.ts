import { folderPreviewUses, hardwareUses, useSections } from "../data/uses";

export const usesCategories = ["All", "AI", "Software", "Hardware", "Archived"];

export interface ShelfItem {
  id: string;
  name: string;
  category: string;
  group: string;
  image: string;
  width: number;
  height: number;
  size: number;
  bounds?: readonly [number, number, number, number];
  preview: number;
  href?: string;
  slogan?: string;
  badge?: string;
  animatedLogo?: "grok-bot";
  visualTreatment?: "banner" | "zoomed";
}

const software: ShelfItem[] = useSections.flatMap(section => section.groups.flatMap(group => group.items.map(item => ({
  id: `${section.title}:${item.name}`,
  name: item.name,
  category: section.title,
  group: group.title ?? section.title,
  image: item.logo,
  width: item.visualTreatment === "banner" ? 512 : 128,
  height: item.visualTreatment === "banner" ? 269 : 128,
  size: item.visualTreatment === "banner" ? 108 : item.featured ? 132 : 112,
  preview: folderPreviewUses.indexOf(item),
  href: item.href,
  slogan: item.slogan,
  badge: item.badge,
  animatedLogo: item.animatedLogo,
  visualTreatment: item.visualTreatment,
}))));

export const usesShelfItems: ShelfItem[] = [
  ...software.filter(item => item.preview >= 0),
  ...software.filter(item => item.preview < 0),
  ...hardwareUses.map(item => ({ ...item, id: `Hardware:${item.name}`, category: "Hardware", group: "Hardware", preview: -1 })),
];

// ThingsShelf's alternating long/short rows, recalculated after filtering.
export function shelfInset(index: number, columns: number) {
  const position = index % (2 * columns - 1);
  return position === columns ? "start" : position === 2 * columns - 2 ? "end" : undefined;
}

export function shelfTilt(x: number, y: number) {
  return { rx: `${(-10 * y).toFixed(2)}deg`, ry: `${(14 * x).toFixed(2)}deg`, sx: `${(-10 * x).toFixed(1)}px` };
}
