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
  PLUGIN_API_REVISION,
  PLUGIN_VIEW_LIMITS,
  COMMAND_PATTERN,
  getPluginPermission,
  validatePluginManifestV2,
  validatePluginViewTree,
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
  manifest.permissions.push('tags.write.propose');
  manifest.contributes['statusbar.item'] = [{ id: 'now', title: 'Now', command: 'scrobble-now' }];
  const issues = validatePluginManifestV2(manifest);
  assert.ok(issues.some((issue) => issue.includes('tags.write.propose is not available yet')));
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

const base = () => ({ ...scrobbler(), permissions: ['library.read', 'ui.contribute', 'ui.mobile'], network: undefined, dataDisclosure: undefined });
const clean = (m) => JSON.parse(JSON.stringify(m));

test('Plugin API 2.1 permissions are available with the contract risk', () => {
  const expected = {
    'library.files.read': 'high', 'library.files.write': 'high', 'library.organize.apply': 'high', 'metadata.apply': 'medium',
    'playlists.write': 'medium', 'jobs.schedule': 'medium', 'playback.control': 'medium', 'audio.analyze': 'low',
    'audio.process': 'high', 'ui.mobile': 'medium',
  };
  for (const [id, risk] of Object.entries(expected)) {
    const permission = getPluginPermission(id);
    assert.equal(permission.status, 'available', id);
    assert.equal(permission.risk, risk, id);
    assert.ok(permission.title && permission.description.endsWith('.'), id);
  }
  assert.equal(getPluginPermission('audio.process').developerOnly, true);
  assert.equal(PLUGIN_PERMISSION_CATALOG.filter((entry) => entry.developerOnly).length, 1);
  assert.equal(PLUGIN_API_REVISION, '2.1');
});

test('audio.process is accepted only in Developer mode; other 2.1 permissions need no flag', () => {
  const manifest = base();
  manifest.permissions.push('audio.process', 'playback.control', 'library.files.write');
  const issues = validatePluginManifestV2(clean(manifest));
  assert.deepEqual(issues, ['permission audio.process is available in Developer mode only']);
  assert.deepEqual(validatePluginManifestV2(clean(manifest), { allowReserved: true }), []);
});

test('worker API 2.1 methods map to their permissions; jobs need jobs.schedule', () => {
  assert.equal(WORKER_API_PERMISSIONS['jobs.register'], 'jobs.schedule');
  assert.equal(WORKER_API_PERMISSIONS['files.read'], 'library.files.read');
  assert.equal(WORKER_API_PERMISSIONS['files.trash'], 'library.files.write');
  assert.equal(WORKER_API_PERMISSIONS['organize.applyPlan'], 'library.organize.apply');
  assert.equal(WORKER_API_PERMISSIONS['metadata.apply'], 'metadata.apply');
  assert.equal(WORKER_API_PERMISSIONS['playlists.addTracks'], 'playlists.write');
  assert.equal(WORKER_API_PERMISSIONS['playback.seek'], 'playback.control');
  assert.equal(WORKER_API_PERMISSIONS['audio.setEffects'], 'audio.process');
  assert.equal(WORKER_API_PERMISSIONS['views.update'], 'ui.contribute');
  assert.equal(WORKER_API_PERMISSIONS['playback.getState'], 'playback.read');
});

test('new limits are published and existing keys stay', () => {
  assert.equal(PLUGIN_HARD_LIMITS.fileReadMaxBytes, 1024 * 1024);
  assert.equal(PLUGIN_HARD_LIMITS.fileWriteMaxBytes, 8 * 1024 * 1024);
  assert.equal(PLUGIN_HARD_LIMITS.fileWriteCallsPerMinute, 60);
  assert.equal(PLUGIN_HARD_LIMITS.fileWriteBytesPerDay, 1024 ** 3);
  assert.equal(PLUGIN_HARD_LIMITS.jobMinIntervalMinutes, 15);
  assert.equal(PLUGIN_HARD_LIMITS.jobMaxRunMs, 300_000);
  assert.equal(PLUGIN_HARD_LIMITS.playbackCallsPerMinute, 30);
  assert.equal(PLUGIN_HARD_LIMITS.audioEffectChangesPerSecond, 10);
  assert.equal(PLUGIN_HARD_LIMITS.viewRendersPerMinute, 60);
  assert.equal(PLUGIN_HARD_LIMITS.mobileCallsPerMinute, 300);
  assert.equal(PLUGIN_HARD_LIMITS.cpuBudgetMs, 15_000);
  assert.equal(PLUGIN_VIEW_LIMITS.maxDepth, 12);
});

