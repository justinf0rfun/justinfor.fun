export interface Moment {
  id: string;
  date: string;
  time: string;
  message: string;
  reaction?: "heart" | "check";
}

// Mock copy for review; replace with Justin's own posts when real content is ready.
export const previewMoments: Moment[] = [
  { id: "first-step", date: "11/10", time: "09:10", message: "想得太完整，反而迟迟不开始。先把最小的一步做出来。", reaction: "check" },
  { id: "bitter-lesson", date: "11/11", time: "12:30", message: "又读了一遍 The Bitter Lesson。提醒自己：别太早把经验写死。" },
  { id: "evening-light", date: "11/12", time: "18:05", message: "路过的时候抬了下头。想起相册里，还有一些没来得及整理的傍晚。", reaction: "heart" },
  { id: "small-motion", date: "11/13", time: "22:10", message: "把一个收起动画调顺了。只差几十毫秒，整个页面的感觉就不一样。", reaction: "check" },
  { id: "unfinished", date: "11/14", time: "21:40", message: "不是每个想法都得写成一篇文章。给这些零零碎碎的念头，也留一点位置。", reaction: "heart" },
];

export const momentCharacters = [
  { name: "O", color: "#bac1d3", image: "o.svg" },
  { name: "Alfred", color: "#ffd529", image: "alfred.webp" },
  { name: "Felipe", color: "#35a0fd", image: "felipe.webp" },
  { name: "Iggy", color: "#da61dc", image: "iggy.webp" },
  { name: "Todd", color: "#b5ea4e", image: "todd.webp" },
] as const;
