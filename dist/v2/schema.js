import { EXTENSION_POINT_CATALOG, PLUGIN_ICON_TOKENS } from './extension-points.js';
import { PLUGIN_PERMISSION_CATALOG } from './permissions.js';
const item = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'title'],
    properties: {
        id: { type: 'string', pattern: '^[a-z0-9]+(?:[a-z0-9.-]*[a-z0-9])?$', maxLength: 64 },
        title: { type: 'string', minLength: 1, maxLength: 60 },
        icon: { enum: [...PLUGIN_ICON_TOKENS] },
        command: { type: 'string', pattern: '^[a-z0-9]+(?:[a-z0-9.-]*[a-z0-9])?$' },
        workspace: { type: 'string' },
        view: { type: 'string', pattern: '^#/[A-Za-z0-9/_-]{0,100}$' },
    },
};
/**
 * JSON Schema (draft 2020-12) for `schemaVersion: 2` manifests. It describes
 * the shape for editors and AI tools; `validatePluginManifestV2` is
 * authoritative and also enforces cross-field rules.
 */
export const PLUGIN_MANIFEST_V2_JSON_SCHEMA = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://docs.tapemusicsuite.com/schemas/plugin-manifest.v2.schema.json',
    title: 'Tape plugin manifest v2',
    type: 'object',
    additionalProperties: false,
    required: ['schemaVersion', 'id', 'name', 'version', 'description', 'kind', 'tier', 'engines', 'permissions', 'entrypoints'],
    properties: {
        $schema: { type: 'string' },
        schemaVersion: { const: 2 },
        id: { type: 'string', pattern: '^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?$', maxLength: 64 },
        name: { type: 'string', minLength: 1, maxLength: 60 },
        version: { type: 'string', description: 'semver' },
        description: { type: 'string', minLength: 1, maxLength: 280 },
        kind: { enum: ['plugin', 'theme', 'module'] },
        tier: { enum: ['core', 'official', 'verified', 'community', 'local-dev'] },
        publisher: {
            type: 'object',
            additionalProperties: false,
            required: ['name'],
            properties: { name: { type: 'string', minLength: 1 }, url: { type: 'string', format: 'uri' } },
        },
        source: {
            type: 'object',
            additionalProperties: false,
            required: ['license'],
            properties: { repository: { type: 'string', format: 'uri' }, license: { type: 'string', minLength: 1 } },
        },
        engines: {
            type: 'object',
            additionalProperties: false,
            required: ['tape', 'pluginApi'],
            properties: { tape: { type: 'string', examples: ['>=0.6.0'] }, pluginApi: { type: 'string', examples: ['2'] } },
        },
        permissions: {
            type: 'array',
            uniqueItems: true,
            maxItems: 24,
            items: { enum: PLUGIN_PERMISSION_CATALOG.map((entry) => entry.id) },
        },
        network: {
            type: 'object',
            additionalProperties: false,
            required: ['allow'],
            properties: { allow: { type: 'array', maxItems: 10, items: { type: 'string' } } },
        },
        dataDisclosure: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['domain', 'data', 'purpose'],
                properties: { domain: { type: 'string' }, data: { type: 'string' }, purpose: { type: 'string' } },
            },
        },
        activation: {
            type: 'array',
            maxItems: 20,
            items: { type: 'string', pattern: '^(onStartup|onCommand:.+|onEvent:.+|onView:.+)$' },
        },
        entrypoints: {
            type: 'object',
            additionalProperties: false,
            properties: { worker: { type: 'string' }, ui: { type: 'string' }, theme: { type: 'string' } },
        },
        contributes: {
            type: 'object',
            additionalProperties: false,
            properties: Object.fromEntries(EXTENSION_POINT_CATALOG.map((point) => [point.id, { type: 'array', maxItems: point.maxItemsPerPlugin, items: item, description: point.description }])),
        },
        settings: {
            type: 'object',
            maxProperties: 30,
            additionalProperties: {
                type: 'object',
                required: ['type', 'title'],
                properties: {
                    type: { enum: ['string', 'number', 'boolean', 'select'] },
                    title: { type: 'string', maxLength: 60 },
                    description: { type: 'string' },
                    default: {},
                    secret: { type: 'boolean' },
                    maxLength: { type: 'number' },
                    min: { type: 'number' },
                    max: { type: 'number' },
                    options: { type: 'array', items: { type: 'string' } },
                },
            },
        },
    },
};
