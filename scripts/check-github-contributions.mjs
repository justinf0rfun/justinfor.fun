import assert from "node:assert/strict";
import test from "node:test";
import { getContributions, refreshContributions } from "../src/github-contributions.js";

const key = "github-contributions:v1";
const now = Date.parse("2026-11-28T00:00:00Z");
const day = 24 * 60 * 60 * 1000;
const calendar = {
  totalContributions: 3,
  weeks: [{ contributionDays: [{ color: "#40c463", contributionCount: 3, date: "2026-11-27", weekday: 5 }] }],
};
const result = { username: "fixture", ...calendar, updatedAt: new Date(now).toISOString() };
const githubResponse = () => Response.json({
  data: { user: { contributionsCollection: { contributionCalendar: calendar } } },
});

function fixture(t, cached = null, respond = async () => githubResponse()) {
  t.mock.timers.enable({ apis: ["Date"], now });
  const upstream = t.mock.method(globalThis, "fetch", respond);
  const cache = { get: t.mock.fn(async () => cached), put: t.mock.fn(async () => {}) };
  const context = { waitUntil: t.mock.fn() };
  const env = { GITHUB_TOKEN: "fixture-token", GITHUB_USERNAME: "fixture", CONTRIBUTIONS: cache };
  return { env, context, cache, upstream };
}

test("a cold read loads GitHub's calendar and persists the complete response", async (t) => {
  const { env, context, cache, upstream } = fixture(t);
  assert.deepEqual(await getContributions(env, context), result);
  assert.deepEqual(cache.get.mock.calls[0].arguments, [key, "json"]);
  assert.deepEqual(cache.put.mock.calls[0].arguments, [key, JSON.stringify(result)]);
  assert.equal(context.waitUntil.mock.callCount(), 0);
  assert.equal(upstream.mock.callCount(), 1);
  const [url, options] = upstream.mock.calls[0].arguments;
  assert.equal(url, "https://api.github.com/graphql");
  assert.equal(options.method, "POST");
  assert.deepEqual(options.headers, {
    Accept: "application/vnd.github+json",
    Authorization: "Bearer fixture-token",
    "Content-Type": "application/json",
    "User-Agent": "justinfor.fun",
  });
  const { query, variables } = JSON.parse(options.body);
  assert.equal(query.replace(/\s+/g, " ").trim(), [
    "query Contributions($login: String!) { user(login: $login) { contributionsCollection {",
    "contributionCalendar { totalContributions weeks { contributionDays { color contributionCount date weekday } }",
    "} } } }",
  ].join(" "));
  assert.deepEqual(variables, { login: "fixture" });
});

test("a snapshot exactly one day old still returns without refreshing", async (t) => {
  const cached = { ...result, updatedAt: new Date(now - day).toISOString() };
  const { env, context, upstream } = fixture(t, cached);
  assert.equal(await getContributions(env, context), cached);
  assert.equal(upstream.mock.callCount(), 0);
  assert.equal(context.waitUntil.mock.callCount(), 0);
});

test("a stale read returns immediately and schedules refresh through waitUntil", { timeout: 1000 }, async (t) => {
  let respond;
  const waiting = new Promise((resolve) => { respond = resolve; });
  const cached = { ...result, totalContributions: 2, updatedAt: new Date(now - day - 1).toISOString() };
  const { env, context, cache } = fixture(t, cached, () => waiting);
  assert.equal(await getContributions(env, context), cached);
  assert.equal(context.waitUntil.mock.callCount(), 1);
  assert.equal(cache.put.mock.callCount(), 0);
  const [pending] = context.waitUntil.mock.calls[0].arguments;
  respond(githubResponse());
  assert.deepEqual(await pending, result);
  assert.deepEqual(cache.put.mock.calls[0].arguments, [key, JSON.stringify(result)]);
});

test("upstream failures reject cold requests and scheduled refreshes without writing", async (t) => {
  const { env, context, cache } = fixture(t, null, async () => new Response(null, { status: 503 }));
  await assert.rejects(getContributions(env, context), /GitHub GraphQL request failed: 503/);
  await assert.rejects(refreshContributions(env), /GitHub GraphQL request failed: 503/);
  assert.equal(cache.get.mock.callCount(), 1);
  assert.equal(cache.put.mock.callCount(), 0);
});

test("a failed cache write rejects the refresh", async (t) => {
  const { env, cache } = fixture(t);
  cache.put.mock.mockImplementation(async () => { throw new Error("cache offline"); });
  await assert.rejects(refreshContributions(env), /cache offline/);
  assert.equal(cache.get.mock.callCount(), 0);
  assert.deepEqual(cache.put.mock.calls[0].arguments, [key, JSON.stringify(result)]);
});
