import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  EXTENSION_POINT_CATALOG,
  NETWORK_PUBLIC_SUFFIXES,
  PLUGIN_HARD_LIMITS,
  PLUGIN_HOST_GUARANTEES,
  PLUGIN_EVENT_NAMES,
  PLUGIN_EVENT_PERMISSIONS,
  PLUGIN_PERMISSION_CATALOG,
  PluginManifestV2ValidationError,
  WORKER_API_PERMISSIONS,
  definePluginManifestV2,
  migrateManifestV1ToV2,
  validatePluginManifestV2,
} from '../dist/index.js';

const scrobbler = () => ({
  schemaVersion: 2,
  id: 'lastfm-scrobbler',
  name: 'Last.fm Scrobbler',
  version: '1.0.0',
  description: 'Scrobbles what you play to Last.fm.',
  kind: 'plugin',
  tier: 'community',
  publisher: { name: 'Example Dev', url: 'https://example.com' },
  source: { repository: 'https://github.com/example/tape-lastfm', license: 'MIT' },
  engines: { tape: '>=0.6.0', pluginApi: '2' },
  permissions: ['library.read', 'playback.read', 'network.fetch', 'storage.private', 'ui.contribute', 'notifications.show'],
  network: { allow: ['ws.audioscrobbler.com'] },
  dataDisclosure: [{ domain: 'ws.audioscrobbler.com', data: 'Track title, artist, album and play time', purpose: 'Scrobble to your Last.fm profile' }],
  activation: ['onEvent:playback.started', 'onCommand:scrobble-now'],
  entrypoints: { worker: 'dist/worker.js', ui: 'ui/index.html' },
  contributes: {
    workspace: [{ id: 'history', title: 'Scrobbles' }],
    'sidebar.item': [{ id: 'open-history', title: 'Last.fm', icon: 'music', workspace: 'history' }],
    'contextMenu.track': [{ id: 'scrobble', title: 'Scrobble now', command: 'scrobble-now' }],
    'settings.section': [{ id: 'account', title: 'Last.fm account' }],
  },
  settings: {
    username: { type: 'string', title: 'Username' },
    sessionKey: { type: 'string', title: 'Session key', secret: true },
    minPercent: { type: 'number', title: 'Scrobble after %', default: 50, min: 10, max: 100 },
  },
});

test('a complete community scrobbler manifest is valid', () => {
  assert.deepEqual(validatePluginManifestV2(scrobbler()), []);
  const frozen = definePluginManifestV2(scrobbler());
  assert.ok(Object.isFrozen(frozen.contributes));
});

test('community plugins must name a publisher and a public https repository', () => {
  const manifest = scrobbler();
  delete manifest.publisher;
  manifest.source = { license: 'MIT', repository: 'http://github.com/example/x' };
  const issues = validatePluginManifestV2(manifest);
  assert.ok(issues.some((issue) => issue.includes('publisher.name')));
  assert.ok(issues.some((issue) => issue.includes('public repository')));
});

test('network access needs an allowlist of public domains and a data disclosure for each', () => {
  const noAllow = scrobbler();
  delete noAllow.network;
  delete noAllow.dataDisclosure;
  assert.ok(validatePluginManifestV2(noAllow).some((issue) => issue.includes('network.allow')));

  for (const host of ['localhost', '127.0.0.1', 'nas.local', 'router.lan', '*.com', 'Example.com', 'https://a.com', 'printer.home.arpa']) {
    const manifest = scrobbler();
    manifest.network.allow = [host];
    manifest.dataDisclosure = [{ domain: host, data: 'x', purpose: 'y' }];
    assert.ok(validatePluginManifestV2(manifest).some((issue) => issue.includes('not allowed')), host);
  }

  const wildcard = scrobbler();
  wildcard.network.allow = ['*.discogs.com'];
  wildcard.dataDisclosure = [{ domain: '*.discogs.com', data: 'Search terms', purpose: 'Look up releases' }];
  assert.deepEqual(validatePluginManifestV2(wildcard), []);

  const undisclosed = scrobbler();
  undisclosed.network.allow.push('api.example.org');
  assert.ok(validatePluginManifestV2(undisclosed).some((issue) => issue.includes('missing network domain api.example.org')));
});

