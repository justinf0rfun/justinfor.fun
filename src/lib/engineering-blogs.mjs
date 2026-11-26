export const engineeringSources = [
  { id: "uber", name: "Uber Engineering", url: "https://rsshub.bestblogs.dev/uber/blog" },
  { id: "shopify", name: "Shopify Engineering", url: "https://shopify.engineering/blog.atom" },
  { id: "netflix", name: "Netflix Tech Blog", url: "https://netflixtechblog.com/feed" },
  { id: "cloudflare", name: "Cloudflare Blog", url: "https://blog.cloudflare.com/rss/" },
  { id: "openai", name: "OpenAI Blog", url: "https://openai.com/news/rss.xml" },
  { id: "stripe", name: "Stripe Blog", url: "https://stripe.com/blog/feed.rss" },
  { id: "github", name: "GitHub Blog", url: "https://github.blog/feed/" },
  { id: "meta", name: "Meta Engineering", url: "https://engineering.fb.com/feed/" },
];

export function engineeringChannel(position) {
  return String(position).padStart(2, "0");
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "long" });
export function engineeringTime(date, now = Date.now()) {
  const seconds = Math.round((Date.parse(date) - now) / 1000);
  const elapsed = Math.abs(seconds);
  if (!Number.isFinite(seconds)) return "";
  if (elapsed < 60) return "just now";
  if (elapsed < 3600) return relative.format(Math.trunc(seconds / 60), "minute");
  if (elapsed < 86400) return relative.format(Math.trunc(seconds / 3600), "hour");
  if (elapsed < 86400 * 30) return relative.format(Math.trunc(seconds / 86400), "day");
  if (elapsed < 86400 * 365) return relative.format(Math.trunc(seconds / (86400 * 30)), "month");
  return relative.format(Math.trunc(seconds / (86400 * 365)), "year");
}

const escape = (text) => String(text).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

export function renderEngineeringArticles(articles) {
  const latestByChannel = Array(engineeringSources.length).fill("");
  const earlier = [];

  for (const { source, title, link, date } of articles) {
    const index = engineeringSources.findIndex(({ name }) => name === source);
    if (index === -1 || !/^https?:\/\//i.test(link)) continue;

    const station = engineeringSources[index].id;
    const channel = engineeringChannel(index + 1);
    const sourceLabel = escape(source);
    const tuneLabel = `Tune to channel ${channel}, ${sourceLabel}`;
    const latest = !latestByChannel[index];
    const row = `<li class="engineering-article" data-engineering-article="${station}" ${latest ? "data-engineering-latest" : "hidden"}>
      <button type="button" class="engineering-channel" data-engineering-tune="${station}" aria-label="${tuneLabel}" title="${tuneLabel}">${channel}</button>
      <div class="engineering-program">
        <div class="engineering-byline">
          <span class="engineering-source">${sourceLabel}</span>
          <time datetime="${escape(date)}" title="${escape(date)}">${escape(engineeringTime(date))}</time>
        </div>
        <a class="engineering-article-link" href="${escape(link)}" target="_blank" rel="noopener noreferrer"><span>${escape(title)}</span><span aria-hidden="true" class="engineering-outbound">↗</span></a>
      </div>
    </li>`;
    if (latest) latestByChannel[index] = row;
    else earlier.push(row);
  }

  return [...latestByChannel, ...earlier].join("");
}
