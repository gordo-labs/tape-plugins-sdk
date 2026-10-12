/**
 * The `tape` global available to a plugin worker (`entrypoints.worker`).
 *
 * A worker is plain JavaScript (ES2023, no imports, no Node, no DOM) that runs
 * inside an isolated sandbox on the Hub. It has no filesystem, network,
 * process or timer access of its own; everything goes through `tape`, and
 * each call is checked against the permissions the user granted. Every call
 * returns a Promise. A call without its permission rejects with
 * `PermissionDenied`; a call made while Tape is busy may reject with `Busy`.
 *
 * Bundle your code (and any dependencies) into one file. Example:
 *
 * ```js
 * tape.commands.register('scrobble-now', async ({ trackId }) => {
 *   const track = await tape.library.getTrack(trackId);
 *   await tape.net.fetch('https://ws.audioscrobbler.com/2.0/', { method: 'POST', body: '...' });
 * });
 * tape.events.on('playback.started', async ({ trackId }) => { ... });
 * ```
 */

/** Events a worker can subscribe to. Each requires the permission noted. */
export const PLUGIN_EVENT_NAMES = [
  /** `library.read`. A track was added by a scan. */
  'track.added',
  /** `library.read`. Track metadata changed. */
  'track.updated',
  /** `library.read`. A track was removed from the library. */
  'track.deleted',
  /** `library.metadata.read`. Enrichment finished for a track. */
  'enrichment.done',
  /** `playback.read`. A track has really started playing. */
  'playback.started',
] as const;

export type PluginEventName = (typeof PLUGIN_EVENT_NAMES)[number];

export interface PluginEventPayloads {
  'track.added': { trackId: string };
  'track.updated': { trackId: string };
  'track.deleted': { trackId: string };
  'enrichment.done': { trackId: string };
  'playback.started': { trackId: string };
}

/** Error codes a host call can reject with (`error.code`). */
export type PluginHostErrorCode =
  | 'PermissionDenied'
  | 'Busy'
  | 'RateLimited'
  | 'NotFound'
  | 'InvalidArgument'
  | 'Timeout'
  | 'QuotaExceeded'
  | 'NetworkDenied'
  | 'Unavailable';

/** Location of a file inside one of the user's library folders. Requires `library.folders.read`. */
export interface PluginFileLocation {
  /** Index into `tape.library.listFolders()`. */
  folderIndex: number;
  /** Path relative to that folder, using `/`. */
  relativePath: string;
}

export interface PluginTrack {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  albumArtist: string | null;
  year: number | null;
  trackNumber: number | null;
  discNumber: number | null;
  duration: number | null;
  genres: string[];
  tags: string[];
  format: string | null;
  bitrate: number | null;
  sampleRate: number | null;
  bitDepth: number | null;
  rating: number | null;
  playCount: number | null;
  lastPlayed: string | null;
  dateAdded: string | null;
  fileAvailable: boolean | null;
  /** Present with `library.metadata.read`. */
  metadata?: {
    label: string | null;
    bpm: number | null;
    musicalKey: string | null;
    musicbrainzRecordingId: string | null;
    musicbrainzReleaseId: string | null;
    musicbrainzReleaseGroupId: string | null;
    musicbrainzArtistId: string | null;
    acoustid: string | null;
    enrichmentStatus: string | null;
  };
  /** Present with `library.folders.read`. */
  location?: PluginFileLocation | null;
}

export interface PluginPlaylist {
  id: string;
  name: string;
  trackCount: number;
  duration: number;
}

export interface PluginPage<T> {
  items: T[];
  /** Pass to the next call to continue; `null` when there is nothing more. */
  nextCursor: string | null;
}

export interface PluginMetadataProposalInput {
  trackId: string;
  /** Fields Tape can apply with undo. `year` is a four-digit number; `genre` replaces the track's genre. */
  fields: Partial<Record<'title' | 'artist' | 'album' | 'year' | 'genre', string | number | null>>;
  /** 0..1 */
  confidence: number;
  /** Short human-readable reasons or source links, at most 20. */
  evidence: string[];
}

export interface PluginOrganizePlanInput {
  title: string;
  moves: Array<{ trackId: string; to: PluginFileLocation }>;
}

export interface PluginFetchInit {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  /** Text body. Encode JSON yourself. */
  body?: string;
}

export interface PluginFetchResponse {
  status: number;
  headers: Record<string, string>;
  /** Response body as text, truncated at the host limit. */
  text: string;
}

export interface TapeWorkerApi {
  readonly plugin: { readonly id: string; readonly version: string };

