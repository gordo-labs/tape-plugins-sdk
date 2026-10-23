/**
 * Hard limits the host applies to every community plugin.
 *
 * Published so plugin authors (and their AI tools) can design within them.
 * The host may lower them at any time; a plugin can never raise them. When a
 * plugin and the core compete for resources, the core wins.
 */
export declare const PLUGIN_HARD_LIMITS: {
    /** Memory available to the plugin's JavaScript heap. */
    readonly workerMemoryBytes: number;
    /** Maximum JavaScript stack size. */
    readonly workerStackBytes: number;
    /** Longest a single synchronous turn of plugin code may run. */
    readonly turnTimeoutMs: 1000;
    /** Longest one command or event handler may take, including awaited host calls. */
    readonly handlerTimeoutMs: 30000;
    /** Host API calls a plugin may have in flight at once. */
    readonly maxConcurrentHostCalls: 8;
    /** Host API calls per plugin per minute. */
    readonly hostCallsPerMinute: 600;
    /** Largest page any library listing returns. */
    readonly maxPageSize: 200;
    /** Largest serialized message between the plugin and the host. */
    readonly maxMessageBytes: number;
    /** Network requests per plugin per minute. */
    readonly networkRequestsPerMinute: 60;
    /** Largest network response body. */
    readonly networkMaxResponseBytes: number;
    /** Network request timeout. */
    readonly networkTimeoutMs: 15000;
    /** Private storage quota per plugin. */
    readonly storageQuotaBytes: number;
    /** Largest single stored value. */
    readonly storageMaxValueBytes: number;
    /** Notifications per plugin per minute. One budget, shared by the worker and the plugin's pages. */
    readonly notificationsPerMinute: 6;
    /** Diagnostic log lines per plugin per minute. */
    readonly logLinesPerMinute: 120;
    /** Consecutive failures before the host disables the plugin. */
    readonly failuresBeforeDisable: 3;
    /** JavaScript run time a plugin may use per sliding window (all turns, handlers and continuations together). */
    readonly cpuBudgetMs: 15000;
    /** The window `cpuBudgetMs` is measured over. Over budget, the worker is stopped. */
    readonly cpuWindowMs: 60000;
    /** Refused host calls (rate-limited, denied, busy) are answered no sooner than this, so retry loops cannot spin. */
    readonly rejectedReplyDelayMs: 250;
    /** More refused calls than this waiting for their delayed reply stops the worker. */
    readonly maxPendingRefusals: 1000;
    /** Host calls one plugin's pages (iframes) may have in flight at once. */
    readonly maxConcurrentPageCalls: 4;
    /** Playlists `library.listPlaylists` returns. */
    readonly maxPlaylists: 1000;
    /** Track ids `library.getPlaylistTrackIds` returns. */
    readonly maxPlaylistTrackIds: 5000;
    /** Longest a badge command (`row.badge.*`) may take to answer before the host skips it. */
    readonly badgeCommandBudgetMs: 1500;
    /** `library.files.read`: largest slice one `tape.files.read` returns (before base64). */
    readonly fileReadMaxBytes: number;
    /** `library.files.write`: largest file one `tape.files.write` accepts (decoded). */
    readonly fileWriteMaxBytes: number;
    /** Write-type file calls (write, move, trash) per plugin per minute. */
    readonly fileWriteCallsPerMinute: 60;
    /** Bytes a plugin may write per day (rolling 24 h). */
    readonly fileWriteBytesPerDay: number;
    /** Entries `tape.files.list` returns for one directory. */
    readonly maxFileListEntries: 1000;
    /** Shortest interval a routine registered with `tape.jobs.register` may ask for. */
    readonly jobMinIntervalMinutes: 15;
    /** Wall time of one routine run (one command invocation). */
    readonly jobMaxRunMs: number;
    /** `playback.control` calls per plugin per minute. */
    readonly playbackCallsPerMinute: 30;
    /** `tape.audio.setEffects` changes per second. */
    readonly audioEffectChangesPerSecond: 10;
    /** Renders of declarative views per plugin per minute. */
    readonly viewRendersPerMinute: 60;
    /** Largest serialized declarative view tree. */
    readonly viewMaxBytes: number;
    /** Deepest nesting of a declarative view tree (the root is depth 1). */
    readonly viewMaxDepth: 12;
    /** Most nodes in a declarative view tree (list items and table rows count as one node each). */
    readonly viewMaxNodes: 2000;
    /** Most rows in a declarative `table`. */
    readonly viewMaxTableRows: 500;
    /** Calls per plugin per minute from paired phones, across all devices. */
    readonly mobileCallsPerMinute: 300;
    /** Days the host keeps entries of the plugin Changes history. */
    readonly changesRetentionDays: 90;
    /** Most entries of the Changes history kept per plugin. */
    readonly changesMaxEntries: 5000;
    /** `tape.wait`: longest single wait. */
    readonly waitMaxMs: 10000;
    /** `tape.wait`: total milliseconds one plugin may spend waiting per rolling minute. */
    readonly waitTotalMsPerMinute: 30000;
    /** Trash plus overwrite backups one plugin may hold. When full, `trash` and overwrites fail with `QuotaExceeded`. */
    readonly vaultMaxBytes: number;
    /** Free space a volume must keep after a write or backup. */
    readonly minFreeDiskBytes: number;
    /** Journaled changes (a file write, one organize move, a playlist or metadata change) per plugin per rolling minute. */
    readonly changesPerMinute: 120;
    /** Most moves in one plan (`organize.proposePlan`). `organize.apply` and `applyPlan` take at most `min(organizeMaxMoves, changesPerMinute)` (120) moves per call, so split bigger plans. */
    readonly organizeMaxMoves: 500;
    /** Routine runs one plugin gets per scheduler cycle. */
    readonly jobRunsPerPluginPerCycle: 2;
    /** Total routine run time one plugin may use per rolling hour. */
    readonly jobHourlyRunBudgetMs: number;
    /** Shortest time between two play/pause/resume calls of one plugin. */
    readonly playbackToggleCooldownMs: 3000;
    /** Most track ids one playback call (`play`, `enqueue`) carries. */
    readonly maxPlaybackTracks: 500;
    /** `tape.audio.setEffects`: total positive boost (output gain plus every positive EQ band) in dB. Larger sums are scaled down together. */
    readonly effectsMaxTotalBoostDb: 12;
    /** The final limiter that is always last in the effects chain, in dBFS. */
    readonly effectsLimiterThresholdDb: -1;
    /** The host never raises a gain faster than this (dB per second). */
    readonly effectsMaxRiseDbPerSecond: 6;
    /** Compressor threshold bounds in dB. Values outside are clamped. */
    readonly effectsCompressorThresholdDbMin: -40;
    readonly effectsCompressorThresholdDbMax: 0;
    /** Compressor ratio bounds. Values outside are clamped. */
    readonly effectsCompressorRatioMin: 1;
    readonly effectsCompressorRatioMax: 8;
    /** Largest serialized view state the host keeps and passes back. */
    readonly viewStateMaxBytes: number;
    /** Largest serialized `args` of one view action. */
    readonly viewArgsMaxBytes: number;
    /** Longest toast a view command may return (characters; longer ones are cut). */
    readonly viewToastMaxChars: 200;
};
/**
 * Behavior of the host that is not a number but that plugins can rely on.
 * Published with the limits so authors design within it.
 */
export declare const PLUGIN_HOST_GUARANTEES: {
    /** Paging cursors (`nextCursor`) are signed by the host and only valid until the Hub restarts. Never store one. */
    readonly cursors: "signed-per-process";
    /** The worker and the plugin's pages draw from the same notification budget. */
    readonly notificationBudget: "shared-by-worker-and-pages";
};
export type PluginHardLimits = typeof PLUGIN_HARD_LIMITS;
//# sourceMappingURL=limits.d.ts.map