/**
 * Plugin API versioning and compatibility policy.
 *
 * - The Plugin API has an integer major version. `2` is the current one; `1`
 *   is the legacy declarative manifest, still accepted and migrated.
 * - Inside a major version the host only adds: new methods, new optional
 *   fields, new events, new extension points, new permissions.
 * - A reserved permission or extension point may be used only in Developer
 *   mode ("proposed API") and never by a plugin listed in the public catalog.
 * - Anything deprecated keeps working for at least one Tape minor release and
 *   is announced in the Plugin API changelog with the release that removes it.
 * - When Tape updates and a plugin's `engines` no longer match, the host
 *   disables the plugin with a clear message instead of failing at runtime.
 */
export const PLUGIN_API_VERSION_V2 = '2';
/**
 * Revision inside the major version. `2.1` adds writes, routines, playback control, effects, declarative views
 * and mobile. Plugins keep declaring `engines.pluginApi: "2"`; the revision is informational and only grows.
 */
export const PLUGIN_API_REVISION = '2.1';
/** The minor part of `PLUGIN_API_REVISION`. */
export const PLUGIN_API_MINOR = 1;
export const SUPPORTED_PLUGIN_API_VERSIONS = ['1', '2'];
export const PLUGIN_API_POLICY = {
    currentVersion: PLUGIN_API_VERSION_V2,
    currentRevision: PLUGIN_API_REVISION,
    supportedVersions: SUPPORTED_PLUGIN_API_VERSIONS,
    additiveWithinMajor: true,
    proposedApisRequireDeveloperMode: true,
    minimumDeprecationWindow: 'one Tape minor release',
    changelog: 'https://docs.tapemusicsuite.com/plugins/api-changelog',
};
