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

## Plugin API v2 (beta, `0.3.0-beta`; 2.1 below)

Plugin API v2 is the contract for public community plugins. It adds:

- `validatePluginManifestV2` / `definePluginManifestV2` for `schemaVersion: 2` manifests (`kind`, `publisher`, `engines`, `network.allow`, `dataDisclosure`, `activation`, `contributes` by extension point, `settings`).
- `PLUGIN_PERMISSION_CATALOG`: every permission with its consent text, risk and status (`available`, `reserved`, `core-only`).
- `EXTENSION_POINT_CATALOG`: where a plugin can appear in Tape Desktop and how (declarative or sandboxed iframe).
- `PLUGIN_HARD_LIMITS`: the limits Tape applies to every plugin. Since `0.3.0-beta.5` it also lists the CPU budget (15 s per 60 s), the delay on refused calls (250 ms; more than 1000 waiting refusals stops the worker), 4 host calls in flight for plugin pages, `listPlaylists` (1000) and `getPlaylistTrackIds` (5000) caps, and the badge command budget (1.5 s). `PLUGIN_HOST_GUARANTEES` notes that paging cursors are signed and valid only until the Hub restarts, and that notifications (6 per minute) are shared by the worker and the plugin's pages.
- `network.allow` wildcards (since `0.3.0-beta.5`): `*.<base>` is refused when `<base>` is a public or shared-hosting suffix such as `co.uk` or `herokuapp.com` (`NETWORK_PUBLIC_SUFFIXES`).
- `TapeWorkerApi`: the `tape` global available to a worker running in the Hub sandbox.
- `kind: "theme"` plugins (since `0.3.0-beta.4`): declare `entrypoints.theme` (a `.json` token theme listed in `files`) and the available `ui.theme` permission; no worker needed. A `kind: "plugin"` may also ship a theme with the same two fields.
- `tape.library.getAlbum` / `getArtist` / `getLabel` (since `0.3.0-beta.3`, `library.read`): resolve the `albumId`, `artistId` and `labelId` that context-menu commands receive.
- `migrateManifestV1ToV2` for existing v1 manifests.
- Machine-readable files: `schemas/plugin-manifest.v2.schema.json` and `schemas/plugin-api.v2.json`
  (`import schema from '@gordo-labs/tape-plugins-sdk/schemas/plugin-manifest.v2.schema.json'`).

Reserved permissions and extension points are proposed APIs: Tape accepts them only in Developer mode
(`validatePluginManifestV2(manifest, { allowReserved: true })`) and never in the public catalog.

## Plugin API 2.1 (`0.4.0-beta.1`)

API 2.1 is an additive minor revision of Plugin API 2 (`PLUGIN_API_REVISION = "2.1"`); manifests still declare `engines.pluginApi: "2"` and v2 plugins keep working. Tape does the work and the plugin asks: a plugin never touches disk, database, audio or network directly. Granting a write permission is the user's standing approval; every change returns `{ changeId }`, appears in the plugin's Changes history and can be undone, and revoking the permission stops new changes at once.

New `available` permissions: `library.files.read`, `library.files.write`, `library.organize.apply`, `metadata.apply`, `playlists.write` (own playlists only), `jobs.schedule`, `playback.control`, `audio.analyze`, `ui.mobile`, and `audio.process`. `audio.process` is `available` with the new catalog field `developerOnly: true`: it works only in Developer mode, so a manifest requesting it needs `allowReserved: true` until the audio graph passes playback QA. `status` keeps its meaning.

New worker API (`TapeWorkerApi`): `files.{stat,read,write,move,trash,list}` with `FileRef` (`{ trackId }`, `{ folderIndex, relativePath }`, or `{ scope: 'plugin', relativePath }` for the plugin's own folder), `organize.applyPlan` / `organize.apply`, `metadata.apply`, `playlists.{create,update,setTracks,addTracks,removeTracks,delete}`, `jobs.register(id, { everyMinutes >= 15 }, handler)` (register synchronously at load), `playback.{play,pause,resume,next,previous,seek,setVolume,enqueue}` (reject with `Unavailable` when no Desktop UI owns playback), `audio.setEffects`, and `views.update`. Each method's permission is in `WORKER_API_PERMISSIONS`.

Declarative views: a `workspace` item may set `"render": "<commandId>"` instead of an iframe `view` (at most one of the two). Tape calls the command with `{ viewId, state }` (actions add `args`) and draws the returned `PluginViewResult` (`{ view?, state?, toast?, navigate? }`) with its own components. Node types: `stack`, `section`, `text`, `heading`, `badge`, `image` (`trackId` or `albumId` only), `list`, `table`, `button`, `form`, `empty`, `progress`. `validatePluginViewTree(tree)` returns issues and enforces 256 KB, depth 12, 2,000 nodes, 500 table rows, allowed types and props, and no URLs in any string. Schema: `schemas/plugin-view.v1.schema.json`. A declarative workspace needs no `entrypoints.ui`.

Mobile: declarative workspaces appear on the paired phone when `ui.mobile` is granted. Iframe workspace items may add `"mobile": true`, only when `ui.mobile` is requested.

New `PLUGIN_HARD_LIMITS`: `fileReadMaxBytes` (1 MB), `fileWriteMaxBytes` (8 MB), `fileWriteCallsPerMinute` (60), `fileWriteBytesPerDay` (1 GB), `maxFileListEntries` (1000), `jobMinIntervalMinutes` (15), `jobMaxRunMs` (5 min), `playbackCallsPerMinute` (30), `audioEffectChangesPerSecond` (10), `viewRendersPerMinute` (60), `viewMaxBytes`, `viewMaxDepth`, `viewMaxNodes`, `viewMaxTableRows`, `mobileCallsPerMinute` (300), `changesRetentionDays` (90) and `changesMaxEntries` (5000).

`tape.wait(ms)` (since `0.4.0-beta.1`, no permission): the host pauses the handler for `ms` (0 to `waitMaxMs` = 10,000) without using the CPU budget, so workers can pace requests without spinning. Each plugin may wait at most `waitTotalMsPerMinute` (30,000) per rolling minute (`RateLimited` beyond that); invalid values reject with `InvalidArgument`. Waits still count toward handler and job wall-time limits.

### `0.4.0-beta.2`

- `organize.apply` and `organize.applyPlan` resolve to `OrganizeResult` (`{ changeId, runId, changeIds, moved }`). One call moves at most `min(organizeMaxMoves, changesPerMinute)` = 120 files; split bigger plans.
- `PluginViewCommandContext.surface` (`'desktop' | 'mobile'`) tells a view command where it is drawn.
- A `form` `submit` may set `confirm` (like `button.confirm`): the app asks first, and the host refuses an unconfirmed submit with `ConfirmationRequired`.
- `COMMAND_PATTERN` is exported: the host checks view action command ids with the same pattern (lowercase letters and digits, `.` and `-` inside, at most 64 characters).
- `PLUGIN_HARD_LIMITS` now also publishes `vaultMaxBytes`, `minFreeDiskBytes`, `changesPerMinute`, `organizeMaxMoves`, `jobRunsPerPluginPerCycle`, `jobHourlyRunBudgetMs`, `playbackToggleCooldownMs`, `maxPlaybackTracks`, `effectsMaxTotalBoostDb`, `effectsLimiterThresholdDb`, `effectsMaxRiseDbPerSecond`, `effectsCompressorThresholdDbMin/Max`, `effectsCompressorRatioMin/Max`, `viewStateMaxBytes`, `viewArgsMaxBytes` and `viewToastMaxChars`. The Desktop host reads these values from here.
