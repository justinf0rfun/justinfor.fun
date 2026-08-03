## Development

Use the nvm-managed Node.js v22.22.2 for all Node and pnpm commands. Do not rely
on `PATH`, especially in elevated or isolated environments, because
`/usr/local/bin/node` is an outdated v18.12.1 installation. Invoke pnpm through
the pinned runtime:

```
/Users/justin/.nvm/versions/node/v22.22.2/bin/node /Users/justin/.nvm/versions/node/v22.22.2/lib/node_modules/pnpm/bin/pnpm.cjs <command>
```

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
