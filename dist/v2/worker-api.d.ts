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
export declare const PLUGIN_EVENT_NAMES: readonly ["track.added", "track.updated", "track.deleted", "enrichment.done", "playback.started"];
export type PluginEventName = (typeof PLUGIN_EVENT_NAMES)[number];
export interface PluginEventPayloads {
    'track.added': {
        trackId: string;
    };
    'track.updated': {
        trackId: string;
    };
    'track.deleted': {
        trackId: string;
    };
    'enrichment.done': {
        trackId: string;
    };
    'playback.started': {
        trackId: string;
    };
}
/** Error codes a host call can reject with (`error.code`). */
export type PluginHostErrorCode = 'PermissionDenied' | 'Busy' | 'RateLimited' | 'NotFound' | 'InvalidArgument' | 'Timeout' | 'QuotaExceeded' | 'NetworkDenied' | 'Unavailable';
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
export interface PluginAlbum {
    /** The `albumId` Tape passes to commands. */
    id: string;
    title: string;
    /** Album artist, or the track artist when the album has none. */
    artist: string;
    year?: number;
    /** Label as written in the tracks' tags, when any track has one. */
    label?: string;
    trackCount: number;
    /** Track ids in disc and track order, at most 500. */
    trackIds: string[];
}
export interface PluginArtist {
    /** The `artistId` Tape passes to commands. */
    id: string;
    name: string;
    albumCount: number;
    trackCount: number;
}
export interface PluginLabel {
    /** The `labelId` Tape passes to commands. */
    id: string;
    name: string;
    albumCount: number;
    trackCount: number;
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
    moves: Array<{
        trackId: string;
        to: PluginFileLocation;
    }>;
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
/** Reference to a file Tape manages (Plugin API 2.1). Paths are library-relative, `/`-separated, with no `..`, no absolute paths and no symlink traversal; Tape refuses anything that resolves outside the folder. */
export type FileRef = {
    trackId: string;
} | {
    folderIndex: number;
    relativePath: string;
}
/** The plugin's own `<data>/plugins/<id>/files/` folder. */
 | {
    scope: 'plugin';
    relativePath: string;
};
/** Returned by every call that changes something. The change appears in the plugin's Changes history, where the user can undo it. */
export interface ChangeResult {
    changeId: string;
}
export interface PluginFileStat {
    kind: 'file' | 'directory';
    size: number;
    /** ISO 8601, or null when unknown. */
    modifiedAt: string | null;
}
export interface PluginFileEntry extends PluginFileStat {
    name: string;
}
export interface PluginFileReadResult {
    /** The slice, base64 encoded. */
    base64: string;
    offset: number;
    /** Bytes in this slice (before base64). */
    length: number;
    /** True when the slice reaches the end of the file. */
    eof: boolean;
}
export interface PluginMetadataApplyInput {
    trackId: string;
    /** Same fields as a proposal; `year` is a four-digit number and `genre` replaces the track's genre. */
    fields: PluginMetadataProposalInput['fields'];
}
export interface PluginPlaylistCreateInput {
    name: string;
    description?: string;
    trackIds?: string[];
}
/** Handed to a routine run. A run is one command invocation of at most `jobMaxRunMs`. */
export interface PluginJobContext {
    jobId: string;
    /** Groups the changes of this run in the Changes history ("Undo all from this run"). */
    runId: string;
    /** ISO 8601 time the run started. */
    startedAt: string;
    /** True when the user started it with "Run now". */
    manual: boolean;
}
export interface PluginEffectsInput {
    /** Parametric bands: `freq` in Hz, `gain` in dB, `q` quality factor. */
    eq?: Array<{
        freq: number;
        gain: number;
        q: number;
    }>;
    /** Overall gain in dB. */
    gain?: number;
    compressor?: {
        thresholdDb: number;
        ratio: number;
        attackMs: number;
        releaseMs: number;
    };
    /** Headphone crossfeed amount, 0..1. */
    crossfeed?: number;
}
/** What a command registered for a declarative view (`render`) receives and returns. See `views.ts`. */
export interface PluginViewCommandContext {
    viewId?: string;
    /** The state the plugin returned last time (or `{}`). */
    state?: unknown;
    /** Arguments of the `button` or `form` that triggered an action. */
    args?: Record<string, unknown>;
}
export interface TapeWorkerApi {
    readonly plugin: {
        readonly id: string;
        readonly version: string;
    };
    readonly library: {
        /** `library.read` */
        getTrack(trackId: string): Promise<PluginTrack | null>;
        /** `library.read`. At most the host page size per call. */
        getTracks(trackIds: string[]): Promise<PluginTrack[]>;
        /** `library.read`. Paginated listing; `query` searches title, artist and album. */
        listTracks(options?: {
            query?: string;
            limit?: number;
            cursor?: string | null;
        }): Promise<PluginPage<PluginTrack>>;
        /** `library.read`. Resolves an `albumId` from a command context; `null` when it does not exist. May answer `Busy` while Tape scans. */
        getAlbum(albumId: string): Promise<PluginAlbum | null>;
        /** `library.read`. Resolves an `artistId` from a command context; `null` when it does not exist. */
        getArtist(artistId: string): Promise<PluginArtist | null>;
        /** `library.read`. Resolves a `labelId` from a command context; `null` when it does not exist. */
        getLabel(labelId: string): Promise<PluginLabel | null>;
        /** `library.read` */
        listPlaylists(): Promise<PluginPlaylist[]>;
        /** `library.read`. Track ids in order. */
        getPlaylistTrackIds(playlistId: string): Promise<string[]>;
        /** `library.folders.read`. Folder display names only, in index order. */
        listFolders(): Promise<Array<{
            index: number;
            name: string;
        }>>;
    };
    readonly files: {
        /** `library.files.read` */
        stat(ref: FileRef): Promise<PluginFileStat>;
        /** `library.files.read`. At most 1 MB per call. */
        read(ref: FileRef, options?: {
            offset?: number;
            length?: number;
        }): Promise<PluginFileReadResult>;
        /** `library.files.write`. At most 8 MB (decoded). Creates parent folders inside the library folder. Refuses to replace an existing file unless `overwrite` is true. */
        write(ref: FileRef, base64: string, options?: {
            overwrite?: boolean;
        }): Promise<ChangeResult>;
        /** `library.files.write`. Updates the library index. */
        move(ref: FileRef, to: PluginFileLocation | {
            scope: 'plugin';
            relativePath: string;
        }): Promise<ChangeResult>;
        /** `library.files.write`. Sends the file to Tape's trash, from where it can be restored. */
        trash(ref: FileRef): Promise<ChangeResult>;
        /** `library.files.read`. One directory, at most 1000 entries. */
        list(location: PluginFileLocation | {
            scope: 'plugin';
            relativePath: string;
        }): Promise<{
            entries: PluginFileEntry[];
            truncated: boolean;
        }>;
    };
    readonly metadata: {
        /** `metadata.propose`. The user reviews the proposal; nothing changes until they accept. */
        propose(input: PluginMetadataProposalInput): Promise<{
            proposalId: string;
        }>;
        /** `metadata.apply`. Changes the track now, through the metadata ledger; the change can be undone. */
        apply(input: PluginMetadataApplyInput): Promise<ChangeResult>;
    };
    readonly organize: {
        /** `library.organize.propose`. Shows the plan to the user. */
        proposePlan(plan: PluginOrganizePlanInput): Promise<{
            planId: string;
        }>;
        /** `library.organize.apply`. Applies a plan this plugin proposed. */
        applyPlan(planId: string): Promise<ChangeResult>;
        /** `library.organize.apply`. Renames and moves tracks right away. Tape updates the library and keeps an undo journal. */
        apply(input: {
            moves: PluginOrganizePlanInput['moves'];
        }): Promise<ChangeResult>;
    };
    readonly playlists: {
        /** `playlists.write` */
        create(input: PluginPlaylistCreateInput): Promise<ChangeResult & {
            playlistId: string;
        }>;
        /** `playlists.write`. Only playlists this plugin created. */
        update(playlistId: string, fields: {
            name?: string;
            description?: string;
        }): Promise<ChangeResult>;
        /** `playlists.write`. Only playlists this plugin created. */
        setTracks(playlistId: string, trackIds: string[]): Promise<ChangeResult>;
        /** `playlists.write`. Only playlists this plugin created. */
        addTracks(playlistId: string, trackIds: string[]): Promise<ChangeResult>;
        /** `playlists.write`. Only playlists this plugin created. */
        removeTracks(playlistId: string, trackIds: string[]): Promise<ChangeResult>;
        /** `playlists.write`. Only playlists this plugin created. */
        delete(playlistId: string): Promise<ChangeResult>;
    };
    readonly jobs: {
        /**
         * `jobs.schedule`. Register a routine; call it synchronously while the worker loads, like `commands.register`.
         * `everyMinutes` is at least 15. Runs are skipped while Tape is busy and last at most 5 minutes.
         */
        register(id: string, schedule: {
            everyMinutes: number;
        }, handler: (context: PluginJobContext) => void | Promise<void>): void;
    };
    readonly playback: {
        /** `playback.read` */
        getState(): Promise<{
            trackId: string | null;
        }>;
        /** `playback.control`. Rejects with `Unavailable` when no Tape Desktop window owns playback. */
        play(input: ({
            trackIds: string[];
        } | {
            playlistId: string;
        }) & {
            startIndex?: number;
        }): Promise<void>;
        /** `playback.control` */
        pause(): Promise<void>;
        /** `playback.control` */
        resume(): Promise<void>;
        /** `playback.control` */
        next(): Promise<void>;
        /** `playback.control` */
        previous(): Promise<void>;
        /** `playback.control`. Position in seconds. */
        seek(seconds: number): Promise<void>;
        /** `playback.control`. 0..1 */
        setVolume(volume: number): Promise<void>;
        /** `playback.control`. Adds to the end of the queue. */
        enqueue(trackIds: string[]): Promise<void>;
    };
    readonly audio: {
        /** `audio.process` (Developer mode). Sets parameters of Tape's built-in effects; omitted effects keep their value. */
        setEffects(effects: PluginEffectsInput): Promise<void>;
    };
    readonly views: {
        /** `ui.contribute`. Asks every host showing the declarative view to render it again. */
        update(viewId: string): Promise<void>;
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
        register(commandId: string, handler: (context: PluginViewCommandContext & {
            trackId?: string;
            albumId?: string;
            artistId?: string;
            labelId?: string;
            playlistId?: string;
            folderIndex?: number;
            trackIds?: string[];
        }) => unknown): void;
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
        show(message: string, options?: {
            kind?: 'info' | 'success' | 'warning';
        }): Promise<void>;
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
        onUpdate(handler: (context: {
            fromVersion: string;
        }) => void | Promise<void>): void;
        /** Before uninstall. Clean up remote state you own; local storage is removed by Tape if the user asks. */
        onUninstall(handler: () => void | Promise<void>): void;
    };
}
/** Methods (`namespace.method`) the worker bridge exposes, with the permission each needs. */
export declare const WORKER_API_PERMISSIONS: {
    readonly 'library.getTrack': "library.read";
    readonly 'library.getTracks': "library.read";
    readonly 'library.listTracks': "library.read";
    readonly 'library.getAlbum': "library.read";
    readonly 'library.getArtist': "library.read";
    readonly 'library.getLabel': "library.read";
    readonly 'library.listPlaylists': "library.read";
    readonly 'library.getPlaylistTrackIds': "library.read";
    readonly 'library.listFolders': "library.folders.read";
    readonly 'files.stat': "library.files.read";
    readonly 'files.read': "library.files.read";
    readonly 'files.list': "library.files.read";
    readonly 'files.write': "library.files.write";
    readonly 'files.move': "library.files.write";
    readonly 'files.trash': "library.files.write";
    readonly 'metadata.propose': "metadata.propose";
    readonly 'metadata.apply': "metadata.apply";
    readonly 'organize.proposePlan': "library.organize.propose";
    readonly 'organize.applyPlan': "library.organize.apply";
    readonly 'organize.apply': "library.organize.apply";
    readonly 'playlists.create': "playlists.write";
    readonly 'playlists.update': "playlists.write";
    readonly 'playlists.setTracks': "playlists.write";
    readonly 'playlists.addTracks': "playlists.write";
    readonly 'playlists.removeTracks': "playlists.write";
    readonly 'playlists.delete': "playlists.write";
    readonly 'jobs.register': "jobs.schedule";
    readonly 'playback.getState': "playback.read";
    readonly 'playback.play': "playback.control";
    readonly 'playback.pause': "playback.control";
    readonly 'playback.resume': "playback.control";
    readonly 'playback.next': "playback.control";
    readonly 'playback.previous': "playback.control";
    readonly 'playback.seek': "playback.control";
    readonly 'playback.setVolume': "playback.control";
    readonly 'playback.enqueue': "playback.control";
    readonly 'audio.setEffects': "audio.process";
    readonly 'views.update': "ui.contribute";
    readonly 'net.fetch': "network.fetch";
    readonly 'storage.get': "storage.private";
    readonly 'storage.set': "storage.private";
    readonly 'storage.delete': "storage.private";
    readonly 'storage.keys': "storage.private";
    readonly 'settings.get': null;
    readonly 'notifications.show': "notifications.show";
};
export type WorkerApiMethod = keyof typeof WORKER_API_PERMISSIONS;
/** Permission required to subscribe to each event. */
export declare const PLUGIN_EVENT_PERMISSIONS: Record<PluginEventName, string>;
//# sourceMappingURL=worker-api.d.ts.map