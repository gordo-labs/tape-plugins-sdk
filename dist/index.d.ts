/**
 * Public plugin manifest contract.
 *
 * This package deliberately has no dependency on the Music Hub Desktop runtime.
 * It only accepts JSON-serializable data and is safe to use in an independently
 * versioned plugin repository during build-time validation.
 */
export declare const PLUGIN_API_VERSION: "1";
export type PluginTier = 'core' | 'official' | 'verified' | 'community' | 'local-dev';
export type PluginDistribution = 'preinstalled' | 'bundled' | 'sideloaded' | 'remote-registry';
export type PluginChannel = 'stable' | 'beta';
export type PluginPermission = 'library.read' | 'library.metadata.read' | 'metadata.propose' | 'playback.read' | 'network.connect' | 'network.fetch' | 'network.iroh:music-hub-network' | 'storage.private' | 'storage.addon:music-hub-network' | 'jobs.schedule' | 'ui.contribute' | 'diagnostics.write';
export interface PluginContribution {
    id: string;
    title: string;
    route?: string;
    entity?: 'track' | 'album' | 'artist' | 'playlist';
}
export interface PluginManifest {
    id: string;
    packageId: string;
    name: string;
    version: string;
    tier: PluginTier;
    distribution: PluginDistribution;
    /** Optional maturity channel. Defaults to stable when omitted. */
    channel?: PluginChannel;
    description: string;
    statement: string;
    source: {
        visibility: 'private' | 'public' | 'open-source';
        license: string;
        repository?: string;
        directory?: string;
        packageManager?: 'npm' | 'pnpm' | 'yarn' | 'none';
    };
    defaultEnabled: boolean;
    permissions: PluginPermission[];
    capabilities: Array<{
        id: string;
        title: string;
        description: string;
        status: 'available' | 'planned';
    }>;
    entrypoints: {
        api?: string;
        worker?: string;
        ui?: string;
    };
    isolation: {
        networkNamespace?: string;
        protocolAlpn?: string;
        storageScope?: string;
    };
    compatibility: {
        musicHubDesktop: string;
        pluginApi: string;
    };
    contributes?: {
        workspaces?: PluginContribution[];
        detailTabs?: PluginContribution[];
        contextActions?: PluginContribution[];
        commands?: PluginContribution[];
        settings?: PluginContribution[];
        enrichmentProviders?: PluginContribution[];
        backgroundJobs?: PluginContribution[];
    };
}
export interface PluginCompatibilityTarget {
    musicHubDesktop: string;
    pluginApi: string;
}
export declare class PluginManifestValidationError extends Error {
    readonly issues: string[];
    constructor(issues: string[]);
}
/** Validate a manifest without loading plugin code or accessing host internals. */
export declare function validatePluginManifest(manifest: unknown): string[];
/**
 * Defines a validated, cloned manifest. The clone prevents a caller from
 * modifying the declaration after validation; no code from the plugin runs.
 */
export declare function definePluginManifest(manifest: PluginManifest): Readonly<PluginManifest>;
/** Check host/plugin compatibility using only public version strings. */
export declare function validatePluginCompatibility(manifest: Pick<PluginManifest, 'compatibility'>, target: PluginCompatibilityTarget): string[];
export declare function assertPluginCompatible(manifest: Pick<PluginManifest, 'compatibility'>, target: PluginCompatibilityTarget): void;
//# sourceMappingURL=index.d.ts.map