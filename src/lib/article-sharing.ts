export interface ArticleInfo {
  title: string;
  description: string;
  url: string;
}

export function articleShareTargets({ title, url }: ArticleInfo) {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);
  return [
    { label: "X", icon: "simple-icons:x", href: `https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` },
    { label: "LinkedIn", icon: "simple-icons:linkedin", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { label: "Bluesky", icon: "simple-icons:bluesky", href: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${title} ${url}`)}` },
    { label: "Email", icon: "ph:envelope", href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}` },
  ];
}

export function articleAiTargets(url: string) {
  const prompt = encodeURIComponent(`Read this article and help me apply it: ${url}`);
  return [
    {
      label: "Open in Claude", icon: "simple-icons:claude", href: `https://claude.ai/new?q=${prompt}`,
      appHref: `claude://claude.ai/new?q=${prompt}`, desktopOnly: true, webLabel: "Open Claude website",
    },
    {
      label: "Open in ChatGPT", icon: "simple-icons:openai", href: `https://chatgpt.com/?q=${prompt}`,
      appHref: `codex://threads/new?prompt=${prompt}`, desktopOnly: true, webLabel: "Open ChatGPT website",
    },
    {
      label: "Open in Grok Bot", icon: "/intro/grok.svg", href: `https://grok.com/?q=${prompt}&autoSubmit=false`,
      appHref: `grokbot://app/v1/prompt?text=${prompt}`, desktopOnly: false, webLabel: "Open Grok web chat (different from Grok Bot)",
    },
  ];
}

export function articleMarkdown({ title, description, url }: ArticleInfo, body: string) {
  return `# ${title}\n\n${description}\n\n${body.trim()}\n\n---\n\nSource: ${url}\n`;
}