test('workspace items: render and view are exclusive, render needs a worker, declarative needs no ui entrypoint', () => {
  const declarative = base();
  declarative.entrypoints = { worker: 'dist/worker.js' };
  declarative.contributes = { workspace: [{ id: 'home', title: 'Home', render: 'render-home' }], 'sidebar.item': [{ id: 'open', title: 'Home', workspace: 'home' }] };
  assert.deepEqual(validatePluginManifestV2(clean(declarative)), []);

  const both = clean(declarative);
  both.contributes.workspace[0].view = '#/home';
  assert.ok(validatePluginManifestV2(both).some((issue) => issue.includes('at most one of view and render')));

  const noWorker = clean(declarative);
  noWorker.entrypoints = { ui: 'ui/index.html' };
  assert.ok(validatePluginManifestV2(noWorker).some((issue) => issue.includes('render requires entrypoints.worker')));

  const badCommand = clean(declarative);
  badCommand.contributes.workspace[0].render = 'Render Home';
  assert.ok(validatePluginManifestV2(badCommand).some((issue) => issue.includes('render must be a command id')));

  const mixed = clean(declarative);
  mixed.contributes.workspace.push({ id: 'html', title: 'Html', view: '#/html' });
  assert.ok(validatePluginManifestV2(mixed).some((issue) => issue.includes('requires entrypoints.ui')));

  const elsewhere = clean(declarative);
  elsewhere.contributes['contextMenu.track'] = [{ id: 'x', title: 'X', command: 'x', render: 'y' }];
  assert.ok(validatePluginManifestV2(elsewhere).some((issue) => issue.includes('only for workspace items')));
});

test('mobile: true is for iframe workspace items and requires ui.mobile', () => {
  const manifest = base();
  manifest.contributes = { workspace: [{ id: 'home', title: 'Home', view: '#/home', mobile: true }] };
  assert.deepEqual(validatePluginManifestV2(clean(manifest)), []);

  const noPermission = clean(manifest);
  noPermission.permissions = ['library.read', 'ui.contribute'];
  assert.ok(validatePluginManifestV2(noPermission).some((issue) => issue.includes('require the ui.mobile permission')));

  const declarative = clean(manifest);
  declarative.entrypoints = { worker: 'dist/worker.js', ui: 'ui/index.html' };
  declarative.contributes.workspace[0] = { id: 'home', title: 'Home', render: 'render-home', mobile: true };
  assert.ok(validatePluginManifestV2(declarative).some((issue) => issue.includes('declarative views appear on mobile')));

  const wrongPoint = clean(manifest);
  wrongPoint.contributes['player.panel'] = [{ id: 'p', title: 'P', view: '#/p', mobile: true }];
  assert.ok(validatePluginManifestV2(wrongPoint).some((issue) => issue.includes('only for workspace items')));
});

test('manifest JSON Schema and catalog JSON know render, mobile and the view schema', () => {
  const schema = JSON.parse(readFileSync(new URL('../schemas/plugin-manifest.v2.schema.json', import.meta.url), 'utf8'));
  assert.ok(schema.properties.contributes.properties.workspace.items.properties.render);
  assert.ok(schema.properties.contributes.properties.workspace.items.properties.mobile);
  const view = JSON.parse(readFileSync(new URL('../schemas/plugin-view.v1.schema.json', import.meta.url), 'utf8'));
  assert.equal(view.$id, 'https://docs.tapemusicsuite.com/schemas/plugin-view.v1.schema.json');
  assert.equal(Object.keys(view.$defs).length, 13);
});

