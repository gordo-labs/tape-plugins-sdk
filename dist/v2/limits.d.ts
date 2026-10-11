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
    /** Notifications per plugin per minute. */
    readonly notificationsPerMinute: 6;
    /** Diagnostic log lines per plugin per minute. */
    readonly logLinesPerMinute: 120;
    /** Consecutive failures before the host disables the plugin. */
    readonly failuresBeforeDisable: 3;
};
export type PluginHardLimits = typeof PLUGIN_HARD_LIMITS;
//# sourceMappingURL=limits.d.ts.map