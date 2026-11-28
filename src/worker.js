import { WorkerEntrypoint } from "cloudflare:workers";
import { loadEngineeringArticles, readEngineeringSource } from "./engineering-feed.js";
import { getContributions, refreshContributions } from "./github-contributions.js";
import { engineeringSources, renderEngineeringArticles } from "./lib/engineering-blogs.mjs";

// A loopback binding gives each RSS parse its own Worker invocation.
export class EngineeringSourceReader extends WorkerEntrypoint {
  async read(id) {
    const source = engineeringSources.find((feed) => feed.id === id);
    if (!source) throw new Error("Unknown engineering feed");
    return readEngineeringSource(source);
  }
}

const json = (body, init = {}) =>
  Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      ...init.headers,
    },
  });

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);

    if (url.pathname === "/api/engineering-blogs") {
      return Response.json({ articles: await loadEngineeringArticles(env.CONTRIBUTIONS, context) }, {
        headers: { "Cache-Control": "no-cache" },
      });
    }

    if (request.method === "GET" && url.pathname === "/") {
      const page = await env.ASSETS.fetch(new Request(request.url));
      if (!page.ok || !page.headers.get("Content-Type")?.includes("text/html")) return page;
      const articles = loadEngineeringArticles(env.CONTRIBUTIONS, context);
      const transformed = new HTMLRewriter().on("[data-engineering-items]", {
        async element(element) {
          const items = await articles;
          if (items.length) element.setInnerContent(renderEngineeringArticles(items), { html: true });
        },
      }).transform(page);
      const headers = new Headers(transformed.headers);
      headers.delete("ETag");
      headers.delete("Last-Modified");
      headers.set("Cache-Control", "no-cache");
      return new Response(transformed.body, { status: page.status, headers });
    }

    if (url.pathname === "/api/contributions") {
      try {
        return json(await getContributions(env, context));
      } catch (error) {
        console.error("Unable to load GitHub contributions", error);
        return json(
          { error: "Contribution activity is temporarily unavailable" },
          { status: 503, headers: { "Cache-Control": "no-store" } },
        );
      }
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(_controller, env, context) {
    context.waitUntil(refreshContributions(env));
  },
};
