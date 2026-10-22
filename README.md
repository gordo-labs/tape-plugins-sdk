# @gordo-labs/tape-plugins-sdk

Runtime-independent TypeScript SDK for declaring and validating Music Hub
plugin manifests. It has no dependency on Electron, the Desktop runtime, the
Music Hub database, or any host service.

## Install

The package is published on npm:

```bash
npm install @gordo-labs/tape-plugins-sdk
```

The source repository is also available for development:

```bash
npm install github:gordo-labs/tape-plugins-sdk
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

Read the complete contract in the [Music Hub plugin documentation](https://docs.tapemusicsuite.com/plugins).

## Development

```bash
npm install
npm test
npm run pack:check
```

## License

MIT

## Plugin API v2 (beta, `0.3.0-beta`)

Plugin API v2 is the contract for public community plugins. It adds:

- `validatePluginManifestV2` / `definePluginManifestV2` for `schemaVersion: 2` manifests (`kind`, `publisher`, `engines`, `network.allow`, `dataDisclosure`, `activation`, `contributes` by extension point, `settings`).
- `PLUGIN_PERMISSION_CATALOG`: every permission with its consent text, risk and status (`available`, `reserved`, `core-only`).
- `EXTENSION_POINT_CATALOG`: where a plugin can appear in Tape Desktop and how (declarative or sandboxed iframe).
- `PLUGIN_HARD_LIMITS`: the limits Tape applies to every plugin.
- `TapeWorkerApi`: the `tape` global available to a worker running in the Hub sandbox.
- `tape.library.getAlbum` / `getArtist` / `getLabel` (since `0.3.0-beta.3`, `library.read`): resolve the `albumId`, `artistId` and `labelId` that context-menu commands receive.
- `migrateManifestV1ToV2` for existing v1 manifests.
- Machine-readable files: `schemas/plugin-manifest.v2.schema.json` and `schemas/plugin-api.v2.json`
  (`import schema from '@gordo-labs/tape-plugins-sdk/schemas/plugin-manifest.v2.schema.json'`).

Reserved permissions and extension points are proposed APIs: Tape accepts them only in Developer mode
(`validatePluginManifestV2(manifest, { allowReserved: true })`) and never in the public catalog.
