/**
 * Public plugin manifest contract.
 *
 * This package deliberately has no dependency on the Music Hub Desktop runtime.
 * It only accepts JSON-serializable data and is safe to use in an independently
 * versioned plugin repository during build-time validation.
 */

export const PLUGIN_API_VERSION = '1' as const;

export type PluginTier = 'core' | 'official' | 'verified' | 'community' | 'local-dev';
export type PluginDistribution = 'preinstalled' | 'bundled' | 'sideloaded' | 'remote-registry';
export type PluginChannel = 'stable' | 'beta';
export type PluginPermission =
  | 'library.read'
  | 'library.metadata.read'
  | 'library.folders.read'
  | 'metadata.propose'
  | 'library.organize.propose'
  | 'playback.read'
  | 'network.connect'
  | 'network.fetch'
  | 'network.iroh:music-hub-network'
  | 'storage.private'
  | 'storage.addon:music-hub-network'
  | 'jobs.schedule'
  | 'ui.contribute'
  | 'diagnostics.write';

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
  entrypoints: { api?: string; worker?: string; ui?: string };
  isolation: { networkNamespace?: string; protocolAlpn?: string; storageScope?: string };
  compatibility: { musicHubDesktop: string; pluginApi: string };
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

export class PluginManifestValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid plugin manifest: ${issues.join('; ')}`);
    this.name = 'PluginManifestValidationError';
  }
}

const ID_PATTERN = /^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

/** Validate a manifest without loading plugin code or accessing host internals. */
export function validatePluginManifest(manifest: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(manifest)) return ['manifest must be a JSON object'];
  if (!isJsonSerializable(manifest)) issues.push('manifest must contain only JSON-serializable data');

  if (!ID_PATTERN.test(stringValue(manifest.id))) issues.push('manifest.id must be a lowercase stable slug');
  if (!isNonEmptyString(manifest.packageId)) issues.push('manifest.packageId is required');
  if (!isNonEmptyString(manifest.name)) issues.push('manifest.name is required');
  if (!SEMVER_PATTERN.test(stringValue(manifest.version))) issues.push('manifest.version must be semver');
  if (!['core', 'official', 'verified', 'community', 'local-dev'].includes(stringValue(manifest.tier))) issues.push('manifest.tier is not supported');
  if (!['preinstalled', 'bundled', 'sideloaded', 'remote-registry'].includes(stringValue(manifest.distribution))) issues.push('manifest.distribution is not supported');
  if (manifest.channel != null && !['stable', 'beta'].includes(stringValue(manifest.channel))) {
    issues.push('manifest.channel must be stable or beta when set');
  }
  if (!isRecord(manifest.compatibility)) {
    issues.push('manifest.compatibility is required');
  } else {
    if (!isCompatibilityRange(manifest.compatibility.musicHubDesktop)) issues.push('manifest.compatibility.musicHubDesktop must be a supported semver range');
    if (!isPluginApiRange(manifest.compatibility.pluginApi)) issues.push('manifest.compatibility.pluginApi must be one or more numeric API versions');
  }
  if (!Array.isArray(manifest.permissions) || !manifest.permissions.every(isNonEmptyString)) issues.push('manifest.permissions must be a string array');
  if (!isRecord(manifest.entrypoints)) issues.push('manifest.entrypoints is required');
  if (!isRecord(manifest.isolation)) issues.push('manifest.isolation is required');
  if (manifest.tier === 'community' && manifest.distribution === 'preinstalled') issues.push('community plugins cannot be preinstalled');
  return issues;
}

/**
 * Defines a validated, cloned manifest. The clone prevents a caller from
 * modifying the declaration after validation; no code from the plugin runs.
 */
export function definePluginManifest(manifest: PluginManifest): Readonly<PluginManifest> {
  const issues = validatePluginManifest(manifest);
  if (issues.length) throw new PluginManifestValidationError(issues);
  return deepFreeze(JSON.parse(JSON.stringify(manifest)) as PluginManifest);
}

/** Check host/plugin compatibility using only public version strings. */
export function validatePluginCompatibility(
  manifest: Pick<PluginManifest, 'compatibility'>,
  target: PluginCompatibilityTarget,
): string[] {
  const issues: string[] = [];
  if (!isRecord(manifest) || !isRecord(manifest.compatibility)) return ['manifest.compatibility is required'];
  if (!isNonEmptyString(target.musicHubDesktop) || !SEMVER_PATTERN.test(target.musicHubDesktop)) {
    issues.push('target.musicHubDesktop must be semver');
  }
  if (!isNonEmptyString(target.pluginApi)) issues.push('target.pluginApi is required');
  if (issues.length) return issues;

  const apiVersions = manifest.compatibility.pluginApi.split('||').map((value) => value.trim());
  if (!apiVersions.includes(target.pluginApi)) {
    issues.push(`manifest.compatibility.pluginApi does not include ${target.pluginApi}`);
  }
  if (!satisfiesDesktopRange(target.musicHubDesktop, manifest.compatibility.musicHubDesktop)) {
    issues.push(`manifest.compatibility.musicHubDesktop does not include ${target.musicHubDesktop}`);
  }
  return issues;
}

export function assertPluginCompatible(manifest: Pick<PluginManifest, 'compatibility'>, target: PluginCompatibilityTarget): void {
  const issues = validatePluginCompatibility(manifest, target);
  if (issues.length) throw new PluginManifestValidationError(issues);
}

function satisfiesDesktopRange(version: string, range: string): boolean {
  const clauses = range.split('||').map((value) => value.trim()).filter(Boolean);
  return clauses.some((clause) => clause.split(/\s+/).every((part) => satisfiesComparator(version, part)));
}

function isCompatibilityRange(value: unknown): value is string {
  return isNonEmptyString(value)
    && value.split('||').every((clause) => clause.trim().split(/\s+/).every((part) => /^(>=|<=|>|<|=)?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(part)));
}

function isPluginApiRange(value: unknown): value is string {
  return isNonEmptyString(value) && value.split('||').every((part) => /^\d+$/.test(part.trim()));
}

function satisfiesComparator(version: string, comparator: string): boolean {
  const match = /^(>=|<=|>|<|=)?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/.exec(comparator);
  if (!match) return false;
  const comparison = compareSemver(version, match[2]);
  switch (match[1] ?? '=') {
    case '>': return comparison > 0;
    case '>=': return comparison >= 0;
    case '<': return comparison < 0;
    case '<=': return comparison <= 0;
    default: return comparison === 0;
  }
}

function compareSemver(left: string, right: string): number {
  const [leftCore, leftPrerelease = ''] = left.split('-', 2);
  const [rightCore, rightPrerelease = ''] = right.split('-', 2);
  const coreComparison = leftCore.split('.').map(Number).findIndex((part, index) => part !== Number(rightCore.split('.')[index]));
  if (coreComparison !== -1) {
    return Number(leftCore.split('.')[coreComparison]) - Number(rightCore.split('.')[coreComparison]);
  }
  if (leftPrerelease === rightPrerelease) return 0;
  if (!leftPrerelease) return 1;
  if (!rightPrerelease) return -1;
  return leftPrerelease.localeCompare(rightPrerelease);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function isJsonSerializable(value: unknown): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonSerializable);
  return isRecord(value) && Object.values(value).every(isJsonSerializable);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}
