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
  /** Notifications per plugin per minute. One budget, shared by the worker and the plugin's pages. */
  notificationsPerMinute: 6,
  /** Diagnostic log lines per plugin per minute. */
  logLinesPerMinute: 120,
  /** Consecutive failures before the host disables the plugin. */
  failuresBeforeDisable: 3,
  /** JavaScript run time a plugin may use per sliding window (all turns, handlers and continuations together). */
  cpuBudgetMs: 15_000,
  /** The window `cpuBudgetMs` is measured over. Over budget, the worker is stopped. */
  cpuWindowMs: 60_000,
  /** Refused host calls (rate-limited, denied, busy) are answered no sooner than this, so retry loops cannot spin. */
  rejectedReplyDelayMs: 250,
  /** More refused calls than this waiting for their delayed reply stops the worker. */
  maxPendingRefusals: 1_000,
  /** Host calls one plugin's pages (iframes) may have in flight at once. */
  maxConcurrentPageCalls: 4,
  /** Playlists `library.listPlaylists` returns. */
  maxPlaylists: 1_000,
  /** Track ids `library.getPlaylistTrackIds` returns. */
  maxPlaylistTrackIds: 5_000,
  /** Longest a badge command (`row.badge.*`) may take to answer before the host skips it. */
  badgeCommandBudgetMs: 1_500,

  // Plugin API 2.1
  /** `library.files.read`: largest slice one `tape.files.read` returns (before base64). */
  fileReadMaxBytes: 1024 * 1024,
  /** `library.files.write`: largest file one `tape.files.write` accepts (decoded). */
  fileWriteMaxBytes: 8 * 1024 * 1024,
  /** Write-type file calls (write, move, trash) per plugin per minute. */
  fileWriteCallsPerMinute: 60,
  /** Bytes a plugin may write per day (rolling 24 h). */
  fileWriteBytesPerDay: 1024 * 1024 * 1024,
  /** Entries `tape.files.list` returns for one directory. */
  maxFileListEntries: 1_000,
  /** Shortest interval a routine registered with `tape.jobs.register` may ask for. */
  jobMinIntervalMinutes: 15,
  /** Wall time of one routine run (one command invocation). */
  jobMaxRunMs: 5 * 60 * 1_000,
  /** `playback.control` calls per plugin per minute. */
  playbackCallsPerMinute: 30,
  /** `tape.audio.setEffects` changes per second. */
  audioEffectChangesPerSecond: 10,
  /** Renders of declarative views per plugin per minute. */
  viewRendersPerMinute: 60,
  /** Largest serialized declarative view tree. */
  viewMaxBytes: 256 * 1024,
  /** Deepest nesting of a declarative view tree (the root is depth 1). */
  viewMaxDepth: 12,
  /** Most nodes in a declarative view tree (list items and table rows count as one node each). */
  viewMaxNodes: 2_000,
  /** Most rows in a declarative `table`. */
  viewMaxTableRows: 500,
  /** Calls per plugin per minute from paired phones, across all devices. */
  mobileCallsPerMinute: 300,
  /** Days the host keeps entries of the plugin Changes history. */
  changesRetentionDays: 90,
  /** Most entries of the Changes history kept per plugin. */
  changesMaxEntries: 5_000,
  /** `tape.wait`: longest single wait. */
  waitMaxMs: 10_000,
  /** `tape.wait`: total milliseconds one plugin may spend waiting per rolling minute. */
  waitTotalMsPerMinute: 30_000,

  // Enforced by the Hub (Plugin API 2.1 actions, routines, playback, effects and views)
  /** Trash plus overwrite backups one plugin may hold. When full, `trash` and overwrites fail with `QuotaExceeded`. */
  vaultMaxBytes: 2 * 1024 * 1024 * 1024,
  /** Free space a volume must keep after a write or backup. */
  minFreeDiskBytes: 1024 * 1024 * 1024,
  /** Journaled changes (a file write, one organize move, a playlist or metadata change) per plugin per rolling minute. */
  changesPerMinute: 120,
  /** Most moves in one plan (`organize.proposePlan`). `organize.apply` and `applyPlan` take at most `min(organizeMaxMoves, changesPerMinute)` (120) moves per call, so split bigger plans. */
  organizeMaxMoves: 500,
  /** Routine runs one plugin gets per scheduler cycle. */
  jobRunsPerPluginPerCycle: 2,
  /** Total routine run time one plugin may use per rolling hour. */
  jobHourlyRunBudgetMs: 10 * 60 * 1_000,
  /** Shortest time between two play/pause/resume calls of one plugin. */
  playbackToggleCooldownMs: 3_000,
  /** Most track ids one playback call (`play`, `enqueue`) carries. */
  maxPlaybackTracks: 500,
  /** `tape.audio.setEffects`: total positive boost (output gain plus every positive EQ band) in dB. Larger sums are scaled down together. */
  effectsMaxTotalBoostDb: 12,
  /** The final limiter that is always last in the effects chain, in dBFS. */
  effectsLimiterThresholdDb: -1,
  /** The host never raises a gain faster than this (dB per second). */
  effectsMaxRiseDbPerSecond: 6,
  /** Compressor threshold bounds in dB. Values outside are clamped. */
  effectsCompressorThresholdDbMin: -40,
  effectsCompressorThresholdDbMax: 0,
  /** Compressor ratio bounds. Values outside are clamped. */
  effectsCompressorRatioMin: 1,
  effectsCompressorRatioMax: 8,
  /** Largest serialized view state the host keeps and passes back. */
  viewStateMaxBytes: 64 * 1024,
  /** Largest serialized `args` of one view action. */
  viewArgsMaxBytes: 16 * 1024,
  /** Longest toast a view command may return (characters; longer ones are cut). */
  viewToastMaxChars: 200,
} as const;

/**
 * Behavior of the host that is not a number but that plugins can rely on.
 * Published with the limits so authors design within it.
 */
export const PLUGIN_HOST_GUARANTEES = {
  /** Paging cursors (`nextCursor`) are signed by the host and only valid until the Hub restarts. Never store one. */
  cursors: 'signed-per-process',
  /** The worker and the plugin's pages draw from the same notification budget. */
  notificationBudget: 'shared-by-worker-and-pages',
} as const;

export type PluginHardLimits = typeof PLUGIN_HARD_LIMITS;
