// Writes the machine-readable contract (JSON Schema and catalogs) from the compiled SDK.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXTENSION_POINT_CATALOG,
  PLUGIN_API_POLICY,
  PLUGIN_EVENT_NAMES,
  PLUGIN_EVENT_PERMISSIONS,
  PLUGIN_HARD_LIMITS,
  PLUGIN_HOST_GUARANTEES,
  PLUGIN_ICON_TOKENS,
  PLUGIN_MANIFEST_V2_JSON_SCHEMA,
  PLUGIN_PERMISSION_CATALOG,
  WORKER_API_PERMISSIONS,
} from '../dist/index.js';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'schemas');
mkdirSync(out, { recursive: true });
const write = (name, value) => writeFileSync(join(out, name), `${JSON.stringify(value, null, 2)}\n`);

write('plugin-manifest.v2.schema.json', PLUGIN_MANIFEST_V2_JSON_SCHEMA);
write('plugin-api.v2.json', {
  policy: PLUGIN_API_POLICY,
  permissions: PLUGIN_PERMISSION_CATALOG,
  extensionPoints: EXTENSION_POINT_CATALOG,
  iconTokens: PLUGIN_ICON_TOKENS,
  events: PLUGIN_EVENT_NAMES.map((name) => ({ name, permission: PLUGIN_EVENT_PERMISSIONS[name] })),
  workerApi: Object.entries(WORKER_API_PERMISSIONS).map(([method, permission]) => ({ method, permission })),
  hardLimits: PLUGIN_HARD_LIMITS,
  hostGuarantees: PLUGIN_HOST_GUARANTEES,
});
console.log(`schemas written to ${out}`);
