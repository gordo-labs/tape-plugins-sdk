import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PLUGIN_API_VERSION,
  PluginManifestValidationError,
  definePluginManifest,
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
