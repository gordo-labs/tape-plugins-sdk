/**
 * Hard limits the host applies to every community plugin.
 *
 * Published so plugin authors (and their AI tools) can design within them.
 * The host may lower them at any time; a plugin can never raise them. When a
 * plugin and the core compete for resources, the core wins.
 */
export const PLUGIN_HARD_LIMITS = {
    /** Memory available to the plugin's JavaScript heap. */
    workerMemoryBytes: 64 * 1024 * 1024,
    /** Maximum JavaScript stack size. */
    workerStackBytes: 256 * 1024,
    /** Longest a single synchronous turn of plugin code may run. */
    turnTimeoutMs: 1_000,
    /** Longest one command or event handler may take, including awaited host calls. */
    handlerTimeoutMs: 30_000,
    /** Host API calls a plugin may have in flight at once. */
    maxConcurrentHostCalls: 8,
    /** Host API calls per plugin per minute. */
    hostCallsPerMinute: 600,
    /** Largest page any library listing returns. */
    maxPageSize: 200,
    /** Largest serialized message between the plugin and the host. */
    maxMessageBytes: 256 * 1024,
    /** Network requests per plugin per minute. */
    networkRequestsPerMinute: 60,
    /** Largest network response body. */
    networkMaxResponseBytes: 2 * 1024 * 1024,
    /** Network request timeout. */
    networkTimeoutMs: 15_000,
    /** Private storage quota per plugin. */
    storageQuotaBytes: 1024 * 1024,
    /** Largest single stored value. */
    storageMaxValueBytes: 64 * 1024,
    /** Notifications per plugin per minute. */
    notificationsPerMinute: 6,
    /** Diagnostic log lines per plugin per minute. */
    logLinesPerMinute: 120,
    /** Consecutive failures before the host disables the plugin. */
    failuresBeforeDisable: 3,
};
