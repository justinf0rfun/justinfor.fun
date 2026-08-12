const CACHE_KEY = "github-contributions:v1";
const ONE_DAY = 24 * 60 * 60 * 1000;

const CONTRIBUTIONS_QUERY = `
  query Contributions($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              color
              contributionCount
              date
              weekday
            }
          }
        }
      }
    }
  }
`;

const json = (body, init = {}) =>
  Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      ...init.headers,
    },
  });

const fetchContributions = async (env) => {
  if (!env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not configured");

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "justinfor.fun",
    },
    body: JSON.stringify({
      query: CONTRIBUTIONS_QUERY,
      variables: { login: env.GITHUB_USERNAME },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed: ${response.status}`);
  }

  const payload = await response.json();
  const calendar = payload.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? "GitHub contribution data is missing");
  }

  return {
    username: env.GITHUB_USERNAME,
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks,
    updatedAt: new Date().toISOString(),
  };
};

const refreshContributions = async (env) => {
  const contributions = await fetchContributions(env);
  await env.CONTRIBUTIONS.put(CACHE_KEY, JSON.stringify(contributions));
  return contributions;
};

const getContributions = async (env, context) => {
  const cached = await env.CONTRIBUTIONS.get(CACHE_KEY, "json");
  if (!cached) return refreshContributions(env);

  const age = Date.now() - Date.parse(cached.updatedAt);
  if (age > ONE_DAY) context.waitUntil(refreshContributions(env));
  return cached;
};

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);

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
