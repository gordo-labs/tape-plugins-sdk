/**
 * Declarative plugin views (Plugin API 2.1).
 *
 * A workspace item with `render: "<commandId>"` is drawn by Tape from the JSON
 * tree that command returns, using Tape's own components (theme, accessibility
 * and mobile included). The plugin ships no HTML. Trees contain no URLs: artwork
 * is referenced by `trackId` or `albumId` only.
 *
 * The command receives `{ viewId, state }` (and `args` when an action ran it)
 * and returns a `PluginViewResult`. Actions (`button`, `form`, list item
 * actions) run the plugin command with `{ viewId, args, state }`.
 */
import { PLUGIN_HARD_LIMITS } from './limits.js';
export const PLUGIN_VIEW_NODE_TYPES = [
    'stack', 'section', 'text', 'heading', 'badge', 'image', 'list', 'table', 'button', 'form', 'empty', 'progress',
];
/** Limits of a view tree. Mirrors `PLUGIN_HARD_LIMITS.view*`. */
export const PLUGIN_VIEW_LIMITS = {
    maxBytes: PLUGIN_HARD_LIMITS.viewMaxBytes,
    maxDepth: PLUGIN_HARD_LIMITS.viewMaxDepth,
    maxNodes: PLUGIN_HARD_LIMITS.viewMaxNodes,
    maxTableRows: PLUGIN_HARD_LIMITS.viewMaxTableRows,
};
const TONES = ['default', 'muted', 'success', 'warning', 'danger'];
const GAPS = ['none', 'sm', 'md', 'lg'];
const BUTTON_TONES = ['default', 'primary', 'danger'];
/** A command id in a view: lowercase letters and digits, with `.` and `-` inside (at most 64 characters). The Hub checks actions with the same pattern. */
export const COMMAND_PATTERN = /^[a-z0-9]+(?:[a-z0-9.-]*[a-z0-9])?$/;
const SLUG_KEY = /^[A-Za-z][A-Za-z0-9_]{0,39}$/;
const URL_LIKE = /(?:^|[^a-z0-9+.-])[a-z][a-z0-9+.-]*:\/\/|^\s*(?:data|javascript|blob|file|vbscript):/i;
const TEXT_MAX = 2_000;
const SHORT_MAX = 120;
const PROPS = {
    stack: ['type', 'direction', 'gap', 'children'],
    section: ['type', 'title', 'children'],
    text: ['type', 'value', 'tone'],
    heading: ['type', 'value', 'level'],
    badge: ['type', 'value', 'tone'],
    image: ['type', 'trackId', 'albumId', 'size'],
    list: ['type', 'items'],
    table: ['type', 'columns', 'rows'],
    button: ['type', 'label', 'command', 'args', 'tone', 'confirm'],
    form: ['type', 'fields', 'submit'],
    empty: ['type', 'title', 'message'],
    progress: ['type', 'label', 'value'],
};
/**
 * Validate a declarative view tree. Returns human-readable issues; empty means
 * valid. Enforces size, depth and node limits, allowed node types and props,
 * and that no string anywhere is a URL.
 */
