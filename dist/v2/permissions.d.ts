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
    readonly id: "jobs.schedule";
    readonly title: "Run background tasks";
    readonly description: "Run tasks in the background within the limits Tape sets. They pause while Tape is busy.";
    readonly risk: "medium";
    readonly status: "reserved";
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
    readonly id: "metadata.apply";
    readonly title: "Apply approved metadata changes";
    readonly description: "Apply a batch of metadata changes you approved, with undo.";
    readonly risk: "medium";
    readonly status: "reserved";
}, {
    readonly id: "library.organize.apply";
    readonly title: "Apply an approved file plan";
    readonly description: "Ask Tape to rename or move files according to a plan you approved, with undo.";
    readonly risk: "high";
    readonly status: "reserved";
}, {
    readonly id: "tags.write.propose";
    readonly title: "Suggest tag writes";
    readonly description: "Suggest writing tags into audio files. You review every change.";
    readonly risk: "medium";
    readonly status: "reserved";
}, {
    readonly id: "playlists.write";
    readonly title: "Create and edit playlists";
    readonly description: "Create playlists and add tracks to playlists it created.";
    readonly risk: "medium";
    readonly status: "reserved";
}, {
    readonly id: "playback.control";
    readonly title: "Control playback";
    readonly description: "Play, pause, skip and queue tracks.";
    readonly risk: "medium";
    readonly status: "reserved";
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