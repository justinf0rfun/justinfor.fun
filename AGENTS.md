## Development

Use Node.js 22 for all Node and pnpm commands, as required by `package.json`.
In an nvm-managed environment, initialize nvm and select Node 22 before running
project commands:

```
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22
pnpm <command>
```

Do not hard-code machine-specific runtime paths in repository files.

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Commit Messages

Use Conventional Commits in this format:

```
<type>: <summary>
```

- Use a lowercase type: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`,
  `build`, `ci`, `chore`, or `revert`.
- Write the summary in concise, imperative English.
- Do not capitalize the first word of the summary.
- Do not end the subject with a period.
- Keep each commit focused on one logical change.

Examples:

```
feat: add software slogans
fix: remove iOS animation artifacts
docs: explain Cloudflare deployment
```

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
