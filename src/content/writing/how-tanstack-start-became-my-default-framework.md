---
title: How TanStack Start became my default framework
description: The framework matters less than it used to. A legible application model matters more — especially when agents are doing part of the building.
publishedAt: 2026-08-12
draft: false
---

I used to be unusually picky about the framework at the bottom of a new project. That choice shaped weeks of work: routing, data loading, rendering, deployment, and the pile of conventions every contributor had to learn before they could make a safe change.

Then agents changed the weight of the decision. They can move between libraries quickly, generate the repetitive parts, and search through an unfamiliar codebase without waiting for a human to remember where everything lives. The framework still matters, but not because I want to spend my time writing framework code. It matters because it gives both me and the agent a coherent application model.

TanStack Start has become my default for that reason. It keeps the router at the centre, makes server work visible, and leaves fewer invisible conventions for an agent to guess.

## The framework is no longer the whole workflow

Choosing a stack used to be partly an optimisation for memory. I preferred the framework whose conventions I could recall without opening documentation. Familiarity reduced the cost of every route, loader, mutation, and deployment decision.

That advantage is smaller now. An agent can look up an API and implement the ordinary version in seconds. What it cannot do reliably is infer the unwritten boundaries of an application: which state belongs in the URL, which code may reach the database, where validation happens, and what should remain portable.

So my question changed. I no longer ask which framework lets me type the fewest lines from memory. I ask which one leaves the clearest evidence about how the application works.

## Router-first is the useful constraint

TanStack Start is a full-stack React framework powered by TanStack Router. That description sounds ordinary until you notice what it makes non-negotiable: routes remain the application contract.

Parameters, search state, loaders, pending states, errors, and navigation all belong to the same route tree. The server layer adds full-document rendering, streaming, server functions, middleware, and deployment output without replacing that model.

This helps agent-assisted work because the route is a good place to begin reading. Instead of searching for an implicit convention spread across several folders, the agent can inspect one route and recover a large part of the user journey.

### The URL carries real state

Search parameters are not an afterthought. They can be parsed and typed as part of the route, which makes filters, selections, and shareable views explicit. That is better for users, but it is also better context for an agent: the state has a name, a schema, and a location.

### Loaders make data dependencies visible

A route loader states what the page needs before rendering it. It is not the only place an application can fetch data, but it is a predictable starting point. When an agent has to change a screen, a visible dependency is safer than a request hidden in an effect several layers below it.

## Server work stays explicit

TanStack Start's server functions let client code call server-only logic through a typed boundary. The implementation remains on the server while the browser receives a callable stub.

The important part is not the convenience of the RPC. It is that the boundary is named in code. Database access, secrets, and mutations have an obvious home, while inputs cross a validator before they reach the handler.

That explicitness matters when an agent is editing a full-stack feature. A file name and a `createServerFn` call provide evidence about where code runs. They reduce the chance that a convenient import quietly moves server assumptions into a client bundle.

### One application, two environments

Start code is isomorphic by default, so a loader may execute during server rendering and again during client navigation. That is powerful, but it is not magic. Browser-only and server-only work still need intentional boundaries.

I prefer this to a framework that hides the execution model behind naming folklore. The rule can be documented, inspected, and tested. An agent can work with an explicit constraint; it struggles with a convention that only exists in the team's memory.

## Defaults matter more in agent workflows

Agents make it cheap to generate code and expensive to review ambiguity. A framework default is valuable when it removes a decision that would otherwise be guessed differently in every feature.

The useful defaults in Start are structural rather than decorative: file-based routes, typed navigation, route-level data dependencies, server functions, and a build that targets more than one runtime. They give generated code somewhere unsurprising to live.

I still keep a small starter repository. It contains the decisions that no framework can make for me: naming, authentication boundaries, data access, design tokens, tests, and the commands an agent should run before calling a change complete. Start provides the application grammar; the starter provides my dialect.

## Portability changes the choice

I do not want the hosting provider to become the architecture. Start supports builds for different providers and runtimes, including Cloudflare Workers, while keeping the route and server-function authoring model stable.

That does not make every deployment identical. Runtime APIs, environment variables, caching, and platform bindings still need care. But the differences stay closer to the deployment edge instead of spreading through every screen.

For an indie project, that is enough portability to be useful. I can choose the runtime that fits the product without teaching the whole codebase a new framework.

## Where I still hesitate

TanStack Start is currently a release candidate rather than a final v1 release. Its documented API is considered stable and feature-complete, but the ecosystem is younger than the ones around older full-stack React frameworks.

That means I expect sharper edges: fewer production stories to search, fewer integrations that assume Start by default, and occasional changes near experimental areas such as React Server Components.

I would not describe those risks as irrelevant. I accept them because the core model is already coherent, and because a smaller amount of explicit framework machinery is easier for me to audit than a larger amount of mature but implicit convention.

## What “default” actually means

A default is not a rule. If a project only needs a client-side application, TanStack Router may be enough. If a team already has deep operational experience elsewhere, changing frameworks can cost more than any architectural improvement returns.

For my own new full-stack React projects, Start is the first option I test. It gives me a router-first application model, explicit server boundaries, and deployment choices without asking me to trade away type safety.

The framework did not become less important in the age of agents. The reason for choosing one changed. I want less hidden knowledge, fewer guesses, and a codebase whose structure explains itself to whoever — or whatever — works on it next.

The technical descriptions in this article are based on the official [TanStack Start overview](https://tanstack.com/start/latest/docs/framework/react/overview), [server functions guide](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions), and [execution model](https://tanstack.com/start/latest/docs/framework/react/guide/execution-model).