test('network.allow wildcards over public or shared-hosting suffixes are refused; exact hosts and deeper wildcards are fine', () => {
  const check = (host) => {
    const manifest = scrobbler();
    manifest.network.allow = [host];
    manifest.dataDisclosure = [{ domain: host, data: 'x', purpose: 'y' }];
    return validatePluginManifestV2(manifest);
  };
  for (const suffix of NETWORK_PUBLIC_SUFFIXES) {
    assert.ok(check(`*.${suffix}`).some((issue) => issue.includes('not allowed')), `*.${suffix}`);
    assert.deepEqual(check(`*.api.${suffix}`).filter((issue) => issue.includes('not allowed')), [], `*.api.${suffix}`);
    assert.deepEqual(check(`example.${suffix}`).filter((issue) => issue.includes('not allowed')), [], `example.${suffix}`);
  }
  assert.ok(check('*.com').some((issue) => issue.includes('not allowed')));
  assert.deepEqual(check('*.discogs.com'), []);
  assert.ok(NETWORK_PUBLIC_SUFFIXES.includes('co.uk') && NETWORK_PUBLIC_SUFFIXES.includes('herokuapp.com') && NETWORK_PUBLIC_SUFFIXES.includes('s3.amazonaws.com'));
});

test('the published limits include the host-side protections', () => {
  assert.deepEqual(
    Object.fromEntries(['cpuBudgetMs', 'cpuWindowMs', 'rejectedReplyDelayMs', 'maxPendingRefusals', 'maxConcurrentPageCalls', 'maxPlaylists', 'maxPlaylistTrackIds', 'badgeCommandBudgetMs', 'notificationsPerMinute'].map((key) => [key, PLUGIN_HARD_LIMITS[key]])),
    { cpuBudgetMs: 15_000, cpuWindowMs: 60_000, rejectedReplyDelayMs: 250, maxPendingRefusals: 1_000, maxConcurrentPageCalls: 4, maxPlaylists: 1_000, maxPlaylistTrackIds: 5_000, badgeCommandBudgetMs: 1_500, notificationsPerMinute: 6 },
  );
  // Existing keys keep their meaning.
  assert.equal(PLUGIN_HARD_LIMITS.hostCallsPerMinute, 600);
  assert.equal(PLUGIN_HARD_LIMITS.maxPageSize, 200);
  assert.deepEqual(PLUGIN_HOST_GUARANTEES, { cursors: 'signed-per-process', notificationBudget: 'shared-by-worker-and-pages' });
  const published = JSON.parse(readFileSync(new URL('../schemas/plugin-api.v2.json', import.meta.url), 'utf8'));
  assert.equal(published.hardLimits.cpuBudgetMs, 15_000);
  assert.equal(published.hostGuarantees.cursors, 'signed-per-process');
});

test('reserved permissions and extension points are proposed APIs, accepted only in Developer mode', () => {
  const manifest = scrobbler();
  manifest.permissions.push('playback.control');
  manifest.contributes['statusbar.item'] = [{ id: 'now', title: 'Now', command: 'scrobble-now' }];
  const issues = validatePluginManifestV2(manifest);
  assert.ok(issues.some((issue) => issue.includes('playback.control is not available yet')));
  assert.ok(issues.some((issue) => issue.includes('statusbar.item is not available yet')));
  assert.deepEqual(validatePluginManifestV2(manifest, { allowReserved: true }), []);
});

test('core-only permissions are never granted to third parties', () => {
  const manifest = scrobbler();
  manifest.permissions.push('network.connect');
  assert.ok(validatePluginManifestV2(manifest, { allowReserved: true }).some((issue) => issue.includes('reserved for core')));
});

