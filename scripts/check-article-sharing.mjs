import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { articleAiTargets, articleMarkdown, articleShareTargets } from "../src/lib/article-sharing.ts";

const article = {
  title: "Ideas & AI / 想法?",
  description: "A description, not the whole article.",
  url: "https://justinfor.fun/thoughts/ideas-and-ai",
};

test("share and AI destinations preserve the article title and canonical URL", () => {
  const [x, linkedIn, bluesky, email] = articleShareTargets(article);
  assert.equal(new URL(x.href).searchParams.get("text"), article.title);
  assert.equal(new URL(x.href).searchParams.get("url"), article.url);
  assert.equal(new URL(linkedIn.href).searchParams.get("url"), article.url);
  assert.equal(new URL(bluesky.href).searchParams.get("text"), `${article.title} ${article.url}`);
  assert.equal(new URL(email.href).searchParams.get("subject"), article.title);
  assert.equal(new URL(email.href).searchParams.get("body"), article.url);
  const aiTargets = articleAiTargets(article.url);
  assert.equal(aiTargets.length, 3);
  for (const [index, destination] of aiTargets.entries()) {
    const parameter = ["q", "prompt", "text"][index];
    assert.equal(new URL(destination.appHref).searchParams.get(parameter), `Read this article and help me apply it: ${article.url}`);
    assert.equal(new URL(destination.href).searchParams.get("q"), `Read this article and help me apply it: ${article.url}`);
  }
  assert.equal(new URL(aiTargets[2].appHref).protocol, "grokbot:");
  assert.equal(new URL(aiTargets[1].appHref).protocol, "codex:");
  assert.equal(new URL(aiTargets[2].href).hostname, "grok.com");
  assert.equal(new URL(aiTargets[2].href).searchParams.get("autoSubmit"), "false");
  assert.match(aiTargets[2].webLabel, /different from Grok Bot/);
});

test("Markdown retains the complete source, formatting and attribution", () => {
  const body = "## A heading\n\n**Bold**, [a link](https://example.com) & `code`.\n\n```html\n</script>\n</template>\n```";
  const markdown = articleMarkdown(article, body);
  assert.ok(markdown.startsWith(`# ${article.title}\n\n${article.description}\n\n`));
  assert.ok(markdown.includes(body));
  assert.ok(markdown.endsWith(`Source: ${article.url}\n`));
});

test("every published article inherits the common layout, actions, dialog and full Markdown", () => {
  let published = 0;
  for (const file of readdirSync(new URL("../src/content/writing/", import.meta.url))) {
    if (!file.endsWith(".md")) continue;
    const source = readFileSync(new URL(`../src/content/writing/${file}`, import.meta.url), "utf8");
    if (/^draft:\s*true\s*$/m.test(source)) continue;
    const slug = file.slice(0, -3);
    const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim();
    const html = readFileSync(new URL(`../dist/thoughts/${slug}/index.html`, import.meta.url), "utf8");
    const url = `https://justinfor.fun/thoughts/${slug}`;
    assert.ok(html.includes(`rel="canonical" href="${url}"`), slug);
    assert.equal((html.match(/data-article-actions\b/g) ?? []).length, 1, slug);
    assert.match(html, /<dialog\b[^>]*data-article-share\b[^>]*aria-labelledby="article-share-title"/);
    assert.match(html, /data-article-ai-toggle[^>]*aria-expanded="false"/);
    assert.match(html, /data-article-ai-options[^>]*inert/);
    for (const label of ["Open in Claude", "Open in ChatGPT", "Open in Grok Bot"]) assert.ok(html.includes(label), slug);
    assert.equal((html.match(/data-ai-app=/g) ?? []).length, 3, slug);
    assert.equal((html.match(/class="article-ai-web"/g) ?? []).length, 3, slug);
    for (const target of ["X", "LinkedIn", "Bluesky", "Email"]) assert.ok(html.includes(`Share via ${target}`), slug);
    assert.match(html, /data-article-copy="link"/);
    assert.match(html, /data-article-copy="markdown"/);
    const markdown = html.match(/<template\b[^>]*data-article-markdown[^>]*>([\s\S]*?)<\/template>/)?.[1];
    assert.ok(markdown, slug);
    const decoded = markdown.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
    assert.ok(decoded.includes(body), `full body missing from ${slug}`);
    assert.ok(decoded.includes(`Source: ${url}`), slug);
    assert.doesNotMatch(html, /https?:\/\/(?:localhost|127\.0\.0\.1)/);
    published++;
  }
  assert.ok(published > 0);
});
