export type PluginViewTone = 'default' | 'muted' | 'success' | 'warning' | 'danger';
export type PluginViewGap = 'none' | 'sm' | 'md' | 'lg';
/** Artwork reference. Exactly one of the two ids. */
export type PluginViewImageRef = {
    trackId: string;
    albumId?: never;
} | {
    albumId: string;
    trackId?: never;
};
export interface PluginViewAction {
    label: string;
    /** Worker command run with `{ viewId, args, state }`. */
    command: string;
    args?: Record<string, unknown>;
    tone?: 'default' | 'primary' | 'danger';
    /** When set, Tape asks the user to confirm with this text first. */
    confirm?: string;
}
export interface PluginViewListItem {
    id: string;
    title: string;
    subtitle?: string;
    image?: PluginViewImageRef;
    badges?: string[];
    actions?: PluginViewAction[];
}
export type PluginViewFormField = {
    name: string;
    label: string;
    type: 'text';
    default?: string;
    placeholder?: string;
    required?: boolean;
} | {
    name: string;
    label: string;
    type: 'number';
    default?: number;
    min?: number;
    max?: number;
    required?: boolean;
} | {
    name: string;
    label: string;
    type: 'select';
    options: Array<{
        value: string;
        label: string;
    }>;
    default?: string;
    required?: boolean;
} | {
    name: string;
    label: string;
    type: 'toggle';
    default?: boolean;
};
export type PluginViewNode = {
    type: 'stack';
    direction?: 'vertical' | 'horizontal';
    gap?: PluginViewGap;
    children: PluginViewNode[];
} | {
    type: 'section';
    title: string;
    children: PluginViewNode[];
} | {
    type: 'text';
    value: string;
    tone?: PluginViewTone;
} | {
    type: 'heading';
    value: string;
    level?: 1 | 2 | 3;
} | {
    type: 'badge';
    value: string;
    tone?: PluginViewTone;
} | ({
    type: 'image';
    size?: 'sm' | 'md' | 'lg';
} & PluginViewImageRef) | {
    type: 'list';
    items: PluginViewListItem[];
} | {
    type: 'table';
    columns: Array<{
        key: string;
        title: string;
    }>;
    rows: Array<Record<string, string | number | boolean | null>>;
} | ({
    type: 'button';
} & PluginViewAction) | {
    type: 'form';
    fields: PluginViewFormField[];
    submit: {
        label?: string;
        command: string;
        args?: Record<string, unknown>; /** When set, Tape asks the user to confirm with this text before submitting. */
        confirm?: string;
    };
} | {
    type: 'empty';
    title: string;
    message?: string;
} | {
    type: 'progress';
    label?: string; /** 0..1. Omit for an indeterminate bar. */
    value?: number;
};
export type PluginViewNodeType = PluginViewNode['type'];
/** What a `render` command (or a view action) returns. */
export interface PluginViewResult {
    /** The tree to draw. Omit after an action that changed nothing visible. */
    view?: PluginViewNode;
    /** Replaces the view state passed to the next call. Must be JSON and small. */
    state?: unknown;
    /** Short message shown to the user. */
    toast?: string;
    /** Open another workspace of this plugin. */
    navigate?: {
        workspace: string;
    };
}
export declare const PLUGIN_VIEW_NODE_TYPES: readonly ["stack", "section", "text", "heading", "badge", "image", "list", "table", "button", "form", "empty", "progress"];
/** Limits of a view tree. Mirrors `PLUGIN_HARD_LIMITS.view*`. */
export declare const PLUGIN_VIEW_LIMITS: {
    readonly maxBytes: number;
    readonly maxDepth: 12;
    readonly maxNodes: 2000;
    readonly maxTableRows: 500;
};
/** A command id in a view: lowercase letters and digits, with `.` and `-` inside (at most 64 characters). The Hub checks actions with the same pattern. */
export declare const COMMAND_PATTERN: RegExp;
/**
 * Validate a declarative view tree. Returns human-readable issues; empty means
 * valid. Enforces size, depth and node limits, allowed node types and props,
 * and that no string anywhere is a URL.
 */
export declare function validatePluginViewTree(tree: unknown): string[];
/**
 * JSON Schema (draft 2020-12) for a declarative view tree (the root node).
 * It describes shape and per-field limits. The size, depth and node-count
 * limits and the "no URLs in any string" rule cannot be expressed in JSON
 * Schema; `validatePluginViewTree` is authoritative and enforces them.
 */
export declare const PLUGIN_VIEW_V1_JSON_SCHEMA: {
    readonly $schema: "https://json-schema.org/draft/2020-12/schema";
    readonly $id: "https://docs.tapemusicsuite.com/schemas/plugin-view.v1.schema.json";
    readonly title: "Tape declarative plugin view v1";
    readonly description: `A tree of Tape-drawn components. At most ${number} bytes serialized, 12 levels deep (the root is level 1) and 2000 nodes (list items and table rows count as one each). No string may be a URL; artwork is referenced by trackId or albumId.`;
    readonly $ref: "#/$defs/node";
    readonly $defs: {
        readonly node: {
            readonly oneOf: {
                $ref: string;
            }[];
        };
        readonly stack: {
            type: string;
            additionalProperties: boolean;
            required: string[];
            properties: {
                type: {
                    const: string;
                };
            };
        };
        readonly section: {
            type: string;
            additionalProperties: boolean;
            required: string[];
            properties: {
                type: {
                    const: string;
                };
            };
        };
        readonly text: {
            type: string;
            additionalProperties: boolean;
            required: string[];
            properties: {
                type: {
                    const: string;
                };
            };
        };
        readonly heading: {
            type: string;
            additionalProperties: boolean;
            required: string[];
            properties: {
                type: {
                    const: string;
                };
            };
        };
        readonly badge: {
            type: string;
            additionalProperties: boolean;
            required: string[];
            properties: {
                type: {
                    const: string;
                };
            };
        };
        readonly image: {
            readonly oneOf: readonly [{
                readonly required: readonly ["trackId"];
            }, {
                readonly required: readonly ["albumId"];
            }];
            readonly type: string;
            readonly additionalProperties: boolean;
            readonly required: string[];
            readonly properties: {
                type: {
                    const: string;
                };
            };
        };
        readonly list: {
            type: string;
            additionalProperties: boolean;
            required: string[];
            properties: {
                type: {
                    const: string;
                };
            };
        };
        readonly table: {
            type: string;
            additionalProperties: boolean;
            required: string[];
            properties: {
                type: {
                    const: string;
                };
            };
        };
        readonly button: {
            type: string;
            additionalProperties: boolean;
            required: string[];
            properties: {
                type: {
                    const: string;
                };
            };
        };
        readonly form: {
            type: string;
            additionalProperties: boolean;
            required: string[];
            properties: {
                type: {
                    const: string;
                };
            };
        };
        readonly empty: {
            type: string;
            additionalProperties: boolean;
            required: string[];
            properties: {
                type: {
                    const: string;
                };
            };
        };
        readonly progress: {
            type: string;
            additionalProperties: boolean;
            required: string[];
            properties: {
                type: {
                    const: string;
                };
            };
        };
    };
};
//# sourceMappingURL=views.d.ts.map