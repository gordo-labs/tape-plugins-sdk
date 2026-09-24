import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PLUGIN_API_VERSION,
  PluginManifestValidationError,
  definePluginManifest,
  validatePluginManifest,
  validatePluginCompatibility,
} from '../dist/index.js';

const manifest = {
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
};

test('exports the public API version and validates a manifest', () => {
  assert.equal(PLUGIN_API_VERSION, '1');
  const validated = definePluginManifest(manifest);
  assert.equal(validated.id, manifest.id);
  assert.equal(Object.isFrozen(validated), true);
});

test('rejects incompatible API targets', () => {
  assert.deepEqual(
    validatePluginCompatibility(manifest, { musicHubDesktop: '0.3.0', pluginApi: '2' }),
    ['manifest.compatibility.pluginApi does not include 2'],
  );
  assert.throws(
    () => definePluginManifest({ ...manifest, version: 'invalid' }),
    (error) => error instanceof PluginManifestValidationError,
  );
});

test('accepts a core wishlist workspace with host-owned sidebar navigation', () => {
  const wishlist = definePluginManifest({
    ...manifest,
    id: 'catalog-wishlist',
    packageId: '@gordo-labs/music-hub-catalog-wishlist',
    name: 'Wishlist',
    tier: 'core',
    distribution: 'preinstalled',
    permissions: ['library.metadata.read', 'network.fetch', 'storage.private', 'ui.contribute', 'wishlist.manage'],
    entrypoints: { api: '/api/plugin/catalog-wishlist', ui: 'core://catalog-wishlist/workspace' },
    contributes: {
      workspaces: [{
        id: 'wishlist',
        title: 'Wishlist',
        route: '/addons/catalog-wishlist',
        navigation: { placement: 'sidebar', section: 'library', icon: 'wishlist' },
      }],
    },
  });

  assert.equal(wishlist.permissions.includes('wishlist.manage'), true);
  assert.deepEqual(wishlist.contributes?.workspaces?.[0]?.navigation, {
    placement: 'sidebar', section: 'library', icon: 'wishlist',
  });
});

test('rejects arbitrary workspace navigation values and unsafe workspace routes', () => {
  const issues = validatePluginManifest({
    ...manifest,
    contributes: {
      workspaces: [{
        id: 'wishlist',
        title: 'Wishlist',
        route: '/addons/../catalog-wishlist',
        navigation: { placement: 'header', section: 'catalog', icon: '<svg />' },
      }],
    },
  });

  assert.deepEqual(issues, [
    'manifest.contributes.workspaces[0].route must be a safe absolute route',
    'manifest.contributes.workspaces[0].navigation.placement must be sidebar',
    'manifest.contributes.workspaces[0].navigation.section must be library or system',
    'manifest.contributes.workspaces[0].navigation.icon must be a known icon token',
  ]);
});

test('rejects unsupported permissions and UI contributions without ui.contribute', () => {
  assert.deepEqual(
    validatePluginManifest({ ...manifest, permissions: ['library.metadata.read', 'wishlist.read'] }),
    ['unsupported plugin permission: wishlist.read'],
  );
  assert.deepEqual(
    validatePluginManifest({
      ...manifest,
      permissions: ['library.metadata.read'],
      contributes: { workspaces: [{ id: 'wishlist', title: 'Wishlist', route: '/addons/catalog-wishlist' }] },
    }),
    ['ui.contribute is required for UI contributions'],
  );
});
