/**
 * JSON Schema (draft 2020-12) for `schemaVersion: 2` manifests. It describes
 * the shape for editors and AI tools; `validatePluginManifestV2` is
 * authoritative and also enforces cross-field rules.
 */
export declare const PLUGIN_MANIFEST_V2_JSON_SCHEMA: {
    readonly $schema: "https://json-schema.org/draft/2020-12/schema";
    readonly $id: "https://docs.tapemusicsuite.com/schemas/plugin-manifest.v2.schema.json";
    readonly title: "Tape plugin manifest v2";
    readonly type: "object";
    readonly additionalProperties: false;
    readonly required: readonly ["schemaVersion", "id", "name", "version", "description", "kind", "tier", "engines", "permissions", "entrypoints"];
    readonly properties: {
        readonly $schema: {
            readonly type: "string";
        };
        readonly schemaVersion: {
            readonly const: 2;
        };
        readonly id: {
            readonly type: "string";
            readonly pattern: "^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?$";
            readonly maxLength: 64;
        };
        readonly name: {
            readonly type: "string";
            readonly minLength: 1;
            readonly maxLength: 60;
        };
        readonly version: {
            readonly type: "string";
            readonly description: "semver";
        };
        readonly description: {
            readonly type: "string";
            readonly minLength: 1;
            readonly maxLength: 280;
        };
        readonly kind: {
            readonly enum: readonly ["plugin", "theme", "module"];
        };
        readonly tier: {
            readonly enum: readonly ["core", "official", "verified", "community", "local-dev"];
        };
        readonly publisher: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["name"];
            readonly properties: {
                readonly name: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly url: {
                    readonly type: "string";
                    readonly format: "uri";
                };
            };
        };
        readonly source: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["license"];
            readonly properties: {
                readonly repository: {
                    readonly type: "string";
                    readonly format: "uri";
                };
                readonly license: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
            };
        };
        readonly engines: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["tape", "pluginApi"];
            readonly properties: {
                readonly tape: {
                    readonly type: "string";
                    readonly examples: readonly [">=0.6.0"];
                };
                readonly pluginApi: {
                    readonly type: "string";
                    readonly examples: readonly ["2"];
                };
            };
        };
        readonly permissions: {
            readonly type: "array";
            readonly uniqueItems: true;
            readonly maxItems: 24;
            readonly items: {
                readonly enum: ("library.read" | "library.metadata.read" | "library.folders.read" | "metadata.propose" | "library.organize.propose" | "playback.read" | "network.fetch" | "storage.private" | "ui.contribute" | "notifications.show" | "diagnostics.write" | "tags.write.propose" | "library.files.read" | "library.files.write" | "library.organize.apply" | "metadata.apply" | "playlists.write" | "jobs.schedule" | "playback.control" | "audio.analyze" | "audio.process" | "ui.mobile" | "ui.theme" | "network.connect" | "network.iroh:music-hub-network" | "storage.addon:music-hub-network")[];
            };
        };
        readonly network: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["allow"];
            readonly properties: {
                readonly allow: {
                    readonly type: "array";
                    readonly maxItems: 10;
                    readonly items: {
                        readonly type: "string";
                    };
                };
            };
        };
        readonly dataDisclosure: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly required: readonly ["domain", "data", "purpose"];
                readonly properties: {
                    readonly domain: {
                        readonly type: "string";
                    };
                    readonly data: {
                        readonly type: "string";
                    };
                    readonly purpose: {
                        readonly type: "string";
                    };
                };
            };
        };
        readonly activation: {
            readonly type: "array";
            readonly maxItems: 20;
            readonly items: {
                readonly type: "string";
                readonly pattern: "^(onStartup|onCommand:.+|onEvent:.+|onView:.+)$";
            };
        };
        readonly entrypoints: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                readonly worker: {
                    readonly type: "string";
                };
                readonly ui: {
                    readonly type: "string";
                };
                readonly theme: {
                    readonly type: "string";
                };
            };
        };
        readonly contributes: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly properties: {
                [k: string]: {
                    type: string;
                    maxItems: 1 | 2 | 3 | 10;
                    items: {
                        readonly type: "object";
                        readonly additionalProperties: false;
                        readonly required: readonly ["id", "title"];
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                                readonly pattern: "^[a-z0-9]+(?:[a-z0-9.-]*[a-z0-9])?$";
                                readonly maxLength: 64;
                            };
                            readonly title: {
                                readonly type: "string";
                                readonly minLength: 1;
                                readonly maxLength: 60;
                            };
                            readonly icon: {
                                readonly enum: readonly ["plugin", "wishlist", "music", "album", "artist", "playlist", "folder", "tag", "search", "sparkle", "link", "upload", "download", "share", "chart", "clock", "star", "heart", "info", "settings"];
                            };
                            readonly command: {
                                readonly type: "string";
                                readonly pattern: "^[a-z0-9]+(?:[a-z0-9.-]*[a-z0-9])?$";
                            };
                            readonly workspace: {
                                readonly type: "string";
                            };
                            readonly view: {
                                readonly type: "string";
                                readonly pattern: "^#/[A-Za-z0-9/_-]{0,100}$";
                            };
                            readonly render: {
                                readonly type: "string";
                                readonly pattern: "^[a-z0-9]+(?:[a-z0-9.-]*[a-z0-9])?$";
                                readonly maxLength: 64;
                                readonly description: "Workspace items: worker command returning a declarative view tree (see plugin-view.v1.schema.json). Exclusive with view.";
                            };
                            readonly mobile: {
                                readonly type: "boolean";
                                readonly description: "Iframe workspace items: also show on the paired phone. Requires ui.mobile.";
                            };
                        };
                    };
                    description: "Entry in the sidebar that opens one of the plugin workspaces." | "Full view inside the main area, rendered from entrypoints.ui." | "Right-click menu item on a track." | "Right-click menu item on an album." | "Right-click menu item on an artist." | "Right-click menu item on a label." | "Right-click menu item on a playlist." | "Right-click menu item on a library folder." | "Right-click menu item on a multi-track selection." | "Section in the track details view." | "Section in the album view." | "Section in the artist view." | "Section in the playlist view." | "Short text badge in track rows, computed by a worker command." | "Settings form generated by Tape from manifest.settings." | "Command in the command palette." | "Panel next to the player, such as lyrics or notes." | "Library filter applied by Tape over track fields." | "Compact control in the player bar." | "Action in the library header." | "Item in the status bar." | "Full replacement of the Desktop interface over the client core.";
                };
            };
        };
        readonly settings: {
            readonly type: "object";
            readonly maxProperties: 30;
            readonly additionalProperties: {
                readonly type: "object";
                readonly required: readonly ["type", "title"];
                readonly properties: {
                    readonly type: {
                        readonly enum: readonly ["string", "number", "boolean", "select"];
                    };
                    readonly title: {
                        readonly type: "string";
                        readonly maxLength: 60;
                    };
                    readonly description: {
                        readonly type: "string";
                    };
                    readonly default: {};
                    readonly secret: {
                        readonly type: "boolean";
                    };
                    readonly maxLength: {
                        readonly type: "number";
                    };
                    readonly min: {
                        readonly type: "number";
                    };
                    readonly max: {
                        readonly type: "number";
                    };
                    readonly options: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=schema.d.ts.map