export function validatePluginViewTree(tree) {
    const issues = [];
    let bytes = 0;
    try {
        const json = JSON.stringify(tree);
        if (json === undefined)
            return ['view must be JSON data'];
        bytes = new TextEncoder().encode(json).length;
    }
    catch {
        return ['view must be JSON data without cycles'];
    }
    if (bytes > PLUGIN_VIEW_LIMITS.maxBytes) {
        return [`view is ${bytes} bytes; the limit is ${PLUGIN_VIEW_LIMITS.maxBytes}`];
    }
    const state = { nodes: 0, issues, capped: false };
    checkNode(tree, 'view', 1, state);
    if (state.nodes > PLUGIN_VIEW_LIMITS.maxNodes)
        issues.push(`view has ${state.nodes} nodes; the limit is ${PLUGIN_VIEW_LIMITS.maxNodes}`);
    return issues;
}
function add(state, issue) {
    if (state.issues.length < 50)
        state.issues.push(issue);
    else
        state.capped = true;
}
function checkNode(value, path, depth, state) {
    if (!isRecord(value)) {
        add(state, `${path} must be an object`);
        return;
    }
    state.nodes += 1;
    if (depth > PLUGIN_VIEW_LIMITS.maxDepth) {
        add(state, `${path} is nested deeper than ${PLUGIN_VIEW_LIMITS.maxDepth} levels`);
        return;
    }
    if (state.nodes > PLUGIN_VIEW_LIMITS.maxNodes)
        return; // reported once by the caller; stop walking
    const type = value.type;
    if (typeof type !== 'string' || !PLUGIN_VIEW_NODE_TYPES.includes(type)) {
        add(state, `${path}: unknown node type ${JSON.stringify(type)}`);
        return;
    }
    const nodeType = type;
    for (const key of Object.keys(value)) {
        if (!PROPS[nodeType].includes(key))
            add(state, `${path}: ${nodeType} has no property "${key}"${isUrlProp(key) ? ' (views never contain URLs; use trackId or albumId for artwork)' : ''}`);
    }
    noUrls(value, path, state);
    switch (nodeType) {
        case 'stack':
            oneOf(value.direction, ['vertical', 'horizontal'], `${path}.direction`, state, true);
            oneOf(value.gap, GAPS, `${path}.gap`, state, true);
            children(value.children, path, depth, state);
            break;
        case 'section':
            text(value.title, `${path}.title`, SHORT_MAX, state);
            children(value.children, path, depth, state);
            break;
        case 'text':
            text(value.value, `${path}.value`, TEXT_MAX, state);
            oneOf(value.tone, TONES, `${path}.tone`, state, true);
            break;
        case 'heading':
            text(value.value, `${path}.value`, SHORT_MAX, state);
            oneOf(value.level, [1, 2, 3], `${path}.level`, state, true);
            break;
        case 'badge':
            text(value.value, `${path}.value`, 40, state);
            oneOf(value.tone, TONES, `${path}.tone`, state, true);
            break;
        case 'image':
            imageRef(value, path, state);
            oneOf(value.size, ['sm', 'md', 'lg'], `${path}.size`, state, true);
            break;
        case 'list':
            list(value.items, path, state);
            break;
        case 'table':
            table(value, path, state);
            break;
        case 'button':
            action(value, path, state);
            break;
        case 'form':
            form(value, path, state);
            break;
        case 'empty':
            text(value.title, `${path}.title`, SHORT_MAX, state);
            if (value.message !== undefined)
                text(value.message, `${path}.message`, TEXT_MAX, state);
            break;
        case 'progress':
            if (value.label !== undefined)
                text(value.label, `${path}.label`, SHORT_MAX, state);
            if (value.value !== undefined && !(typeof value.value === 'number' && value.value >= 0 && value.value <= 1))
                add(state, `${path}.value must be a number from 0 to 1`);
            break;
    }
}
function children(value, path, depth, state) {
    if (!Array.isArray(value)) {
        add(state, `${path}.children must be an array`);
        return;
    }
    value.forEach((child, index) => {
        if (state.nodes <= PLUGIN_VIEW_LIMITS.maxNodes)
            checkNode(child, `${path}.children[${index}]`, depth + 1, state);
    });
}
function list(items, path, state) {
    if (!Array.isArray(items)) {
        add(state, `${path}.items must be an array`);
        return;
    }
    state.nodes += items.length;
    const ids = new Set();
    items.forEach((item, index) => {
        const at = `${path}.items[${index}]`;
        if (!isRecord(item))
            return add(state, `${at} must be an object`);
        for (const key of Object.keys(item)) {
            if (!['id', 'title', 'subtitle', 'image', 'badges', 'actions'].includes(key))
                add(state, `${at} has no property "${key}"${isUrlProp(key) ? ' (views never contain URLs)' : ''}`);
        }
        text(item.id, `${at}.id`, SHORT_MAX, state);
        if (typeof item.id === 'string') {
            if (ids.has(item.id))
                add(state, `${at}.id is a duplicate`);
            ids.add(item.id);
        }
        text(item.title, `${at}.title`, SHORT_MAX, state);
        if (item.subtitle !== undefined)
            text(item.subtitle, `${at}.subtitle`, SHORT_MAX, state);
        if (item.image !== undefined) {
            if (!isRecord(item.image))
                add(state, `${at}.image must be { trackId } or { albumId }`);
            else
                imageRef(item.image, `${at}.image`, state, ['trackId', 'albumId']);
        }
        if (item.badges !== undefined) {
            if (!Array.isArray(item.badges) || item.badges.length > 5)
                add(state, `${at}.badges must be an array of at most 5 strings`);
            else
                item.badges.forEach((badge, b) => text(badge, `${at}.badges[${b}]`, 40, state));
        }
        if (item.actions !== undefined) {
            if (!Array.isArray(item.actions) || item.actions.length > 4)
                add(state, `${at}.actions must be an array of at most 4 actions`);
            else
                item.actions.forEach((entry, a) => (isRecord(entry) ? action(entry, `${at}.actions[${a}]`, state, true) : add(state, `${at}.actions[${a}] must be an object`)));
        }
    });
    if (items.length > PLUGIN_VIEW_LIMITS.maxTableRows)
        add(state, `${path}.items accepts at most ${PLUGIN_VIEW_LIMITS.maxTableRows} items`);
}
function table(value, path, state) {
    const { columns, rows } = value;
    const keys = new Set();
    if (!Array.isArray(columns) || columns.length === 0 || columns.length > 20)
        add(state, `${path}.columns must be an array of 1 to 20 columns`);
    else {
        columns.forEach((column, index) => {
            const at = `${path}.columns[${index}]`;
            if (!isRecord(column))
                return add(state, `${at} must be an object`);
            for (const key of Object.keys(column))
                if (!['key', 'title'].includes(key))
                    add(state, `${at} has no property "${key}"`);
            if (typeof column.key !== 'string' || !SLUG_KEY.test(column.key))
                add(state, `${at}.key must be an identifier`);
            else
                keys.add(column.key);
            text(column.title, `${at}.title`, SHORT_MAX, state);
        });
    }
    if (!Array.isArray(rows))
        return add(state, `${path}.rows must be an array`);
    if (rows.length > PLUGIN_VIEW_LIMITS.maxTableRows)
        add(state, `${path}.rows accepts at most ${PLUGIN_VIEW_LIMITS.maxTableRows} rows`);
    state.nodes += rows.length;
    rows.forEach((row, index) => {
        if (!isRecord(row))
            return add(state, `${path}.rows[${index}] must be an object`);
        for (const [key, cell] of Object.entries(row)) {
            if (keys.size && !keys.has(key))
                add(state, `${path}.rows[${index}] has a value for unknown column "${key}"`);
            if (!(cell === null || typeof cell === 'number' || typeof cell === 'boolean' || (typeof cell === 'string' && cell.length <= SHORT_MAX))) {
                add(state, `${path}.rows[${index}].${key} must be a short string, number, boolean or null`);
            }
        }
    });
}
function action(value, path, state, strictProps = false) {
    if (strictProps) {
        for (const key of Object.keys(value))
            if (!['label', 'command', 'args', 'tone', 'confirm'].includes(key))
                add(state, `${path} has no property "${key}"`);
    }
    text(value.label, `${path}.label`, 60, state);
    command(value.command, `${path}.command`, state);
    args(value.args, `${path}.args`, state);
    oneOf(value.tone, BUTTON_TONES, `${path}.tone`, state, true);
    if (value.confirm !== undefined)
        text(value.confirm, `${path}.confirm`, 280, state);
}
function form(value, path, state) {
    const fields = value.fields;
    if (!Array.isArray(fields) || fields.length === 0 || fields.length > 30)
        add(state, `${path}.fields must be an array of 1 to 30 fields`);
    else {
        const names = new Set();
        fields.forEach((field, index) => {
            const at = `${path}.fields[${index}]`;
            if (!isRecord(field))
                return add(state, `${at} must be an object`);
            if (typeof field.name !== 'string' || !SLUG_KEY.test(field.name))
                add(state, `${at}.name must be an identifier`);
            else if (names.has(field.name))
                add(state, `${at}.name is a duplicate`);
            else
                names.add(field.name);
            text(field.label, `${at}.label`, SHORT_MAX, state);
            const common = ['name', 'label', 'type', 'default', 'required'];
            switch (field.type) {
                case 'text':
                    unknownKeys(field, [...common, 'placeholder'], at, state);
                    if (field.default !== undefined && typeof field.default !== 'string')
                        add(state, `${at}.default must be a string`);
                    if (field.placeholder !== undefined)
                        text(field.placeholder, `${at}.placeholder`, SHORT_MAX, state);
                    break;
                case 'number':
                    unknownKeys(field, [...common, 'min', 'max'], at, state);
                    for (const key of ['default', 'min', 'max']) {
                        if (field[key] !== undefined && !(typeof field[key] === 'number' && Number.isFinite(field[key])))
                            add(state, `${at}.${key} must be a number`);
                    }
                    break;
                case 'select': {
                    unknownKeys(field, [...common, 'options'], at, state);
                    const options = field.options;
                    if (!Array.isArray(options) || options.length === 0 || options.length > 100)
                        add(state, `${at}.options must be an array of 1 to 100 options`);
                    else {
                        const values = new Set();
                        options.forEach((option, o) => {
                            if (!isRecord(option))
                                return add(state, `${at}.options[${o}] must be { value, label }`);
                            unknownKeys(option, ['value', 'label'], `${at}.options[${o}]`, state);
                            text(option.value, `${at}.options[${o}].value`, SHORT_MAX, state);
                            text(option.label, `${at}.options[${o}].label`, SHORT_MAX, state);
                            if (typeof option.value === 'string')
                                values.add(option.value);
                        });
                        if (field.default !== undefined && !values.has(field.default))
                            add(state, `${at}.default must be one of the options`);
                    }
                    break;
                }
                case 'toggle':
                    unknownKeys(field, ['name', 'label', 'type', 'default'], at, state);
                    if (field.default !== undefined && typeof field.default !== 'boolean')
                        add(state, `${at}.default must be a boolean`);
                    break;
                default:
                    add(state, `${at}.type must be text, number, select or toggle`);
            }
            if (field.required !== undefined && typeof field.required !== 'boolean')
                add(state, `${at}.required must be a boolean`);
        });
    }
    const submit = value.submit;
    if (!isRecord(submit))
        return add(state, `${path}.submit must be { command }`);
    unknownKeys(submit, ['label', 'command', 'args', 'confirm'], `${path}.submit`, state);
    if (submit.label !== undefined)
        text(submit.label, `${path}.submit.label`, 60, state);
    command(submit.command, `${path}.submit.command`, state);
    args(submit.args, `${path}.submit.args`, state);
    if (submit.confirm !== undefined)
        text(submit.confirm, `${path}.submit.confirm`, 280, state);
}
function imageRef(value, path, state, only) {
    const hasTrack = value.trackId !== undefined;
    const hasAlbum = value.albumId !== undefined;
    if (hasTrack === hasAlbum)
        add(state, `${path}: set exactly one of trackId or albumId`);
    if (hasTrack)
        text(value.trackId, `${path}.trackId`, SHORT_MAX, state);
    if (hasAlbum)
        text(value.albumId, `${path}.albumId`, SHORT_MAX, state);
    if (only)
        unknownKeys(value, only, path, state);
}
function command(value, path, state) {
    if (typeof value !== 'string' || !COMMAND_PATTERN.test(value) || value.length > 64)
        add(state, `${path} must be a command id (lowercase slug)`);
}
function args(value, path, state) {
    if (value === undefined)
        return;
    if (!isRecord(value))
        return add(state, `${path} must be an object`);
    if (JSON.stringify(value).length > 4_096)
        add(state, `${path} must be at most 4096 characters`);
}
function unknownKeys(value, allowed, path, state) {
    for (const key of Object.keys(value))
        if (!allowed.includes(key))
            add(state, `${path} has no property "${key}"`);
}
function oneOf(value, allowed, path, state, optional) {
    if (value === undefined && optional)
        return;
    if (!allowed.includes(value))
        add(state, `${path} must be one of ${allowed.join(', ')}`);
}
function text(value, path, max, state) {
    if (typeof value !== 'string' || value.length === 0 || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
        add(state, `${path} must be a string of 1 to ${max} characters`);
    }
}
/** Reject URLs in every string of the node (keys and values, nested objects such as `args` included). */
function noUrls(value, path, state) {
    if (typeof value === 'string') {
        if (URL_LIKE.test(value))
            add(state, `${path}: URLs are not allowed in views`);
    }
    else if (Array.isArray(value)) {
        value.forEach((entry, index) => noUrls(entry, `${path}[${index}]`, state));
    }
    else if (isRecord(value)) {
        for (const [key, entry] of Object.entries(value)) {
            if (key === 'children')
                continue; // child nodes are checked on their own walk
            noUrls(entry, `${path}.${key}`, state);
        }
    }
}
function isUrlProp(key) {
    return /^(url|src|href|link|uri|image_?url|icon_?url)$/i.test(key);
}
function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
const gap = { enum: GAPS };
const tone = { enum: TONES };
const short = { type: 'string', minLength: 1, maxLength: SHORT_MAX };
const command_ = { type: 'string', pattern: COMMAND_PATTERN.source, maxLength: 64 };
const argsSchema = { type: 'object', description: 'JSON passed to the command as `args`. No URLs.' };
const imageRefSchema = {
    type: 'object',
    additionalProperties: false,
    properties: { trackId: short, albumId: short },
    oneOf: [{ required: ['trackId'] }, { required: ['albumId'] }],
};
const actionProps = {
    label: { type: 'string', minLength: 1, maxLength: 60 },
    command: command_,
    args: argsSchema,
    tone: { enum: BUTTON_TONES },
    confirm: { type: 'string', minLength: 1, maxLength: 280 },
};
const node = (type, properties, required = []) => ({
    type: 'object',
    additionalProperties: false,
    required: ['type', ...required],
    properties: { type: { const: type }, ...properties },
});
/**
 * JSON Schema (draft 2020-12) for a declarative view tree (the root node).
 * It describes shape and per-field limits. The size, depth and node-count
 * limits and the "no URLs in any string" rule cannot be expressed in JSON
 * Schema; `validatePluginViewTree` is authoritative and enforces them.
 */
