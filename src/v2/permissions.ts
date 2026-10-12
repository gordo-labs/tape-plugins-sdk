/**
 * Plugin API v2 permission catalog.
 *
 * `available` permissions can be requested by any community plugin. `reserved`
 * ones are part of the contract but the host rejects them until they ship;
 * Developer mode may enable them as proposed APIs. `core-only` permissions are
 * never delegated to third parties.
 */

export type PluginPermissionStatus = 'available' | 'reserved' | 'core-only';
export type PluginPermissionRisk = 'low' | 'medium' | 'high';

export interface PluginPermissionDefinition {
  id: string;
  /** Short label for consent screens. */
  title: string;
  /** What the user is agreeing to, in plain language. */
  description: string;
  risk: PluginPermissionRisk;
  status: PluginPermissionStatus;
}

export const PLUGIN_PERMISSION_CATALOG = [
  {
    id: 'library.read',
    title: 'Read your library',
    description: 'Search and list tracks and playlists. File locations are never shared.',
    risk: 'low',
    status: 'available',
  },
  {
    id: 'library.metadata.read',
    title: 'Read enriched metadata',
    description: 'Read label, BPM, musical key, MusicBrainz identifiers, AcoustID and enrichment status.',
    risk: 'low',
    status: 'available',
  },
  {
    id: 'library.folders.read',
    title: 'Read folder structure',
    description: 'See your library folders and where each file sits inside them, as paths relative to each folder.',
    risk: 'medium',
    status: 'available',
  },
  {
    id: 'metadata.propose',
    title: 'Suggest metadata changes',
    description: 'Suggest field changes. You review every suggestion; nothing changes until you accept it.',
    risk: 'low',
    status: 'available',
  },
  {
    id: 'library.organize.propose',
    title: 'Suggest file organization',
    description: 'Prepare a rename or move plan for you to review. The plugin cannot move or rename files.',
    risk: 'low',
    status: 'available',
  },
  {
    id: 'playback.read',
    title: 'See what is playing',
    description: 'Read the current track, queue and playback state, and be notified when playback changes.',
    risk: 'low',
    status: 'available',
  },
  {
    id: 'network.fetch',
    title: 'Connect to the internet',
    description: 'Make HTTPS requests to the domains listed in the manifest, and only those.',
    risk: 'high',
    status: 'available',
  },
  {
    id: 'storage.private',
    title: 'Store its own data',
    description: 'Keep settings and data in private storage that no other plugin can read.',
    risk: 'low',
    status: 'available',
  },
  {
    id: 'jobs.schedule',
    title: 'Run background tasks',
    description: 'Run tasks in the background within the limits Tape sets. They pause while Tape is busy.',
    risk: 'medium',
    status: 'reserved',
  },
  {
    id: 'ui.contribute',
    title: 'Add to the interface',
    description: 'Add menu items, panels, views and settings in the places listed in the manifest.',
    risk: 'low',
    status: 'available',
  },
  {
    id: 'notifications.show',
    title: 'Show notifications',
    description: 'Show short in-app notifications.',
    risk: 'low',
    status: 'available',
  },
  {
    id: 'diagnostics.write',
    title: 'Add to diagnostic reports',
    description: 'Include its own log lines in the diagnostic reports you export. Logs in the plugin console need no permission.',
    risk: 'low',
    status: 'reserved',
  },
  {
    id: 'metadata.apply',
    title: 'Apply approved metadata changes',
    description: 'Apply a batch of metadata changes you approved, with undo.',
    risk: 'medium',
    status: 'reserved',
  },
  {
    id: 'library.organize.apply',
    title: 'Apply an approved file plan',
    description: 'Ask Tape to rename or move files according to a plan you approved, with undo.',
    risk: 'high',
    status: 'reserved',
  },
  {
    id: 'tags.write.propose',
    title: 'Suggest tag writes',
    description: 'Suggest writing tags into audio files. You review every change.',
    risk: 'medium',
    status: 'reserved',
  },
  {
    id: 'playlists.write',
    title: 'Create and edit playlists',
    description: 'Create playlists and add tracks to playlists it created.',
    risk: 'medium',
    status: 'reserved',
  },
  {
    id: 'playback.control',
    title: 'Control playback',
    description: 'Play, pause, skip and queue tracks.',
    risk: 'medium',
    status: 'reserved',
  },
  {
    id: 'ui.theme',
    title: 'Change how Tape looks',
    description: 'Replace colors, typography and spacing with a theme.',
    risk: 'low',
    status: 'reserved',
  },
  {
    id: 'network.connect',
    title: 'Open network connections',
    description: 'Open direct network connections. Reserved for core add-ons.',
    risk: 'high',
    status: 'core-only',
  },
  {
    id: 'network.iroh:music-hub-network',
    title: 'Music Hub Network transport',
    description: 'Use the Music Hub Network Iroh namespace. Core add-on only.',
    risk: 'high',
    status: 'core-only',
  },
  {
    id: 'storage.addon:music-hub-network',
    title: 'Music Hub Network storage',
    description: 'Use the Music Hub Network storage scope. Core add-on only.',
    risk: 'medium',
    status: 'core-only',
  },
] as const satisfies readonly PluginPermissionDefinition[];

export type PluginPermissionV2 = (typeof PLUGIN_PERMISSION_CATALOG)[number]['id'];

const BY_ID = new Map<string, PluginPermissionDefinition>(PLUGIN_PERMISSION_CATALOG.map((entry) => [entry.id, entry]));

export function getPluginPermission(id: string): PluginPermissionDefinition | undefined {
  return BY_ID.get(id);
}

export function isPluginPermission(id: unknown): id is PluginPermissionV2 {
  return typeof id === 'string' && BY_ID.has(id);
}
