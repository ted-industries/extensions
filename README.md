# ted-extensions

extension registry and marketplace for the [ted](https://ted.tomlin7.com) code editor.

## browse extensions

visit the [ted extensions marketplace →](https://extensions.ted.tomlin7.com)

## install an extension

### via extension registry

navigate to the extensions center in ted and click the **install** button next to the extension you want to install.

### via cli

```bash
ted ext install hello-world
```

### manually

1. find the extension in [`registry/extensions/`](./registry/extensions/)
2. copy the extension folder to `~/.ted/extensions/<name>/`
3. restart ted

## publish an extension

see the [publishing guide](https://extensions.ted.tomlin7.com/docs/publishing) for full instructions.

**short version:**

1. fork this repository
2. add your extension to `registry/extensions/<name>/` with:
   - `package.json` — manifest with `name`, `version`, `displayName`, `main`
   - `index.js` — entry point exporting `activate(api)` and optionally `deactivate()`
   - `README.md` — documentation (shown on the marketplace)
3. run `bun validate` — all checks must pass
4. open a pull request

### via external repository

if you prefer to host your extension in its own repository:

1. fork this repository
2. add your extension metadata to `registry/external.json`:
   ```json
   {
     "name": "your-extension-name",
     "displayName": "Your Extension",
     "description": "Short description",
     "version": "1.0.0",
     "main": "index.js",
     "repository": "https://github.com/user/your-repo",
     "author": "your-username",
     "tags": ["utility", "sample"]
   }
   ```
3. run `bun validate`
4. open a pull request

ci will validate your extension automatically. once merged, the marketplace updates within minutes.

## development

first validate all extensions, then rebuild the index:

```bash
bun validate
bun build-index
```

to run the marketplace website locally:

```bash
bun dev
```

## static registry api

the registry index is served as a static API from the marketplace deployment:

- **Index:** `https://extensions.ted.tomlin7.com/v1/extensions.json`

this api is used by the ted editor and cli to discover extensions.

## repository structure

```
ted-extensions/
├── registry/
│   ├── extensions.json          # master index (generated)
│   └── extensions/
│       └── <name>/
│           ├── package.json
│           ├── index.js
│           └── README.md
├── docs/                        # next.js marketplace website
│   └── content/docs/            # mdx developer documentation
├── scripts/
│   ├── validate.ts              # ci validator
│   └── build-index.ts           # index builder
└── .github/workflows/
    └── validate.yml             # ci/cd
```

## license

MIT license — see [LICENSE](./LICENSE)
