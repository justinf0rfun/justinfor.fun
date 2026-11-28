export const projects = [
  {
    name: "Huoban",
    status: "Open Protocol · Alpha",
    description:
      "An open orchestration protocol for AI systems, built around work that can be verified, composed, and reviewed.",
    facts: [
      "Ten top-level objects describe capability, context, orchestration, execution, governance, and trust.",
      "CLI workflows validate, explain, derive, print, import, and export protocol objects.",
      "Released as v0.1.0-alpha.0, with runtime execution still on the roadmap.",
    ],
    href: "https://huoban.dev/",
    image: "/projects/huoban-cover.png",
    alt: "Huoban protocol documentation cover",
    accent: "huoban",
    preview: { w: 38, top: 8 },
  },
  {
    name: "GSON — JSON Workbench",
    status: "Developer Tool · Live",
    description:
      "Structured workflows for messy data: format, transform, diff, query, and repair JSON from one local-first workbench.",
    facts: [
      "Format and repair mixed or malformed JSON without leaving the browser.",
      "Review structural diffs, annotate results, and share read-only snapshots.",
      "Turn a result into a temporary API endpoint for debugging and handoff.",
    ],
    href: "https://gson.ing/",
    image: "/projects/gson-cover.png",
    alt: "GSON JSON Workbench product interface",
    accent: "gson",
    preview: { w: 42, top: 4 },
  },
];

export const projectsSummary = `${projects.length} shipped ${projects.length === 1 ? "project" : "projects"}`;