const validView = () => ({
  type: 'stack',
  gap: 'md',
  children: [
    { type: 'heading', value: 'Duplicates', level: 2 },
    { type: 'text', value: '12 groups found', tone: 'muted' },
    { type: 'image', albumId: 'album-1', size: 'md' },
    { type: 'section', title: 'Group', children: [{ type: 'badge', value: 'FLAC', tone: 'success' }, { type: 'progress', value: 0.5 }] },
    { type: 'list', items: [{ id: 'a', title: 'Song', subtitle: 'Artist', image: { trackId: 't1' }, badges: ['2 copies'], actions: [{ label: 'Trash', command: 'trash-copy', args: { trackId: 't1' }, tone: 'danger', confirm: 'Move to trash?' }] }] },
    { type: 'table', columns: [{ key: 'name', title: 'Name' }, { key: 'size', title: 'Size' }], rows: [{ name: 'a.flac', size: 10 }] },
    { type: 'button', label: 'Scan', command: 'scan', tone: 'primary' },
    { type: 'form', fields: [{ name: 'q', label: 'Query', type: 'text' }, { name: 'mode', label: 'Mode', type: 'select', options: [{ value: 'a', label: 'A' }] }, { name: 'on', label: 'On', type: 'toggle' }, { name: 'n', label: 'N', type: 'number', min: 1 }], submit: { command: 'search' } },
    { type: 'empty', title: 'Nothing here', message: 'Run a scan first.' },
  ],
});

test('a valid declarative view tree passes', () => {
  assert.deepEqual(validatePluginViewTree(validView()), []);
});

test('view trees: too deep, too many nodes, too big', () => {
  let deep = { type: 'text', value: 'x' };
  for (let i = 0; i < 12; i += 1) deep = { type: 'stack', children: [deep] };
  assert.ok(validatePluginViewTree(deep).some((issue) => issue.includes('deeper than 12')));
  let ok = { type: 'text', value: 'x' };
  for (let i = 0; i < 11; i += 1) ok = { type: 'stack', children: [ok] };
  assert.deepEqual(validatePluginViewTree(ok), []);

  const many = { type: 'stack', children: Array.from({ length: 2000 }, () => ({ type: 'text', value: 'x' })) };
  assert.ok(validatePluginViewTree(many).some((issue) => issue.includes('2001 nodes')));
  const exact = { type: 'stack', children: Array.from({ length: 1999 }, () => ({ type: 'text', value: 'x' })) };
  assert.deepEqual(validatePluginViewTree(exact), []);

  const big = { type: 'stack', children: Array.from({ length: 150 }, () => ({ type: 'text', value: 'x'.repeat(2000) })) };
  assert.ok(validatePluginViewTree(big).some((issue) => issue.includes('bytes')));
  const rows = { type: 'table', columns: [{ key: 'a', title: 'A' }], rows: Array.from({ length: 501 }, () => ({ a: 1 })) };
  assert.ok(validatePluginViewTree(rows).some((issue) => issue.includes('at most 500 rows')));
});

test('view trees never contain URLs; images are trackId or albumId only', () => {
  assert.ok(validatePluginViewTree({ type: 'image', url: 'https://example.com/a.png' }).some((issue) => issue.includes('no property "url"')));
  assert.ok(validatePluginViewTree({ type: 'image', src: 'data:image/png;base64,AAAA' }).length > 0);
  assert.ok(validatePluginViewTree({ type: 'image', trackId: 'https://example.com/a.png' }).some((issue) => issue.includes('URLs are not allowed')));
  assert.ok(validatePluginViewTree({ type: 'image', trackId: 't1', albumId: 'a1' }).some((issue) => issue.includes('exactly one')));
  assert.ok(validatePluginViewTree({ type: 'image' }).some((issue) => issue.includes('exactly one')));
  assert.ok(validatePluginViewTree({ type: 'text', value: 'see https://evil.example/x' }).some((issue) => issue.includes('URLs are not allowed')));
  assert.ok(validatePluginViewTree({ type: 'text', value: 'javascript:alert(1)' }).some((issue) => issue.includes('URLs are not allowed')));
  assert.ok(validatePluginViewTree({ type: 'button', label: 'Go', command: 'go', args: { next: { to: 'http://a.b/c' } } }).some((issue) => issue.includes('URLs are not allowed')));
  assert.ok(validatePluginViewTree({ type: 'table', columns: [{ key: 'a', title: 'A' }], rows: [{ a: 'https://x.y', type: 'z' }] }).some((issue) => issue.includes('URLs are not allowed') || issue.includes('short string')));
  assert.ok(validatePluginViewTree({ type: 'list', items: [{ id: 'a', title: 'T', image: { url: 'https://a.b/c.png' } }] }).length > 0);
});