test('contributions follow the extension point rules', () => {
  const cases = [
    [(m) => { m.permissions = m.permissions.filter((p) => p !== 'ui.contribute'); }, 'ui.contribute is required'],
    [(m) => { m.contributes['contextMenu.track'][0].workspace = 'history'; }, 'exactly one of command or workspace'],
    [(m) => { m.contributes['sidebar.item'][0].workspace = 'missing'; }, 'is not declared in contributes.workspace'],
    [(m) => { delete m.entrypoints.ui; }, 'requires entrypoints.ui'],
    [(m) => { delete m.entrypoints.worker; }, 'requires entrypoints.worker'],
    [(m) => { m.contributes['nope.point'] = []; }, 'unknown extension point'],
    [(m) => { m.contributes.workspace[0].view = '../x'; }, 'hash route'],
    [(m) => { m.contributes['contextMenu.track'][0].icon = 'skull'; }, 'unknown icon token'],
    [(m) => { m.contributes.command = Array.from({ length: 11 }, (_, i) => ({ id: `c${i}`, title: 'C', command: 'scrobble-now' })); }, 'at most 10 items'],
    [(m) => { delete m.settings; }, 'settings.section requires manifest.settings'],
  ];
  for (const [mutate, expected] of cases) {
    const manifest = scrobbler();
    mutate(manifest);
    const issues = validatePluginManifestV2(manifest);
    assert.ok(issues.some((issue) => issue.includes(expected)), `${expected}: ${issues.join(' | ')}`);
  }
});

test('entrypoints stay inside the bundle and activation names known triggers', () => {
  for (const path of ['/abs.js', '../up.js', 'a/../b.js', 'C:\\x.js', 'https://cdn/x.js']) {
    const manifest = scrobbler();
    manifest.entrypoints.worker = path;
    assert.ok(validatePluginManifestV2(manifest).some((issue) => issue.includes('entrypoints.worker')), path);
  }
  const manifest = scrobbler();
  manifest.activation = ['onEvent:scan.everything'];
  assert.ok(validatePluginManifestV2(manifest).some((issue) => issue.includes('invalid activation')));
});

test('themes and modules are gated by kind', () => {
  const theme = scrobbler();
  theme.kind = 'theme';
  assert.ok(validatePluginManifestV2(theme).some((issue) => issue.includes('entrypoints.theme')));
  const module = scrobbler();
  module.kind = 'module';
  assert.ok(validatePluginManifestV2(module).some((issue) => issue.includes('reserved for core')));
});

const themePlugin = () => {
  const { network, dataDisclosure, activation, settings, contributes, ...base } = scrobbler();
  return { ...base, id: 'midnight-theme', kind: 'theme', permissions: ['ui.theme'], entrypoints: { theme: 'theme.json' } };
};

test('ui.theme is available with consent text', () => {
  const permission = PLUGIN_PERMISSION_CATALOG.find((entry) => entry.id === 'ui.theme');
  assert.equal(permission.status, 'available');
  assert.equal(permission.risk, 'low');
  assert.equal(permission.title, 'Add a theme');
  assert.equal(permission.description, "Adds a color theme you can choose in Settings \u2192 Appearance. It can't read your library or run code.");
});

test('a theme plugin needs only entrypoints.theme and ui.theme', () => {
  assert.deepEqual(validatePluginManifestV2(themePlugin()), []);
  const noPermission = themePlugin();
  noPermission.permissions = [];
  assert.ok(validatePluginManifestV2(noPermission).some((issue) => issue.includes('ui.theme')));
  const notJson = themePlugin();
  notJson.entrypoints = { theme: 'theme.css' };
  assert.ok(validatePluginManifestV2(notJson).some((issue) => issue.includes('.json')));
  const traversal = themePlugin();
  traversal.entrypoints = { theme: '../theme.json' };
  assert.ok(validatePluginManifestV2(traversal).some((issue) => issue.includes('relative path')));
});

