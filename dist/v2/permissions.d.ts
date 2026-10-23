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
    /**
     * Plugin API 2.1. An `available` permission with `developerOnly: true` is part of the contract and works,
     * but the host only grants it while Developer mode is on (it is still being qualified). A manifest that
     * requests it is rejected unless `allowReserved` is set, exactly like a `reserved` one. Absent means false.
     * It is a separate field so `status` keeps meaning "shipped in the contract".
     */
    developerOnly?: boolean;
}
export declare const PLUGIN_PERMISSION_CATALOG: readonly [{
    readonly id: "library.read";
    readonly title: "Read your library";
    readonly description: "Search and list tracks and playlists, and look up albums, artists and labels. File locations are never shared.";
    readonly risk: "low";
    readonly status: "available";
}, {
    readonly id: "library.metadata.read";
    readonly title: "Read enriched metadata";
    readonly description: "Read label, BPM, musical key, MusicBrainz identifiers, AcoustID and enrichment status.";
    readonly risk: "low";
    readonly status: "available";
}, {
    readonly id: "library.folders.read";
    readonly title: "Read folder structure";
    readonly description: "See your library folders and where each file sits inside them, as paths relative to each folder.";
    readonly risk: "medium";
    readonly status: "available";
}, {
    readonly id: "metadata.propose";
    readonly title: "Suggest metadata changes";
    readonly description: "Suggest field changes. You review every suggestion; nothing changes until you accept it.";
    readonly risk: "low";
    readonly status: "available";
}, {
    readonly id: "library.organize.propose";
    readonly title: "Suggest file organization";
    readonly description: "Prepare a rename or move plan for you to review. The plugin cannot move or rename files.";
    readonly risk: "low";
    readonly status: "available";
}, {
    readonly id: "playback.read";
    readonly title: "See what is playing";
    readonly description: "Read the current track, queue and playback state, and be notified when playback changes.";
    readonly risk: "low";
    readonly status: "available";
}, {
    readonly id: "network.fetch";
    readonly title: "Connect to the internet";
    readonly description: "Make HTTPS requests to the domains listed in the manifest, and only those.";
    readonly risk: "high";
    readonly status: "available";
}, {
    readonly id: "storage.private";
    readonly title: "Store its own data";
    readonly description: "Keep settings and data in private storage that no other plugin can read.";
    readonly risk: "low";
    readonly status: "available";
}, {
    readonly id: "ui.contribute";
    readonly title: "Add to the interface";
    readonly description: "Add menu items, panels, views and settings in the places listed in the manifest.";
    readonly risk: "low";
    readonly status: "available";
}, {
    readonly id: "notifications.show";
    readonly title: "Show notifications";
    readonly description: "Show short in-app notifications.";
    readonly risk: "low";
    readonly status: "available";
}, {
    readonly id: "diagnostics.write";
    readonly title: "Add to diagnostic reports";
    readonly description: "Include its own log lines in the diagnostic reports you export. Logs in the plugin console need no permission.";
    readonly risk: "low";
    readonly status: "reserved";
}, {
    readonly id: "tags.write.propose";
    readonly title: "Suggest tag writes";
    readonly description: "Suggest writing tags into audio files. You review every change.";
    readonly risk: "medium";
    readonly status: "reserved";
}, {
    readonly id: "library.files.read";
    readonly title: "Read your music files";
    readonly description: "Read the contents and details of files only inside your library folders, up to 1 MB per call. It cannot change anything.";
    readonly risk: "high";
    readonly status: "available";
}, {
    readonly id: "library.files.write";
    readonly title: "Change your music files";
    readonly description: "Create, overwrite, rename and move files only inside your library folders and its own plugin folder; deletions go to Tape's trash and every change can be undone.";
    readonly risk: "high";
    readonly status: "available";
}, {
    readonly id: "library.organize.apply";
    readonly title: "Rename and move your music";
    readonly description: "Rename and move tracks by applying organize plans, only inside your library folders; Tape updates your library and every change can be undone.";
    readonly risk: "high";
    readonly status: "available";
}, {
    readonly id: "metadata.apply";
    readonly title: "Change track details";
    readonly description: "Change title, artist, album, year and genre of your tracks directly; every change is recorded and can be undone.";
    readonly risk: "medium";
    readonly status: "available";
}, {
    readonly id: "playlists.write";
    readonly title: "Create and edit playlists";
    readonly description: "Create playlists, and edit or delete only the playlists it created; your other playlists are never touched and every change can be undone.";
    readonly risk: "medium";
    readonly status: "available";
}, {
    readonly id: "jobs.schedule";
    readonly title: "Run on a schedule";
    readonly description: "Run routines in the background at most every 15 minutes, for up to 5 minutes each; they pause while Tape is busy and you can pause them any time.";
    readonly risk: "medium";
    readonly status: "available";
}, {
    readonly id: "playback.control";
    readonly title: "Control playback";
    readonly description: "Play tracks and playlists, pause, resume, skip, seek, change the volume and add to the queue, at a limited rate.";
    readonly risk: "medium";
    readonly status: "available";
}, {
    readonly id: "audio.analyze";
    readonly title: "See what is playing as sound";
    readonly description: "Receive a live spectrum and level reading of what plays, only on the plugin's own pages. It cannot hear or record the audio.";
    readonly risk: "low";
    readonly status: "available";
}, {
    readonly id: "audio.process";
    readonly title: "Change how music sounds";
    readonly description: "Adjust Tape's built-in effects (equalizer, gain, compressor, crossfeed). It cannot run its own audio code. Developer mode only for now.";
    readonly risk: "high";
    readonly status: "available";
    readonly developerOnly: true;
}, {
    readonly id: "ui.mobile";
    readonly title: "Show on your phone";
    readonly description: "Show its views in your paired Tape app and run its commands from there, with the same permissions it has on this computer.";
    readonly risk: "medium";
    readonly status: "available";
}, {
    readonly id: "ui.theme";
    readonly title: "Add a theme";
    readonly description: "Adds a color theme you can choose in Settings → Appearance. It can't read your library or run code.";
    readonly risk: "low";
    readonly status: "available";
}, {
    readonly id: "network.connect";
    readonly title: "Open network connections";
    readonly description: "Open direct network connections. Reserved for core add-ons.";
    readonly risk: "high";
    readonly status: "core-only";
}, {
    readonly id: "network.iroh:music-hub-network";
    readonly title: "Music Hub Network transport";
    readonly description: "Use the Music Hub Network Iroh namespace. Core add-on only.";
    readonly risk: "high";
    readonly status: "core-only";
}, {
    readonly id: "storage.addon:music-hub-network";
    readonly title: "Music Hub Network storage";
    readonly description: "Use the Music Hub Network storage scope. Core add-on only.";
    readonly risk: "medium";
    readonly status: "core-only";
}];
export type PluginPermissionV2 = (typeof PLUGIN_PERMISSION_CATALOG)[number]['id'];
export declare function getPluginPermission(id: string): PluginPermissionDefinition | undefined;
export declare function isPluginPermission(id: unknown): id is PluginPermissionV2;
//# sourceMappingURL=permissions.d.ts.map