import { type ExtensionPointId, type PluginIconToken } from './extension-points.js';
import { type PluginPermissionV2 } from './permissions.js';
export type PluginKind = 'plugin' | 'theme' | 'module';
export type PluginTierV2 = 'core' | 'official' | 'verified' | 'community' | 'local-dev';
export type PluginActivation = 'onStartup' | `onCommand:${string}` | `onEvent:${string}` | `onView:${string}`;
export interface PluginContributionItemV2 {
    /** Stable slug, unique inside the plugin. */
    id: string;
    title: string;
    icon?: PluginIconToken;
    /** Worker command run when the item is used (declarative points). */
    command?: string;
    /** Workspace contribution id opened when the item is used (declarative points). */
    workspace?: string;
    /** Hash route inside `entrypoints.ui`, e.g. `#/lyrics` (iframe points). */
    view?: string;
}
export type PluginContributionsV2 = Partial<Record<ExtensionPointId, PluginContributionItemV2[]>>;
export type PluginSettingDefinition = {
    type: 'string';
    title: string;
    description?: string;
    default?: string;
    secret?: boolean;
    maxLength?: number;
} | {
    type: 'number';
    title: string;
    description?: string;
    default?: number;
    min?: number;
    max?: number;
} | {
    type: 'boolean';
    title: string;
    description?: string;
    default?: boolean;
} | {
    type: 'select';
    title: string;
    description?: string;
    default?: string;
    options: string[];
};
export interface PluginDataDisclosure {
    /** Domain listed in `network.allow`. */
    domain: string;
    /** What is sent, e.g. "Track title, artist and play time". */
    data: string;
    /** Why it is sent, e.g. "Scrobble to your Last.fm profile". */
    purpose: string;
}
export interface PluginManifestV2 {
    schemaVersion: 2;
    id: string;
    name: string;
    version: string;
    description: string;
    kind: PluginKind;
    tier: PluginTierV2;
    publisher?: {
        name: string;
        url?: string;
    };
    source?: {
        repository?: string;
        license: string;
    };
    engines: {
        /** Supported Tape Desktop versions, e.g. `>=0.6.0`. */
        tape: string;
        /** Plugin API major versions, e.g. `2`. */
        pluginApi: string;
    };
    permissions: PluginPermissionV2[];
    network?: {
        allow: string[];
    };
    dataDisclosure?: PluginDataDisclosure[];
    activation?: PluginActivation[];
    entrypoints: {
        /** JavaScript run in the isolated worker sandbox. */
        worker?: string;
        /** HTML document for iframe extension points. */
        ui?: string;
        /** Token theme JSON (`kind: "theme"`). */
        theme?: string;
    };
    contributes?: PluginContributionsV2;
    settings?: Record<string, PluginSettingDefinition>;
}
export interface ValidateManifestV2Options {
    /**
     * Developer mode: accept reserved permissions and extension points as
     * proposed APIs. Never set for catalog or sideloaded installs.
     */
    allowReserved?: boolean;
}
/** Validate a v2 manifest. Returns human-readable issues; empty means valid. */
export declare function validatePluginManifestV2(manifest: unknown, options?: ValidateManifestV2Options): string[];
export declare class PluginManifestV2ValidationError extends Error {
    readonly issues: string[];
    constructor(issues: string[]);
}
/** Validate and return a frozen deep copy. No plugin code runs. */
export declare function definePluginManifestV2(manifest: PluginManifestV2, options?: ValidateManifestV2Options): Readonly<PluginManifestV2>;
//# sourceMappingURL=manifest.d.ts.map