test('a plugin may also ship a theme', () => {
  const manifest = scrobbler();
  manifest.permissions = [...manifest.permissions, 'ui.theme'];
  manifest.entrypoints = { ...manifest.entrypoints, theme: 'themes/dark.json' };
  assert.deepEqual(validatePluginManifestV2(manifest), []);
  manifest.permissions = manifest.permissions.filter((id) => id !== 'ui.theme');
  assert.ok(validatePluginManifestV2(manifest).some((issue) => issue.includes('ui.theme')));
  const core = scrobbler();
  core.kind = 'module';
  core.tier = 'core';
  core.permissions = ['ui.theme'];
  core.entrypoints = { theme: 'theme.json' };
  assert.ok(validatePluginManifestV2(core).some((issue) => issue.includes('kind "module"')));
});

test('engines must include Plugin API 2', () => {
  const manifest = scrobbler();
  manifest.engines.pluginApi = '1';
  assert.throws(() => definePluginManifestV2(manifest), PluginManifestV2ValidationError);
});

test('v1 manifests migrate to v2 with explicit warnings', () => {
  const { manifest, warnings } = migrateManifestV1ToV2({
    id: 'notes', packageId: '@x/notes', name: 'Notes', version: '0.1.0', tier: 'community', distribution: 'sideloaded',
    description: 'Notes', statement: 'Notes', source: { visibility: 'open-source', license: 'MIT', repository: 'https://github.com/x/notes' },
    defaultEnabled: false, permissions: ['library.read', 'ui.contribute', 'network.connect'], capabilities: [],
    entrypoints: { worker: 'dist/plugin.js', ui: 'ui/index.html' }, isolation: {},
    compatibility: { musicHubDesktop: '>=0.4.0', pluginApi: '1' },
    contributes: {
      workspaces: [{ id: 'notes', title: 'Notes', route: '/addons/notes' }],
      contextActions: [{ id: 'open-notes', title: 'Open notes', entity: 'track', targetWorkspaceRoute: '/addons/notes' }],
    },
  });
  assert.equal(manifest.schemaVersion, 2);
  assert.deepEqual(manifest.permissions, ['library.read', 'ui.contribute']);
  assert.deepEqual(manifest.contributes['contextMenu.track'], [{ id: 'open-notes', title: 'Open notes', workspace: 'notes' }]);
  assert.ok(warnings.some((warning) => warning.includes('network.connect')));
  assert.ok(warnings.some((warning) => warning.includes('publisher')));
});

test('catalogs are consistent with each other and with the published JSON files', () => {
  const permissionIds = new Set(PLUGIN_PERMISSION_CATALOG.map((entry) => entry.id));
  for (const permission of Object.values(WORKER_API_PERMISSIONS)) {
    if (permission !== null) assert.ok(permissionIds.has(permission), permission);
  }
  for (const event of PLUGIN_EVENT_NAMES) assert.ok(permissionIds.has(PLUGIN_EVENT_PERMISSIONS[event]), event);

  const schema = JSON.parse(readFileSync(new URL('../schemas/plugin-manifest.v2.schema.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(schema.properties.contributes.properties), EXTENSION_POINT_CATALOG.map((point) => point.id));
  const api = JSON.parse(readFileSync(new URL('../schemas/plugin-api.v2.json', import.meta.url), 'utf8'));
  assert.equal(api.permissions.length, PLUGIN_PERMISSION_CATALOG.length);
});

test('entity lookups for command context ids are part of the worker API under library.read', () => {
  for (const method of ['library.getAlbum', 'library.getArtist', 'library.getLabel']) {
    assert.equal(WORKER_API_PERMISSIONS[method], 'library.read', method);
  }
  const api = JSON.parse(readFileSync(new URL('../schemas/plugin-api.v2.json', import.meta.url), 'utf8'));
  assert.deepEqual(
    api.workerApi.map((entry) => entry.method),
    Object.keys(WORKER_API_PERMISSIONS),
  );
  assert.ok(api.workerApi.some((entry) => entry.method === 'library.getLabel' && entry.permission === 'library.read'));
});
