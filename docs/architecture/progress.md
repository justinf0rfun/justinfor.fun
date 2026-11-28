# Architecture governance progress

## Round 1 · Verification and catalog ownership

Base: `54aafea`. Work proceeds on `refactor/architecture-governance` in an
isolated worktree with its own installed dependencies and Vite caches.

Baseline evidence: Node.js 22 built 27 pages, and typechecking passed. The
existing checks passed 200 of 202 assertions. The two remaining failures
were fixed inventory counts for the tool strip and Inspiration catalog.

| Commit | Completed change |
| --- | --- |
| `85575dc` | Added the canonical verification entry point, CI workflow, and catalog-backed assertions. |
| `1c3d2bd` | Migrated the three published-Thoughts callers to one query. |
| `739dcf9` | Moved Projects metadata and preview geometry into the shared ordered catalog. Added a generated-page contract. |
| `f2854ce` | Removed the unused Astro welcome component and both assets referenced only by it. |
| `c1dbccc` | Added the source graph and automatic checks for cycles and catalog dependency direction. |

### Verification

- `pnpm verify` passed all 203 checks with the isolated dev server running.
  The build preserved all 41 active development dependency files.
- A fresh detached checkout of `c1dbccc` passed all 203 checks after a
  frozen-lockfile installation with no prior `dist` or development optimizer.
- Chromium verified the hydrated introduction, tool strip, chat open and close,
  and both Projects targets before and after production verification.
- Controlled dependency fixtures confirmed a cycle and a forbidden catalog
  type import each fail the architecture check.
- The workflow has read-only token permissions and invokes `pnpm verify`.
  A hosted GitHub Actions run remains to be verified after publishing the branch.

The [architecture map](README.md) and [backlog](backlog.md) cover the remaining
ownership migration, runtime verification and rollout work.