test('view trees reject unknown node types, props and non-JSON data', () => {
  assert.ok(validatePluginViewTree({ type: 'iframe', value: 'x' }).some((issue) => issue.includes('unknown node type')));
  assert.ok(validatePluginViewTree({ type: 'stack', children: [{ type: 'script', code: 'x' }] }).some((issue) => issue.includes('unknown node type')));
  assert.ok(validatePluginViewTree({ type: 'text', value: 'x', style: 'color:red' }).some((issue) => issue.includes('no property "style"')));
  assert.ok(validatePluginViewTree({ type: 'button', label: 'Go', command: 'Not A Slug' }).some((issue) => issue.includes('command id')));
  assert.ok(validatePluginViewTree('text').some((issue) => issue.includes('must be an object')));
  assert.ok(validatePluginViewTree(undefined).length > 0);
  const cyclic = { type: 'stack', children: [] };
  cyclic.children.push(cyclic);
  assert.ok(validatePluginViewTree(cyclic).some((issue) => issue.includes('JSON')));
});

test('tape.wait is an ungated worker method with published limits', () => {
  assert.equal(WORKER_API_PERMISSIONS.wait, null);
  assert.equal(PLUGIN_HARD_LIMITS.waitMaxMs, 10_000);
  assert.equal(PLUGIN_HARD_LIMITS.waitTotalMsPerMinute, 30_000);
  const api = JSON.parse(readFileSync(new URL('../schemas/plugin-api.v2.json', import.meta.url), 'utf8'));
  assert.ok(api.workerApi.some((entry) => entry.method === 'wait' && entry.permission === null));
  assert.equal(api.hardLimits.waitMaxMs, 10_000);
});

test('limits enforced by the Hub are published', () => {
  assert.equal(PLUGIN_HARD_LIMITS.vaultMaxBytes, 2 * 1024 ** 3);
  assert.equal(PLUGIN_HARD_LIMITS.minFreeDiskBytes, 1024 ** 3);
  assert.equal(PLUGIN_HARD_LIMITS.changesPerMinute, 120);
  assert.equal(PLUGIN_HARD_LIMITS.organizeMaxMoves, 500);
  assert.equal(PLUGIN_HARD_LIMITS.jobRunsPerPluginPerCycle, 2);
  assert.equal(PLUGIN_HARD_LIMITS.jobHourlyRunBudgetMs, 600_000);
  assert.equal(PLUGIN_HARD_LIMITS.playbackToggleCooldownMs, 3_000);
  assert.equal(PLUGIN_HARD_LIMITS.effectsMaxTotalBoostDb, 12);
  assert.equal(PLUGIN_HARD_LIMITS.effectsLimiterThresholdDb, -1);
  assert.equal(PLUGIN_HARD_LIMITS.effectsMaxRiseDbPerSecond, 6);
  assert.equal(PLUGIN_HARD_LIMITS.viewStateMaxBytes, 64 * 1024);
  assert.equal(PLUGIN_HARD_LIMITS.viewArgsMaxBytes, 16 * 1024);
  assert.equal(PLUGIN_HARD_LIMITS.viewToastMaxChars, 200);
});

test('COMMAND_PATTERN is the one command id pattern: dotted ids pass, bad ones do not', () => {
  for (const id of ['plan', 'apply-plan', 'row.badge.bpm', 'a1', 'v2.0-x']) assert.ok(COMMAND_PATTERN.test(id), id);
  for (const id of ['', 'Plan', '.a', 'a.', '-a', 'a b', 'a_b']) assert.ok(!COMMAND_PATTERN.test(id), id);
  const tree = { type: 'form', fields: [{ name: 'q', label: 'Q', type: 'text' }], submit: { command: 'row.badge.x', confirm: 'Sure?' } };
  assert.deepEqual(validatePluginViewTree(tree), []);
  assert.ok(validatePluginViewTree({ ...tree, submit: { command: 'Bad' } }).length > 0);
  assert.ok(validatePluginViewTree({ ...tree, submit: { command: 'ok', confirm: '' } }).length > 0);
});
