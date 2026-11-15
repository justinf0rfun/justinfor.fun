import { xBookmarks } from "./x-bookmarks";

// Editorial titles and topical links; the author's snapshot and Justin's take stay separate.
const index = [
  { id: "2089996330861224324", number: "001", title: "Start with the hard thing", topics: ["learning"], links: [{ id: "2088302050706686198", reason: "Two perspectives on learning technical skills." }] },
  { id: "2088951405155426757", number: "002", title: "Build context-efficient tools", topics: ["engineering"], links: [{ id: "2088302050706686198", reason: "AI engineering, from practical tools to a broader skills map." }] },
  { id: "2088302050706686198", number: "003", title: "A map of AI engineering", topics: ["engineering", "learning"], links: [{ id: "2088951405155426757", reason: "A closer look at the tools used in engineering." }, { id: "2089996330861224324", reason: "A different approach to acquiring technical skills." }] },
  { id: "2087427868343373919", number: "004", title: "A saved post by Addy Osmani", topics: ["inbox"], links: [] },
];

const savedFinds = xBookmarks.map(source => ({ ...source, mock: false, ...(index.find(note => note.id === source.id) ?? {
  number: source.id, title: `Saved from @${source.snapshot.authorHandle}`, topics: ["inbox"], links: [],
}) }));

const samples = [
  { id: "sample-feedback", title: "Shorten the feedback loop", topic: "learning", text: "Try a small version before explaining the whole idea. A working experiment gives the next question somewhere concrete to begin.", related: "sample-prototype", reason: "A prototype is one way to make a feedback loop tangible." },
  { id: "sample-questions", title: "Keep the question with the answer", topic: "learning", text: "A useful note remembers the question that made the answer interesting. Without it, even a good explanation can be difficult to use again.", related: "sample-context", reason: "Both notes explore what makes information useful in context." },
  { id: "sample-explain", title: "Explain it without the diagram", topic: "learning", text: "Put the diagram aside and explain the idea in a few sentences. The point where the explanation becomes vague is a useful place to investigate next.", related: "sample-interfaces", reason: "An explanation and an interface both need a legible structure." },
  { id: "sample-revisit", title: "Leave room to change your mind", topic: "learning", text: "Keep a note small enough to revise. An observation can be useful before it becomes a rule; recording the uncertainty makes returning to it more interesting.", related: "sample-unfinished", reason: "Unfinished ideas can remain useful without becoming conclusions." },
  { id: "sample-prototype", title: "A prototype is a question", topic: "engineering", text: "Build the smallest thing that answers one question. Give the experiment a clear stopping point, then keep the answer even if the implementation is thrown away.", related: "sample-feedback", reason: "Small experiments make it easier to get useful feedback." },
  { id: "sample-context", title: "Context belongs beside the work", topic: "engineering", text: "Keep decisions close to the code or interface they explain. A short reason at the right location can outlast a long conversation in another tool.", related: "sample-questions", reason: "Preserving the original question keeps a decision understandable." },
  { id: "sample-interfaces", title: "Make the next action obvious", topic: "engineering", text: "Before adding another control, ask what the person should understand after the current action. A clear response often removes the need for another instruction.", related: "sample-explain", reason: "Clear explanations and clear actions share the same need for structure." },
  { id: "sample-boundaries", title: "Good boundaries make room for change", topic: "engineering", text: "Let one part change without asking every other part to move with it. A useful boundary hides a decision that is likely to be reconsidered.", related: "sample-revisit", reason: "Both make revision a normal part of the process." },
  { id: "sample-unfinished", title: "An unfinished thought can stay", topic: "inbox", text: "What would a collection look like if it preserved questions as carefully as answers? Leave this one open and see which other cards begin to connect to it.", related: "sample-revisit", reason: "A provisional note leaves room for a different interpretation later." },
  { id: "sample-friction", title: "Notice the second of hesitation", topic: "inbox", text: "The interesting part of an interaction may be the pause before a click. What information is missing at that moment, and could the interface make it visible?", related: "sample-interfaces", reason: "Both ask what makes the next action understandable." },
  { id: "sample-return", title: "What makes something worth revisiting?", topic: "inbox", text: "A saved link can be a reference, a disagreement, or the beginning of a new question. What small detail would help explain why it was kept?", related: "sample-questions", reason: "The question behind a saved item helps explain its value." },
  { id: "sample-connections", title: "A connection needs a reason", topic: "inbox", text: "Two notes can share a topic without saying the same thing. Write down whether one supports, challenges, or gives a practical example of the other.", related: "sample-context", reason: "The reason for a connection is useful context in its own right." },
];

export const finds = [...savedFinds, ...samples.map((sample, i) => ({
  id: sample.id, number: String(i + 5).padStart(3, "0"), title: sample.title, topics: [sample.topic],
  links: [{ id: sample.related, reason: sample.reason }], mock: true, url: "", savedAt: "", thought: "",
  snapshot: { authorName: "", authorHandle: "", authorUrl: "", avatarUrl: "", publishedAt: "", text: sample.text },
}))];
export const findDrawers = [
  { id: "all", label: "All finds" },
  { id: "learning", label: "Learning" },
  { id: "engineering", label: "Engineering" },
  { id: "inbox", label: "Unfiled" },
];
export type Find = typeof finds[number];
export const inDrawer = (note: Find, drawer: string) => drawer === "all" || note.topics.includes(drawer);
