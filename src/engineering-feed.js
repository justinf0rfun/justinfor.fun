import Parser from "rss-parser";
import { engineeringSources } from "./lib/engineering-blogs.mjs";

const CACHE_KEY = "engineering-blogs:v2";
const HOUR = 60 * 60 * 1000;
const FRESH = 3 * HOUR;
const RETAIN = 6 * HOUR;
const RETRY = HOUR / 4;
const MAX_XML = 2 * 1024 * 1024;
const ARTICLES_PER_SOURCE = 5;
const WINDOW_SIZE = ARTICLES_PER_SOURCE + 3;
let refreshInFlight;

// These feeds publish newest first. Preserve whole entries and the XML envelope,
// but keep oversized article bodies and historical archives out of the parser.
function recentEntries(xml) {
  const atom = /<feed(?:\s|>)/i.test(xml);
  const entry = atom ? "entry" : "item";
  const rss = /<rss(?:\s|>)/i.test(xml);
  const tokens = /<!\[CDATA\[[\s\S]*?(?:\]\]>|$)|<!--[\s\S]*?(?:-->|$)|<\/(item|entry)\s*>/gi;
  let count = 0;
  if (atom || rss) {
    for (const match of xml.matchAll(tokens)) {
      if (match[1]?.toLowerCase() === entry && ++count === WINDOW_SIZE) {
        return xml.slice(0, match.index + match[0].length) + (atom ? "</feed>" : "</channel></rss>");
      }
    }
  }
}

async function readRecentXml(response) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let xml = "";
  let bytes = 0;
  let nextCheck = 16_384;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        xml += decoder.decode();
        return recentEntries(xml) ?? xml;
      }
      bytes += value.byteLength;
      if (bytes > MAX_XML) throw new Error("RSS is too large");
      xml += decoder.decode(value, { stream: true });
      if (bytes >= nextCheck) {
        const window = recentEntries(xml);
        if (window) return window;
        nextCheck = bytes + 16_384;
      }
    }
  } finally {
    void reader.cancel().catch(() => {});
  }
}

export async function readEngineeringSource(source, fetchFeed = fetch, now = Date.now()) {
  const response = await fetchFeed(source.url, {
    headers: {
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9",
      "User-Agent": "justinfor.fun Engineering Blogs",
    },
    signal: AbortSignal.timeout(4500),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const xml = (await readRecentXml(response)).replace(/<(content:encoded|content|description|summary)\b[^>]*>\s*(?:<!\[CDATA\[[\s\S]*?\]\]>|[\s\S]*?)<\/\1\s*>/gi,
    (body) => body.length > 768 ? "" : body);
  const feed = await new Parser({ customFields: { item: ["published"] } }).parseString(xml);
  const articles = [];
  const links = new Set();
  for (const item of feed.items) {
    const title = typeof item.title === "string" ? item.title.trim() : "";
    const timestamp = Date.parse(item.published ?? item.isoDate ?? item.pubDate);
    if (!title || !item.link || !Number.isFinite(timestamp) || timestamp > now) continue;
    let url;
    try { url = new URL(item.link, response.url || source.url); } catch { continue; }
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    url.hash = "";
    if (links.has(url.href)) continue;
    links.add(url.href);
    const summary = typeof item.contentSnippet === "string" ? item.contentSnippet.replace(/\s+/g, " ").trim().slice(0, 280) : "";
    articles.push({ source: source.name, title, link: url.href, date: new Date(timestamp).toISOString(), ...(summary ? { summary } : {}) });
  }
  if (!articles.length) throw new Error("RSS has no dated articles");
  return articles.sort((a, b) => b.date.localeCompare(a.date)).slice(0, ARTICLES_PER_SOURCE);
}

export function mergeEngineeringArticles(snapshot, now = Date.now()) {
  const seen = new Set();
  return engineeringSources.map(({ id }) => snapshot[id])
    .filter((entry) => entry && now - entry.fetchedAt < RETAIN)
    .flatMap(({ articles }) => articles)
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(({ link }) => {
      if (seen.has(link)) return false;
      seen.add(link);
      return true;
    });
}

function refreshSources(snapshot, due, cache, now, reader) {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const next = Object.fromEntries(engineeringSources.map(({ id }) => [id, snapshot[id]]));
    await Promise.all(due.map(async (source) => {
      try {
        const articles = reader ? await reader.read(source.id) : await readEngineeringSource(source);
        next[source.id] = { checkedAt: now, fetchedAt: now, articles };
      } catch (error) {
        next[source.id] = { fetchedAt: 0, articles: [], ...snapshot[source.id], checkedAt: now };
        console.warn(`Engineering feed ${source.id}: ${error.message}`);
      }
    }));
    try {
      await cache.put(CACHE_KEY, JSON.stringify(next), { expirationTtl: RETAIN / 1000 });
    } catch (error) {
      console.warn("Unable to write the engineering feed cache", error);
    }
    return next;
  })().finally(() => { refreshInFlight = undefined; });
  return refreshInFlight;
}

export async function loadEngineeringArticles(cache, context) {
  let snapshot = {};
  try {
    snapshot = (await cache.get(CACHE_KEY, "json")) ?? {};
  } catch (error) {
    console.warn("Unable to read the engineering feed cache", error);
  }
  const now = Date.now();
  const ready = mergeEngineeringArticles(snapshot, now);
  const due = engineeringSources.filter(({ id }) => !snapshot[id] || (
    now - snapshot[id].fetchedAt >= FRESH && now - snapshot[id].checkedAt >= RETRY
  ));
  if (!due.length) return ready;
  const refresh = refreshSources(snapshot, due, cache, now, context.exports?.EngineeringSourceReader);
  if (!ready.length) return mergeEngineeringArticles(await refresh, now);
  context.waitUntil(refresh);
  return ready;
}
