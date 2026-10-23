/**
 * Plugin API v2 permission catalog.
 *
 * `available` permissions can be requested by any community plugin. `reserved`
 * ones are part of the contract but the host rejects them until they ship;
 * Developer mode may enable them as proposed APIs. `core-only` permissions are
 * never delegated to third parties.
 */
export const PLUGIN_PERMISSION_CATALOG = [
    {
        id: 'library.read',
        title: 'Read your library',
        description: 'Search and list tracks and playlists, and look up albums, artists and labels. File locations are never shared.',
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
        id: 'tags.write.propose',
        title: 'Suggest tag writes',
        description: 'Suggest writing tags into audio files. You review every change.',
        risk: 'medium',
        status: 'reserved',
    },
    {
        id: 'library.files.read',
        title: 'Read your music files',
        description: 'Read the contents and details of files only inside your library folders, up to 1 MB per call. It cannot change anything.',
        risk: 'high',
        status: 'available',
    },
    {
        id: 'library.files.write',
        title: 'Change your music files',
        description: "Create, overwrite, rename and move files only inside your library folders and its own plugin folder; deletions go to Tape's trash and every change can be undone.",
        risk: 'high',
        status: 'available',
    },
    {
        id: 'library.organize.apply',
        title: 'Rename and move your music',
        description: 'Rename and move tracks by applying organize plans, only inside your library folders; Tape updates your library and every change can be undone.',
        risk: 'high',
        status: 'available',
    },
    {
        id: 'metadata.apply',
        title: 'Change track details',
        description: 'Change title, artist, album, year and genre of your tracks directly; every change is recorded and can be undone.',
        risk: 'medium',
        status: 'available',
    },
    {
        id: 'playlists.write',
        title: 'Create and edit playlists',
        description: 'Create playlists, and edit or delete only the playlists it created; your other playlists are never touched and every change can be undone.',
        risk: 'medium',
        status: 'available',
    },
    {
        id: 'jobs.schedule',
        title: 'Run on a schedule',
        description: 'Run routines in the background at most every 15 minutes, for up to 5 minutes each; they pause while Tape is busy and you can pause them any time.',
        risk: 'medium',
        status: 'available',
    },
    {
        id: 'playback.control',
        title: 'Control playback',
        description: 'Play tracks and playlists, pause, resume, skip, seek, change the volume and add to the queue, at a limited rate.',
        risk: 'medium',
        status: 'available',
    },
    {
        id: 'audio.analyze',
        title: 'See what is playing as sound',
        description: "Receive a live spectrum and level reading of what plays, only on the plugin's own pages. It cannot hear or record the audio.",
        risk: 'low',
        status: 'available',
    },
    {
        id: 'audio.process',
        title: 'Change how music sounds',
        description: "Adjust Tape's built-in effects (equalizer, gain, compressor, crossfeed). It cannot run its own audio code. Developer mode only for now.",
        risk: 'high',
        status: 'available',
        developerOnly: true,
    },
    {
        id: 'ui.mobile',
        title: 'Show on your phone',
        description: "Show its views in your paired Tape app and run its commands from there, with the same permissions it has on this computer.",
        risk: 'medium',
        status: 'available',
    },
    {
        id: 'ui.theme',
        title: 'Add a theme',
        description: "Adds a color theme you can choose in Settings \u2192 Appearance. It can't read your library or run code.",
        risk: 'low',
        status: 'available',
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
];
const BY_ID = new Map(PLUGIN_PERMISSION_CATALOG.map((entry) => [entry.id, entry]));
export function getPluginPermission(id) {
    return BY_ID.get(id);
}
export function isPluginPermission(id) {
    return typeof id === 'string' && BY_ID.has(id);
}
