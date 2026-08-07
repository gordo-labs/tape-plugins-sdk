# @gordo-labs/tape-plugins-sdk

Runtime-independent TypeScript SDK for declaring and validating Music Hub
plugin manifests. It has no dependency on Electron, the Desktop runtime, the
Music Hub database, or any host service.

## Install

The package is available from the public GitHub repository while the first npm
release is being prepared:

```bash
npm install github:gordo-labs/tape-plugins-sdk
```

Once the npm release is available, use the registry package instead:

```bash
npm install @gordo-labs/tape-plugins-sdk
```

The package is designed for build-time validation. It does not execute plugin
code and it does not grant host permissions.

## Example

```ts
import { definePluginManifest } from '@gordo-labs/tape-plugins-sdk';

export const manifest = definePluginManifest({
  id: 'community-metadata-notes',
  packageId: '@example/music-hub-community-metadata-notes',
  name: 'Community Metadata Notes',
  version: '0.1.0',
  tier: 'community',
  distribution: 'sideloaded',
  description: 'A user-reviewable metadata proposal.',
  statement: 'Proposes metadata only after explicit user review.',
  source: { visibility: 'open-source', license: 'MIT' },
  defaultEnabled: false,
  permissions: ['library.metadata.read', 'metadata.propose', 'ui.contribute'],
  capabilities: [],
  entrypoints: { worker: 'dist/plugin.js' },
  isolation: { storageScope: 'private' },
  compatibility: { musicHubDesktop: '>=0.2.0 <1.0.0', pluginApi: '1' },
});
```

## API

- `definePluginManifest` validates and deeply freezes a manifest.
- `validatePluginManifest` returns validation issues without throwing.
- `validatePluginCompatibility` checks a manifest against a Desktop/API target.
- `assertPluginCompatible` throws when the target is not supported.
- `PLUGIN_API_VERSION` exposes the current public Plugin API version.

Read the complete contract in the [Music Hub plugin documentation](https://docs.music-hub.gordo.design/plugins).

## Development

```bash
npm install
npm test
npm run pack:check
```

## License

MIT
