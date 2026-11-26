import assert from "node:assert/strict";
import test from "node:test";
import { loadEngineeringArticles, mergeEngineeringArticles, readEngineeringSource } from "../src/engineering-feed.js";
import { engineeringSources, renderEngineeringArticles } from "../src/lib/engineering-blogs.mjs";

const now = Date.parse("2026-11-26T00:00:00Z");
const response = (xml) => async () => new Response(xml);
const source = engineeringSources[3];

test("RSS normalization filters unsafe links and dates, then sorts valid results", async () => {
  const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>Example</title>
    <item><title>Older</title><link>/older</link><pubDate>Tue, 17 Nov 2026 20:01:00 GMT</pubDate></item>
    <item><title>Newest &amp; valid</title><link>/newest#intro</link><pubDate>Wed, 25 Nov 2026 08:00:00 GMT</pubDate><description>Short summary</description></item>
    <item><title>Protocol</title><link>javascript:alert(1)</link><pubDate>Wed, 25 Nov 2026 13:00:00 GMT</pubDate></item>
    <item><title>Undated</title><link>/undated</link></item>
    <item><title>Middle</title><link>/middle</link><pubDate>Wed, 18 Nov 2026 05:00:00 GMT</pubDate></item>
    </channel></rss>`;
  const entries = await readEngineeringSource(source, response(xml), now);
  assert.deepEqual(entries.map(({ title }) => title), ["Newest & valid", "Middle", "Older"]);
  assert.deepEqual(entries[0], {
    source: source.name, title: "Newest & valid", link: "https://blog.cloudflare.com/newest",
    date: "2026-11-25T08:00:00.000Z", summary: "Short summary",
  });
});

test("a large Atom feed keeps recent entries and their published dates", async () => {
  const entries = Array.from({ length: 10 }, (_, i) => `<entry><title>Post ${i}</title><id>post${i}</id><link href="https://example.org/${i}" />
    <published>2026-11-${25 - i}T09:00:00Z</published><updated>2026-11-25T12:00:00Z</updated>
    <content type="html"><![CDATA[<!-- </entry> -->${"For example ".repeat(200)}]]></content></entry>`);
  const feed = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>Atom</title>${entries.join("")}</feed>`;
  const data = await readEngineeringSource(source, response(feed), now);
  assert.deepEqual(data.map(({ title, date }) => [title, date]), [
    ["Post 0", "2026-11-25T09:00:00.000Z"], ["Post 1", "2026-11-24T09:00:00.000Z"],
    ["Post 2", "2026-11-23T09:00:00.000Z"], ["Post 3", "2026-11-22T09:00:00.000Z"],
    ["Post 4", "2026-11-21T09:00:00.000Z"],
  ]);
});

test("long feeds can finish before the archive body is downloaded", { timeout: 1000 }, async () => {
  let cancelled = false;
  const items = Array.from({ length: 8 }, (_, i) => `<item><title>Post ${i}</title><link>https://example.org/${i}</link>
    <pubDate>${new Date(now - (i + 1) * 3600000).toUTCString()}</pubDate>
    <description><![CDATA[${"Article text ".repeat(300)}]]></description></item>`);
  const stream = new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode(`<rss version="2.0"><channel>${items.join("")}`)); },
    cancel() { cancelled = true; },
  });
  const data = await readEngineeringSource(source, async () => new Response(stream), now);
  assert.ok(cancelled);
  assert.deepEqual(data.map(({ title }) => title), ["Post 0", "Post 1", "Post 2", "Post 3", "Post 4"]);
});

test("duplicate links use the newest article and expired or removed sources are omitted", () => {
  const article = { source: source.name, title: "New", link: "https://blog.cloudflare.com/newest", date: "2026-11-25T08:00:00.000Z" };
  const snapshot = {
    cloudflare: { fetchedAt: now, articles: [article] },
    github: { fetchedAt: now, articles: [{ ...article, title: "Duplicate", date: "2026-11-23T08:00:00.000Z" }] },
    meta: { fetchedAt: now - 6 * 3600000, articles: [{ ...article, link: "https://blog.cloudflare.com/expired" }] },
    linkedin: { fetchedAt: now, articles: [{ ...article, source: "LinkedIn Engineering", link: "https://www.linkedin.com/blog/engineering/example" }] },
  };
  assert.deepEqual(mergeEngineeringArticles(snapshot, now), [article]);
});

test("a failing source can keep its last successful results without refetching fresh sources", async (t) => {
  const now = Date.now();
  const article = { source: source.name, title: "Previously fetched", link: "https://blog.cloudflare.com/article", date: new Date(now - 1000).toISOString() };
  const snapshot = Object.fromEntries(engineeringSources.map(({ id }) => [id, { fetchedAt: now, checkedAt: now, articles: [] }]));
  const lastGood = now - 4 * 3600000;
  snapshot.cloudflare = { fetchedAt: lastGood, checkedAt: lastGood, articles: [article] };
  snapshot.linkedin = { fetchedAt: now, checkedAt: now, articles: [{ ...article, source: "LinkedIn Engineering" }] };
  const fetch = t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 503 }));
  t.mock.method(console, "warn", () => {});
  let stored, pending;
  const cache = { get: async () => snapshot, put: async (_key, value) => { stored = JSON.parse(value); } };
  const items = await loadEngineeringArticles(cache, { waitUntil(promise) { pending = promise; } });
  assert.deepEqual(items, [article]);
  await pending;
  assert.equal(fetch.mock.callCount(), 1);
  assert.deepEqual(stored.cloudflare.articles, [article]);
  assert.equal(stored.cloudflare.fetchedAt, lastGood);
  assert.equal(stored.linkedin, undefined);
});

test("rendered article titles and links are safely escaped", () => {
  const article = { source: source.name, title: '<img src="x" onerror="alert(1)">', link: 'https://example.org/?x="&y=2', date: "2026-11-24T00:00:00.000Z" };
  const output = renderEngineeringArticles([article]);
  assert.doesNotMatch(output, /<img /);
  assert.match(output, /&lt;img/);
  assert.match(output, /href="https:\/\/example.org\/\?x=&quot;&amp;y=2"/);
  assert.equal(renderEngineeringArticles([{ ...article, link: "javascript:alert(1)" }]), "");
});

test("the radio guide lists the latest from each channel first, then older articles in feed order", () => {
  const article = { source: source.name, title: "Latest from Cloudflare", link: "https://blog.cloudflare.com/newest", date: "2026-11-25T08:00:00.000Z" };
  const output = renderEngineeringArticles([
    { ...article, source: "GitHub Blog", title: "Latest from GitHub", link: "https://github.blog/latest", date: "2026-11-26T08:00:00.000Z" },
    article,
    { ...article, source: "GitHub Blog", title: "Older from GitHub", link: "https://github.blog/older", date: "2026-11-24T08:00:00.000Z" },
    { ...article, title: "Older from Cloudflare", link: "https://blog.cloudflare.com/older", date: "2026-11-23T08:00:00.000Z" },
  ]);
  assert.deepEqual([...output.matchAll(/data-engineering-article="([a-z]+)" ([a-z-]+)>/g)].map((match) => match.slice(1)), [
    ["cloudflare", "data-engineering-latest"], ["github", "data-engineering-latest"], ["github", "hidden"], ["cloudflare", "hidden"],
  ]);
  assert.match(output, /data-engineering-tune="cloudflare" aria-label="Tune to channel 04, Cloudflare Blog"[^>]*>04<\/button>/);
  assert.match(output, /data-engineering-tune="github" aria-label="Tune to channel 07, GitHub Blog"[^>]*>07<\/button>/);
});
