export const beliefs = [
  {
    id: "ideas", label: "Ideas into reality", src: "/home/acu-note.png",
    alt: "Everyone has ideas. Few have the discipline to turn them into reality.",
    width: 792, height: 856, backColor: "#e7dfca", tape: "",
    source: "Acu", href: "https://acu.sh/",
  },
  {
    id: "iterate", label: "First do it", src: "/home/first-do-it.jpg",
    alt: "First do it, then do it right, then do it better. Five colorful Dots characters sit beneath the words.",
    width: 1280, height: 720, backColor: "#18210f", tape: "#c8e497c7",
    source: "Addy Osmani", href: "https://addyo.substack.com/p/first-do-it-then-do-it-right-then",
  },
  {
    id: "value", label: "Make something people want", src: "/home/yc-make-something-people-want.jpg",
    alt: "Make something people want. Y Combinator's motto in orange-red letters on warm white paper.",
    width: 960, height: 1280, backColor: "#eee7d8", tape: "#eeaa76c7",
    source: "Rudy Adler", href: "https://medium.com/@rudyadler/make-something-people-want-the-yc-watsi-poster-55b35d0e8a89",
  },
  {
    id: "attention", label: "Attention Is All You Need", src: "/home/attention-is-all-you-need.jpg",
    alt: "Attention Is All You Need. The Transformer paper above a mountain concert landscape.",
    width: 1025, height: 1280, backColor: "#dce3f3", tape: "#aabce2c7",
    source: "Vaswani et al.", href: "https://arxiv.org/abs/1706.03762",
  },
  {
    id: "bitter", label: "The Bitter Lesson", src: "/home/the-bitter-lesson.svg",
    alt: "The Bitter Lesson. A typeset excerpt on general methods and computation, by Rich Sutton, 2019.",
    width: 720, height: 960, backColor: "#e5ddce", tape: "#d2c2a5c7",
    source: "Rich Sutton", href: "https://www.cs.utexas.edu/~eunsol/courses/data/bitter_lesson.pdf",
  },
];
export type Belief = typeof beliefs[number];
