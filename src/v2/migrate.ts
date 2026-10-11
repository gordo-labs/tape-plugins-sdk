import type { PluginManifest } from '../index.js';
import type { PluginContributionItemV2, PluginContributionsV2, PluginManifestV2 } from './manifest.js';
import type { PluginPermissionV2 } from './permissions.js';

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
export function migrateManifestV1ToV2(v1: PluginManifest): ManifestMigrationResult {
  const warnings: string[] = [];
  const contributes: PluginContributionsV2 = {};
  const workspaceIdByRoute = new Map<string, string>();

  for (const workspace of v1.contributes?.workspaces ?? []) {
    push(contributes, 'workspace', { id: workspace.id, title: workspace.title });
    if (workspace.route) workspaceIdByRoute.set(workspace.route, workspace.id);
  }
  if (workspaceIdByRoute.size) warnings.push('v1 workspace routes are replaced by entrypoints.ui; add a UI document');

  const target = (item: { id: string; route?: string; targetWorkspaceRoute?: string }): string | undefined => {
    const route = item.targetWorkspaceRoute ?? item.route;
    const workspace = route ? workspaceIdByRoute.get(route) : undefined;
    if (!workspace) warnings.push(`${item.id} had no resolvable workspace target and was dropped`);
    return workspace;
  };

  for (const action of v1.contributes?.contextActions ?? []) {
    const workspace = target(action as { id: string; route?: string; targetWorkspaceRoute?: string });
    if (workspace) push(contributes, `contextMenu.${action.entity ?? 'track'}` as keyof PluginContributionsV2, { id: action.id, title: action.title, workspace });
  }
  for (const command of v1.contributes?.commands ?? []) {
    const workspace = target(command as { id: string; route?: string; targetWorkspaceRoute?: string });
    if (workspace) push(contributes, 'command', { id: command.id, title: command.title, workspace });
  }
  for (const tab of v1.contributes?.detailTabs ?? []) {
    push(contributes, `detail.section.${tab.entity ?? 'track'}` as keyof PluginContributionsV2, { id: tab.id, title: tab.title });
  }
  if (v1.contributes?.settings?.length) {
    warnings.push('v1 settings contributions need manifest.settings definitions; settings.section was not generated');
  }
  if (v1.contributes?.enrichmentProviders?.length || v1.contributes?.backgroundJobs?.length) {
    warnings.push('enrichmentProviders and backgroundJobs have no v2 contribution; use worker events and commands');
  }

  const permissions = v1.permissions.filter((permission) => {
    if (permission === 'network.connect') {
      warnings.push('network.connect is core-only in v2; community plugins use network.fetch with network.allow');
      return false;
    }
    return true;
  }) as PluginPermissionV2[];
  if (permissions.includes('network.fetch' as PluginPermissionV2)) {
    warnings.push('network.fetch now requires network.allow and dataDisclosure');
  }

  const manifest: PluginManifestV2 = {
    schemaVersion: 2,
    id: v1.id,
    name: v1.name,
    version: v1.version,
    description: v1.description,
    kind: 'plugin',
    tier: v1.tier,
    ...(v1.source ? { source: { license: v1.source.license, ...(v1.source.repository ? { repository: v1.source.repository } : {}) } } : {}),
    engines: {
      tape: v1.compatibility.musicHubDesktop,
      pluginApi: '2',
    },
    permissions,
    entrypoints: {
      ...(v1.entrypoints.worker ? { worker: v1.entrypoints.worker } : {}),
      ...(v1.entrypoints.ui ? { ui: v1.entrypoints.ui } : {}),
    },
    ...(Object.keys(contributes).length ? { contributes } : {}),
  };
  if (v1.tier !== 'core' && v1.tier !== 'local-dev') warnings.push('add manifest.publisher for third-party plugins');
  return { manifest, warnings };
}

function push(contributes: PluginContributionsV2, point: keyof PluginContributionsV2, item: PluginContributionItemV2): void {
  (contributes[point] ??= []).push(item);
}
