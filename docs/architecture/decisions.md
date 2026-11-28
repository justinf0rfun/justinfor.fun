# Architecture decisions

## 01 · Verify once, then inspect the same build

The old documentation listed individual checks, including checks that expect
an existing `dist` folder. The cache check may build if development dependencies
are warm. Running every check independently therefore leaves clean-checkout
behavior and build ordering up to the caller.

`pnpm verify` runs the cache diagnostic in build mode, typechecks, then runs
the sorted verification files against that one build. The diagnostic retains
its original no-argument behavior. GitHub Actions uses the same command.

An explicit list of checks would require updating the runner whenever a check
was added. Moving all checks to separate test directories would broaden this
migration. Discovering checks within the existing filename convention keeps
their ownership and admits new checks without a registry.

The tool-strip and Inspiration checks compare rendered entries with their
catalogs and check link, uniqueness and initial active-slot behavior.

GitHub Actions installs Node.js 22 and uses Corepack to honor the
`packageManager` version in `package.json`. See the [Node.js CI guide](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs)
and [Corepack documentation](https://nodejs.org/download/release/latest-v22.x/docs/api/corepack.html).

## 02 · Own Projects as one ordered catalog

`src/data/projects.ts` owns the current project records and derived count
label. The homepage preview and both showcase surfaces project that array.
Preview geometry stays beside its record so reorder and deletion happen in one
place. The cover flight still receives the existing matching order.

Stable DOM keys could also replace the ordinal handoff. That changes selectors
and flight addressing. One ordered projection satisfies the existing ordinal
contract. The build check compares the visible covers, links, order and
preview widths at all three callers.

## 03 · Query published Thoughts through one interface

`getPublishedThoughts()` owns the draft predicate and newest-first order.
Home news, the reading list and static detail generation all call it in the
Astro server context. The Markdown collection remains the authority for the
records and content.

Putting the rules in a statically cached registry would introduce an extra
cache life cycle in development. Keeping the caller-local Astro query copies
would allow publication rules to drift. The shared query delegates loading and
invalidation to Astro. Existing built-output assertions check the homepage
news link, reading list, routes and Markdown export.

## 04 · Derive the static import map from installed parsers

The architecture check uses Astro's parser and the Vite parser already used by
the project. It follows literal imports into source files and exposes the graph
through the same command. Data catalogs may import other data and shared logic
without depending directly on UI or runtime entry points.

A substring scan can confuse comments and strings for imports and omit
multiline declarations. A separate dependency scanner would bring another
tool to configure and keep aligned with the build. Reusing the installed
parsers covers Astro frontmatter and scripts as well as TypeScript.

A temporary cyclic fixture and a prohibited catalog type import through
`/src/` both failed the check. The current graph passes.
