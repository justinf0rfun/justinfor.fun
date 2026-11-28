# Architecture backlog

## Ready for focused migrations

| Priority | Observed problem | Candidate and acceptance evidence |
| --- | --- | --- |
| High | GitHub calendar reads and refreshes live in Worker routing. Mocked concurrent cold reads fetch individually. A valid calendar can return 503 when storing it fails. | Move the provider request and cache policy under one calendar interface. Preserve the endpoint, 24-hour policy, daily refresh, cache key and payload. Test first request, stale response during refresh, network failure and KV write failure. Verify cross-request behavior in Workerd before sharing in-flight I/O. |
| High | Several routes bootstrap the same stored theme, and three install separate system-theme listeners. | Compare a shared prepaint bootstrap and one runtime owner with the existing inline logic. Test initial paint, explicit light and dark, system changes on supported routes and unavailable storage. Preserve the home theme dial and the current Books system-change behavior unless changing it is confirmed. |
| High | A malformed per-source RSS cache object can reject the reader or prevent a refresh. Homepage injection waits for that reader. | Validate snapshots at read time and isolate the homepage error fallback. Cover partial and malformed snapshots, timed retry, stale retention and cold start. Preserve source numbering, feed limits, loopback parsing and response headers. |
| High | Memory source validation and R2 writes currently interleave. A missing later source can follow earlier uploads. Skipped published records can be rebased by the manifest update. | Have dry-run and upload consume the same fully validated plan. Test a late missing file before any writes, failed uploads, unchanged already-published records, and atomic manifest replacement. Confirm remote object availability before any bulk URL migration. |
| Medium | Dock visibility and ride coupon coverage enumerate overlay selectors independently. Three Dock selectors no longer match their showcase markup. Features also restore document overflow and inert state separately. | Verify the overlay matrix in a browser, then introduce one marker for collection overlays and migrate both consumers. Treat shared document locks as a distinct follow-up with overlapping and out-of-order release tests. |
| Medium | Folder handoff and Music handle history independently. Code review identified a possible rapid Back/Forward race during an async close. | Reproduce it across standalone and overlay transitions. Compare a desired-route owner with a smaller close-after-history reconciliation. Preserve native Books and mobile Thoughts navigation. |
| Medium | The Thoughts folder teaser duplicates one article's Markdown title and description. Legacy Music preview cards are assembled before the current record-rack render path bypasses them. | Resolve the pinned Thoughts teaser from its article data. Confirm which Music preview data is still consumed before removing the old card representation. Keep audio preloads and direct links covered. |
| Medium | Browser hydration, Worker integration and animation probes sit outside the canonical Node checks. | Add portable, focused browser and local Worker checks as contracts settle. Check fresh and warm caches and retain focused probes for behavior that Node tests cannot exercise. |
| Medium | Build reports a scoped Books CSS selector diagnostic and large client chunks. The repository includes licensed or generated rendering code. | Resolve the CSS warning at its owning component and measure which entries load the large chunks. Preserve bundle timing and license provenance. Use concrete request and rendering evidence before reshaping chunks. |

## Decisions requiring confirmation

- Selecting a different source for the pinned Thoughts preview or making it
  follow the newest entry changes an editorial choice.
- A Cron-only calendar loader or HTTP method restrictions change public Worker
  behavior. Keep current routes and on-demand recovery until the contract is
  agreed.
- Production KV or R2 migrations, release configuration changes, and required
  branch protection checks need a separate rollout decision. The workflow
  runs verification with read-only repository access.