export const PLUGIN_VIEW_V1_JSON_SCHEMA = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://docs.tapemusicsuite.com/schemas/plugin-view.v1.schema.json',
    title: 'Tape declarative plugin view v1',
    description: `A tree of Tape-drawn components. At most ${PLUGIN_VIEW_LIMITS.maxBytes} bytes serialized, ${PLUGIN_VIEW_LIMITS.maxDepth} levels deep (the root is level 1) and ${PLUGIN_VIEW_LIMITS.maxNodes} nodes (list items and table rows count as one each). No string may be a URL; artwork is referenced by trackId or albumId.`,
    $ref: '#/$defs/node',
    $defs: {
        node: { oneOf: PLUGIN_VIEW_NODE_TYPES.map((type) => ({ $ref: `#/$defs/${type}` })) },
        stack: node('stack', { direction: { enum: ['vertical', 'horizontal'] }, gap, children: { type: 'array', items: { $ref: '#/$defs/node' } } }, ['children']),
        section: node('section', { title: short, children: { type: 'array', items: { $ref: '#/$defs/node' } } }, ['title', 'children']),
        text: node('text', { value: { type: 'string', minLength: 1, maxLength: TEXT_MAX }, tone }, ['value']),
        heading: node('heading', { value: short, level: { enum: [1, 2, 3] } }, ['value']),
        badge: node('badge', { value: { type: 'string', minLength: 1, maxLength: 40 }, tone }, ['value']),
        image: {
            ...node('image', { trackId: short, albumId: short, size: { enum: ['sm', 'md', 'lg'] } }),
            oneOf: [{ required: ['trackId'] }, { required: ['albumId'] }],
        },
        list: node('list', {
            items: {
                type: 'array',
                maxItems: PLUGIN_VIEW_LIMITS.maxTableRows,
                items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['id', 'title'],
                    properties: {
                        id: short,
                        title: short,
                        subtitle: short,
                        image: imageRefSchema,
                        badges: { type: 'array', maxItems: 5, items: { type: 'string', minLength: 1, maxLength: 40 } },
                        actions: {
                            type: 'array',
                            maxItems: 4,
                            items: { type: 'object', additionalProperties: false, required: ['label', 'command'], properties: actionProps },
                        },
                    },
                },
            },
        }, ['items']),
        table: node('table', {
            columns: {
                type: 'array',
                minItems: 1,
                maxItems: 20,
                items: { type: 'object', additionalProperties: false, required: ['key', 'title'], properties: { key: { type: 'string', pattern: SLUG_KEY.source }, title: short } },
            },
            rows: {
                type: 'array',
                maxItems: PLUGIN_VIEW_LIMITS.maxTableRows,
                items: { type: 'object', additionalProperties: { type: ['string', 'number', 'boolean', 'null'], maxLength: SHORT_MAX } },
            },
        }, ['columns', 'rows']),
        button: node('button', actionProps, ['label', 'command']),
        form: node('form', {
            fields: {
                type: 'array',
                minItems: 1,
                maxItems: 30,
                items: {
                    type: 'object',
                    required: ['name', 'label', 'type'],
                    properties: {
                        name: { type: 'string', pattern: SLUG_KEY.source },
                        label: short,
                        type: { enum: ['text', 'number', 'select', 'toggle'] },
                        default: {},
                        required: { type: 'boolean' },
                        placeholder: short,
                        min: { type: 'number' },
                        max: { type: 'number' },
                        options: {
                            type: 'array',
                            minItems: 1,
                            maxItems: 100,
                            items: { type: 'object', additionalProperties: false, required: ['value', 'label'], properties: { value: short, label: short } },
                        },
                    },
                },
            },
            submit: {
                type: 'object',
                additionalProperties: false,
                required: ['command'],
                properties: { label: { type: 'string', minLength: 1, maxLength: 60 }, command: command_, args: argsSchema, confirm: { type: 'string', minLength: 1, maxLength: 280 } },
            },
        }, ['fields', 'submit']),
        empty: node('empty', { title: short, message: { type: 'string', minLength: 1, maxLength: TEXT_MAX } }, ['title']),
        progress: node('progress', { label: short, value: { type: 'number', minimum: 0, maximum: 1 } }),
    },
};
