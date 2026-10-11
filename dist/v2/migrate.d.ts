import type { PluginManifest } from '../index.js';
import type { PluginManifestV2 } from './manifest.js';
export interface ManifestMigrationResult {
    manifest: PluginManifestV2;
    /** Things that could not be carried over and need the author's attention. */
    warnings: string[];
}
/**
 * Convert a Plugin API v1 manifest into the v2 shape. The result still has
 * to pass `validatePluginManifestV2`: v1 had no publisher, data disclosure or
 * network allowlist, so a v1 plugin using the network needs those added.
 */
export declare function migrateManifestV1ToV2(v1: PluginManifest): ManifestMigrationResult;
//# sourceMappingURL=migrate.d.ts.map