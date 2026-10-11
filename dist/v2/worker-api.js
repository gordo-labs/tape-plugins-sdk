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
];
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
};
/** Permission required to subscribe to each event. */
export const PLUGIN_EVENT_PERMISSIONS = {
    'track.added': 'library.read',
    'track.updated': 'library.read',
    'track.deleted': 'library.read',
    'enrichment.done': 'library.metadata.read',
    'playback.started': 'playback.read',
};