  readonly library: {
    /** `library.read` */
    getTrack(trackId: string): Promise<PluginTrack | null>;
    /** `library.read`. At most the host page size per call. */
    getTracks(trackIds: string[]): Promise<PluginTrack[]>;
    /** `library.read`. Paginated listing; `query` searches title, artist and album. */
    listTracks(options?: { query?: string; limit?: number; cursor?: string | null }): Promise<PluginPage<PluginTrack>>;
    /** `library.read` */
    listPlaylists(): Promise<PluginPlaylist[]>;
    /** `library.read`. Track ids in order. */
    getPlaylistTrackIds(playlistId: string): Promise<string[]>;
    /** `library.folders.read`. Folder display names only, in index order. */
    listFolders(): Promise<Array<{ index: number; name: string }>>;
  };

  readonly metadata: {
    /** `metadata.propose`. The user reviews the proposal; nothing changes until they accept. */
    propose(input: PluginMetadataProposalInput): Promise<{ proposalId: string }>;
  };

  readonly organize: {
    /** `library.organize.propose`. Shows the plan to the user. The plugin cannot apply it. */
    proposePlan(plan: PluginOrganizePlanInput): Promise<{ planId: string }>;
  };

  readonly playback: {
    /** `playback.read` */
    getState(): Promise<{ trackId: string | null }>;
  };

  readonly events: {
    /** Subscribe to a host event. Handlers must finish within the handler timeout. */
    on<E extends PluginEventName>(event: E, handler: (payload: PluginEventPayloads[E]) => void | Promise<void>): void;
  };

  readonly commands: {
    /**
     * Register the handler for a command named in the manifest contributions.
     * The host passes the entity id(s) of where it was invoked from, and for
     * `row.badge.track` expects `{ text }` (at most 12 characters) or `null`.
     */
    register(commandId: string, handler: (context: { trackId?: string; albumId?: string; artistId?: string; labelId?: string; playlistId?: string; folderIndex?: number; trackIds?: string[] }) => unknown): void;
  };

  readonly net: {
    /** `network.fetch`. Only https URLs on hosts in `manifest.network.allow`. */
    fetch(url: string, init?: PluginFetchInit): Promise<PluginFetchResponse>;
  };

  readonly storage: {
    /** `storage.private` */
    get(key: string): Promise<unknown>;
    set(key: string, value: unknown): Promise<void>;
    delete(key: string): Promise<void>;
    keys(): Promise<string[]>;
  };

  readonly settings: {
    /** Values the user set for `manifest.settings` (defaults applied). */
    get(): Promise<Record<string, string | number | boolean>>;
  };

  readonly notifications: {
    /** `notifications.show` */
    show(message: string, options?: { kind?: 'info' | 'success' | 'warning' }): Promise<void>;
  };

  readonly log: {
    /** Lines for the plugin console. No permission needed; rate limited by the host. */
    info(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, data?: unknown): void;
  };

  readonly lifecycle: {
    /** First install. Set up your own storage. */
    onInstall(handler: () => void | Promise<void>): void;
    /** After an update. Migrate your own storage from `fromVersion`. */
    onUpdate(handler: (context: { fromVersion: string }) => void | Promise<void>): void;
    /** Before uninstall. Clean up remote state you own; local storage is removed by Tape if the user asks. */
    onUninstall(handler: () => void | Promise<void>): void;
  };
}

/** Methods (`namespace.method`) the worker bridge exposes, with the permission each needs. */
export const WORKER_API_PERMISSIONS = {
  'library.getTrack': 'library.read',
  'library.getTracks': 'library.read',
  'library.listTracks': 'library.read',
  'library.listPlaylists': 'library.read',
  'library.getPlaylistTrackIds': 'library.read',
  'library.listFolders': 'library.folders.read',
  'metadata.propose': 'metadata.propose',
  'organize.proposePlan': 'library.organize.propose',
  'playback.getState': 'playback.read',
  'net.fetch': 'network.fetch',
  'storage.get': 'storage.private',
  'storage.set': 'storage.private',
  'storage.delete': 'storage.private',
  'storage.keys': 'storage.private',
  'settings.get': null,
  'notifications.show': 'notifications.show',
} as const;

export type WorkerApiMethod = keyof typeof WORKER_API_PERMISSIONS;

/** Permission required to subscribe to each event. */
export const PLUGIN_EVENT_PERMISSIONS: Record<PluginEventName, string> = {
  'track.added': 'library.read',
  'track.updated': 'library.read',
  'track.deleted': 'library.read',
  'enrichment.done': 'library.metadata.read',
  'playback.started': 'playback.read',
};
