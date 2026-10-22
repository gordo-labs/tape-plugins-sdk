/**
 * Plugin manifest v2 (`schemaVersion: 2`).
 *
 * One contract for community plugins, themes and first-party modules. The
 * validator is authoritative: the published JSON Schema describes the shape,
 * this module also enforces the cross-field rules.
 */
import { PLUGIN_API_VERSION_V2 } from './api-policy.js';
import { EXTENSION_POINT_CATALOG, PLUGIN_ICON_TOKENS, getExtensionPoint } from './extension-points.js';
import { getPluginPermission } from './permissions.js';
import { PLUGIN_EVENT_NAMES } from './worker-api.js';
const ID_PATTERN = /^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?$/;
const ITEM_ID_PATTERN = /^[a-z0-9]+(?:[a-z0-9.-]*[a-z0-9])?$/;
const SETTING_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const RANGE_PART = /^(>=|<=|>|<|=)?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const HOST_PATTERN = /^(\*\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const PRIVATE_SUFFIXES = ['.local', '.lan', '.internal', '.home.arpa', '.localhost', '.test', '.invalid', '.example'];
const KINDS = ['plugin', 'theme', 'module'];
const TIERS = ['core', 'official', 'verified', 'community', 'local-dev'];
const THIRD_PARTY_TIERS = ['official', 'verified', 'community', 'local-dev'];
const MAX = { name: 60, description: 280, title: 60, permissions: 24, hosts: 10, settings: 30, activation: 20 };
/** Validate a v2 manifest. Returns human-readable issues; empty means valid. */
export function validatePluginManifestV2(manifest, options = {}) {
    const issues = [];
    if (!isRecord(manifest))
        return ['manifest must be a JSON object'];
    if (!isJsonSerializable(manifest))
        issues.push('manifest must contain only JSON-serializable data');
    if (manifest.schemaVersion !== 2)
        issues.push('manifest.schemaVersion must be 2');
    if (!ID_PATTERN.test(str(manifest.id)) || str(manifest.id).length > 64)
        issues.push('manifest.id must be a lowercase slug of at most 64 characters');
    boundedText(manifest.name, 'manifest.name', MAX.name, issues);
    boundedText(manifest.description, 'manifest.description', MAX.description, issues);
    if (!SEMVER_PATTERN.test(str(manifest.version)))
        issues.push('manifest.version must be semver');
    if (!KINDS.includes(str(manifest.kind)))
        issues.push('manifest.kind must be plugin, theme or module');
    if (!TIERS.includes(str(manifest.tier)))
        issues.push('manifest.tier is not supported');
    const tier = str(manifest.tier);
    const thirdParty = THIRD_PARTY_TIERS.includes(tier);
    if (manifest.kind === 'module' && tier !== 'core')
        issues.push('kind "module" is reserved for core add-ons');
    validateEngines(manifest.engines, issues);
    if (thirdParty && tier !== 'local-dev')
        validatePublisherAndSource(manifest, issues);
    const permissions = validatePermissions(manifest.permissions, thirdParty, options, issues);
    validateNetwork(manifest, permissions, issues);
    validateActivation(manifest.activation, issues);
    const entrypoints = isRecord(manifest.entrypoints) ? manifest.entrypoints : undefined;
    if (!entrypoints)
        issues.push('manifest.entrypoints is required');
    for (const key of ['worker', 'ui', 'theme']) {
        if (entrypoints?.[key] !== undefined && !isBundlePath(entrypoints[key])) {
            issues.push(`manifest.entrypoints.${key} must be a relative path inside the bundle`);
        }
    }
    if (entrypoints && !entrypoints.worker && !entrypoints.ui && !entrypoints.theme) {
        issues.push('manifest.entrypoints must declare a worker, ui or theme');
    }
    if (manifest.kind === 'theme' && !entrypoints?.theme)
        issues.push('a theme requires entrypoints.theme');
    if (manifest.kind === 'theme' && !permissions.has('ui.theme'))
        issues.push('a theme requires the ui.theme permission');
    if (entrypoints?.theme !== undefined) {
        if (manifest.kind === 'module')
            issues.push('entrypoints.theme is not allowed for kind "module"');
        if (isBundlePath(entrypoints.theme) && !str(entrypoints.theme).toLowerCase().endsWith('.json')) {
            issues.push('manifest.entrypoints.theme must be a .json file');
        }
        if (manifest.kind !== 'theme' && !permissions.has('ui.theme'))
            issues.push('entrypoints.theme requires the ui.theme permission');
    }
    validateSettings(manifest.settings, issues);
    validateContributions(manifest, permissions, entrypoints, options, issues);
    return issues;
}
export class PluginManifestV2ValidationError extends Error {
    issues;
    constructor(issues) {
        super(`Invalid plugin manifest: ${issues.join('; ')}`);
        this.issues = issues;
        this.name = 'PluginManifestV2ValidationError';
    }
}
/** Validate and return a frozen deep copy. No plugin code runs. */
export function definePluginManifestV2(manifest, options) {
    const issues = validatePluginManifestV2(manifest, options);
    if (issues.length)
        throw new PluginManifestV2ValidationError(issues);
    return deepFreeze(JSON.parse(JSON.stringify(manifest)));
}
function validateEngines(engines, issues) {
    if (!isRecord(engines)) {
        issues.push('manifest.engines is required');
        return;
    }
    const tape = str(engines.tape);
    if (!tape || !tape.split('||').every((clause) => clause.trim().split(/\s+/).every((part) => RANGE_PART.test(part)))) {
        issues.push('manifest.engines.tape must be a semver range such as ">=0.6.0"');
    }
    const apis = str(engines.pluginApi).split('||').map((value) => value.trim());
    if (!apis.every((value) => /^\d+$/.test(value)) || !apis.includes(PLUGIN_API_VERSION_V2)) {
        issues.push(`manifest.engines.pluginApi must include ${PLUGIN_API_VERSION_V2}`);
    }
}
function validatePublisherAndSource(manifest, issues) {
    const publisher = manifest.publisher;
    if (!isRecord(publisher) || !nonEmpty(publisher.name))
        issues.push('manifest.publisher.name is required for third-party plugins');
    else if (publisher.url !== undefined && !isHttpsUrl(publisher.url))
        issues.push('manifest.publisher.url must be an https URL');
    const source = manifest.source;
    if (!isRecord(source) || !nonEmpty(source.license))
        issues.push('manifest.source.license is required for third-party plugins');
    if (!isRecord(source) || !isHttpsUrl(source.repository))
        issues.push('manifest.source.repository must be the https URL of a public repository');
}
function validatePermissions(value, thirdParty, options, issues) {
    const granted = new Set();
    if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) {
        issues.push('manifest.permissions must be a string array');
        return granted;
    }
    if (value.length > MAX.permissions)
        issues.push(`manifest.permissions accepts at most ${MAX.permissions} entries`);
    for (const id of value) {
        const definition = getPluginPermission(id);
        if (!definition) {
            issues.push(`unknown permission: ${id}`);
            continue;
        }
        if (granted.has(id))
            issues.push(`duplicate permission: ${id}`);
        if (definition.status === 'core-only' && thirdParty)
            issues.push(`permission ${id} is reserved for core add-ons`);
        if (definition.status === 'reserved' && !options.allowReserved)
            issues.push(`permission ${id} is not available yet (proposed API, Developer mode only)`);
        granted.add(id);
    }
    return granted;
}
function validateNetwork(manifest, permissions, issues) {
    const network = manifest.network;
    const hosts = isRecord(network) && Array.isArray(network.allow) ? network.allow : undefined;
    if (permissions.has('network.fetch')) {
        if (!hosts || hosts.length === 0)
            issues.push('network.fetch requires manifest.network.allow with at least one domain');
    }
    else if (network !== undefined) {
        issues.push('manifest.network requires the network.fetch permission');
    }
    if (network !== undefined && !hosts)
        issues.push('manifest.network.allow must be an array of domains');
    if (hosts) {
        if (hosts.length > MAX.hosts)
            issues.push(`manifest.network.allow accepts at most ${MAX.hosts} domains`);
        for (const host of hosts) {
            if (!isAllowedHost(host))
                issues.push(`network domain is not allowed: ${String(host)}`);
        }
    }
    const disclosure = manifest.dataDisclosure;
    if (disclosure === undefined) {
        if (hosts?.length)
            issues.push('manifest.dataDisclosure must describe what is sent to each network domain');
        return;
    }
    if (!Array.isArray(disclosure)) {
        issues.push('manifest.dataDisclosure must be an array');
        return;
    }
    const declared = new Set((hosts ?? []).map(String));
    const covered = new Set();
    for (const entry of disclosure) {
        if (!isRecord(entry) || !nonEmpty(entry.domain) || !nonEmpty(entry.data) || !nonEmpty(entry.purpose)) {
            issues.push('each dataDisclosure entry needs domain, data and purpose');
            continue;
        }
        if (!declared.has(entry.domain))
            issues.push(`dataDisclosure domain ${entry.domain} is not in network.allow`);
        covered.add(entry.domain);
    }
    for (const host of declared) {
        if (!covered.has(host))
            issues.push(`manifest.dataDisclosure is missing network domain ${host}`);
    }
}
function validateActivation(value, issues) {
    if (value === undefined)
        return;
    if (!Array.isArray(value) || value.length > MAX.activation) {
        issues.push(`manifest.activation must be an array of at most ${MAX.activation} entries`);
        return;
    }
    const events = PLUGIN_EVENT_NAMES;
    for (const entry of value) {
        const text = str(entry);
        if (text === 'onStartup')
            continue;
        const [kind, target] = text.split(':', 2);
        if ((kind === 'onCommand' || kind === 'onView') && ITEM_ID_PATTERN.test(target ?? ''))
            continue;
        if (kind === 'onEvent' && events.includes(target ?? ''))
            continue;
        issues.push(`invalid activation: ${text}`);
    }
}
function validateSettings(value, issues) {
    if (value === undefined)
        return;
    if (!isRecord(value)) {
        issues.push('manifest.settings must be an object');
        return;
    }
    const entries = Object.entries(value);
    if (entries.length > MAX.settings)
        issues.push(`manifest.settings accepts at most ${MAX.settings} keys`);
    for (const [key, setting] of entries) {
        if (!SETTING_KEY_PATTERN.test(key))
            issues.push(`invalid settings key: ${key}`);
        if (!isRecord(setting)) {
            issues.push(`settings.${key} must be an object`);
            continue;
        }
        boundedText(setting.title, `settings.${key}.title`, MAX.title, issues);
        switch (setting.type) {
            case 'string':
                if (setting.default !== undefined && typeof setting.default !== 'string')
                    issues.push(`settings.${key}.default must be a string`);
                break;
            case 'number':
                if (setting.default !== undefined && typeof setting.default !== 'number')
                    issues.push(`settings.${key}.default must be a number`);
                break;
            case 'boolean':
                if (setting.default !== undefined && typeof setting.default !== 'boolean')
                    issues.push(`settings.${key}.default must be a boolean`);
                break;
            case 'select':
                if (!Array.isArray(setting.options) || setting.options.length === 0 || !setting.options.every(nonEmpty)) {
                    issues.push(`settings.${key}.options must be a non-empty string array`);
                }
                else if (setting.default !== undefined && !setting.options.includes(setting.default)) {
                    issues.push(`settings.${key}.default must be one of its options`);
                }
                break;
            default:
                issues.push(`settings.${key}.type must be string, number, boolean or select`);
        }
    }
}
function validateContributions(manifest, permissions, entrypoints, options, issues) {
    const contributes = manifest.contributes;
    if (contributes === undefined)
        return;
    if (!isRecord(contributes)) {
        issues.push('manifest.contributes must be an object');
        return;
    }
    const points = Object.entries(contributes);
    if (points.length && !permissions.has('ui.contribute'))
        issues.push('ui.contribute is required for UI contributions');
    const workspaceIds = new Set((Array.isArray(contributes.workspace) ? contributes.workspace : [])
        .filter(isRecord)
        .map((item) => str(item.id)));
    const seen = new Set();
    const icons = PLUGIN_ICON_TOKENS;
    for (const [pointId, items] of points) {
        const point = getExtensionPoint(pointId);
        if (!point) {
            issues.push(`unknown extension point: ${pointId} (known: ${EXTENSION_POINT_CATALOG.map((entry) => entry.id).join(', ')})`);
            continue;
        }
        if (point.status === 'reserved' && !options.allowReserved) {
            issues.push(`extension point ${pointId} is not available yet (proposed API, Developer mode only)`);
        }
        if (!Array.isArray(items)) {
            issues.push(`contributes.${pointId} must be an array`);
            continue;
        }
        if (items.length > point.maxItemsPerPlugin)
            issues.push(`contributes.${pointId} accepts at most ${point.maxItemsPerPlugin} items`);
        if (point.form === 'iframe' && !entrypoints?.ui)
            issues.push(`contributes.${pointId} requires entrypoints.ui`);
        for (const item of items) {
            if (!isRecord(item)) {
                issues.push(`contributes.${pointId} items must be objects`);
                continue;
            }
            const label = `contributes.${pointId}.${str(item.id) || '?'}`;
            if (!ITEM_ID_PATTERN.test(str(item.id)) || str(item.id).length > 64)
                issues.push(`${label}: id must be a lowercase slug`);
            if (seen.has(`${pointId}:${str(item.id)}`))
                issues.push(`${label}: duplicate id`);
            seen.add(`${pointId}:${str(item.id)}`);
            boundedText(item.title, `${label}.title`, MAX.title, issues);
            if (item.icon !== undefined && !icons.includes(str(item.icon)))
                issues.push(`${label}: unknown icon token ${str(item.icon)}`);
            if (point.form === 'iframe') {
                if (item.command !== undefined || item.workspace !== undefined)
                    issues.push(`${label}: iframe points take a view, not a command or workspace`);
                if (item.view !== undefined && !isHashRoute(item.view))
                    issues.push(`${label}: view must be a hash route such as "#/panel"`);
                continue;
            }
            if (item.view !== undefined)
                issues.push(`${label}: declarative points take a command or workspace, not a view`);
            const hasCommand = item.command !== undefined;
            const hasWorkspace = item.workspace !== undefined;
            if (hasCommand && !ITEM_ID_PATTERN.test(str(item.command)))
                issues.push(`${label}: command must be a slug`);
            if (hasCommand && !entrypoints?.worker)
                issues.push(`${label}: a command requires entrypoints.worker`);
            if (hasWorkspace && !workspaceIds.has(str(item.workspace)))
                issues.push(`${label}: workspace ${str(item.workspace)} is not declared in contributes.workspace`);
            if (pointId === 'settings.section') {
                if (hasCommand || hasWorkspace)
                    issues.push(`${label}: settings.section is generated from manifest.settings`);
                if (!isRecord(manifest.settings))
                    issues.push(`${label}: settings.section requires manifest.settings`);
            }
            else if (pointId === 'sidebar.item') {
                if (!hasWorkspace || hasCommand)
                    issues.push(`${label}: sidebar.item must open a workspace`);
            }
            else if (pointId === 'row.badge.track') {
                if (!hasCommand || hasWorkspace)
                    issues.push(`${label}: row.badge.track must name the command that computes the badge`);
            }
            else if (hasCommand === hasWorkspace) {
                issues.push(`${label}: set exactly one of command or workspace`);
            }
        }
    }
}
function isAllowedHost(value) {
    if (typeof value !== 'string')
        return false;
    const host = value.toLowerCase();
    if (host !== value || !HOST_PATTERN.test(host))
        return false;
    const bare = host.startsWith('*.') ? host.slice(2) : host;
    if (bare.split('.').length < 2)
        return false;
    return !PRIVATE_SUFFIXES.some((suffix) => `.${bare}`.endsWith(suffix));
}
function isBundlePath(value) {
    if (typeof value !== 'string' || !value || value.length > 200)
        return false;
    if (value.startsWith('/') || value.includes('\\') || value.includes('://') || /[\u0000-\u001f]/.test(value))
        return false;
    return !value.split('/').some((segment) => segment === '..' || segment === '.' || segment === '');
}
function isHashRoute(value) {
    return typeof value === 'string' && /^#\/[A-Za-z0-9/_-]{0,100}$/.test(value);
}
function isHttpsUrl(value) {
    if (typeof value !== 'string')
        return false;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && !url.username && !url.password;
    }
    catch {
        return false;
    }
}
function boundedText(value, label, max, issues) {
    if (!nonEmpty(value))
        issues.push(`${label} is required`);
    else if (value.length > max || /[\u0000-\u001f\u007f]/.test(value))
        issues.push(`${label} must be at most ${max} printable characters`);
}
function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function nonEmpty(value) {
    return typeof value === 'string' && value.trim().length > 0;
}
function str(value) {
    return typeof value === 'string' ? value : '';
}
function isJsonSerializable(value) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean')
        return true;
    if (typeof value === 'number')
        return Number.isFinite(value);
    if (Array.isArray(value))
        return value.every(isJsonSerializable);
    return isRecord(value) && Object.values(value).every(isJsonSerializable);
}
function deepFreeze(value) {
    if (value && typeof value === 'object') {
        Object.freeze(value);
        for (const child of Object.values(value))
            deepFreeze(child);
    }
    return value;
}
