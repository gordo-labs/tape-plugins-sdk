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