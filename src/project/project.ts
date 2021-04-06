import * as fs from "fs";
import * as path from "path";
import * as editorUtil from "../editorUtil";
import { makeElement } from "../util";
import Tab from "./tab/tab";
import TextTab from "./tab/textTab";

export default class Project {
    private rootDir: string;
    private tabs: Tab[] = [];
    private currentTab?: Tab;

    constructor(rootDir: string) {
        this.rootDir = rootDir;
        if (editorUtil.isEditorLoaded()) {
            this.setupEditorIntelligence();
        }
    }

    public getRootDir(): string {
        return this.rootDir;
    }

    public getTabs(): Tab[] {
        return this.tabs;
    }

    public getCurrentTab(): Tab | null {
        return this.currentTab || null;
    }

    public getTab(filePath: string): Tab | null {
        filePath = path.normalize(filePath);
        for (const tab of this.tabs) {
            if (tab.getFilePath() == filePath) return tab;
        }
        return null;
    }

    private async renderFolder(folderPath: string, container: HTMLElement) {
        const projectThis = this;
        const dirEntries = await fs.promises.readdir(folderPath);
        let entries = [];
        for (const entry of dirEntries) {
            const filePath = path.resolve(folderPath, entry);
            const stat = await fs.promises.stat(filePath);
            entries.push({
                entry,
                filePath,
                stat
            });
        }
        entries = entries.filter(({entry}) => {
            if (entry == ".DS_Store") return false;

            return true;
        });
        entries.sort((a, b) => {
            if (a.stat.isDirectory()) {
                if (b.stat.isDirectory()) return 0;
                else return -1;
            } else if (b.stat.isDirectory()) {
                return 1;
            } else if (a.entry < b.entry) {
                return -1;
            } else if (a.entry > b.entry) {
                return 1;
            } else {
                return 0;
            }
        });
        for (const {entry} of entries) {
            const filePath = path.resolve(folderPath, entry);
            const stat = await fs.promises.stat(filePath);
            const element = makeElement({
                tag: "span",
                className: "file-entry " + (stat.isDirectory() ? "folder" : (stat.isFile() ? "file" : "unknown")),
                textContent: entry
            });
            switch (path.extname(filePath)) {
                case ".json":
                case ".mcmeta":
                    element.classList.add("file-json");
                    break;
                case ".txt":
                    element.classList.add("file-text");
                    break;
                case ".png":
                    element.classList.add("file-image");
                    break;
            }
            element.setAttribute("data-path", filePath);
            if (stat.isFile()) {
                element.addEventListener("click", async function() {
                    const path = this.getAttribute("data-path");
                    if (path == null) throw new Error("No data-path attribute on file.");
                    let tab = projectThis.getTab(path);
                    if (tab == null) {
                        tab = new TextTab(projectThis, path);
                        await tab.init();
                        projectThis.tabs.push(tab);
                        tab.render();
                    }
                    await tab.open();
                });
            } else if (stat.isDirectory()) {
                element.addEventListener("click", async function(e: MouseEvent) {
                    if (!(e.composedPath()[0] == this)) return;

                    const path = this.getAttribute("data-path");
                    if (path == null) throw new Error("No data-path attribute on folder.");
                    let subdir: HTMLElement | null = this.querySelector(".subdir");
                    if (subdir == null) {
                        subdir = makeElement({
                            tag: "div",
                            className: "subdir"
                        });
                        projectThis.renderFolder(path, subdir);
                        this.appendChild(subdir);
                    }
                    this.classList.toggle("open");
                });
            }
            container?.appendChild(element);
        }
    }

    public async renderFiles() {
        const container = document.getElementById("files");
        if (container == null) throw new Error("Can not render files before the document has loaded.");
        this.renderFolder(this.rootDir, container);
    }

    public setupEditorIntelligence() {
        console.log("setupEditorIntelligence");
        editorUtil.getMonaco().languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            schemas: [
                {
                    uri: "rp-ide://schemas/pack-mcmeta.json",
                    fileMatch: [
                        editorUtil.getMonaco().Uri.file(path.resolve(this.rootDir, "pack.mcmeta")).toString(),
                        editorUtil.getMonaco().Uri.file(path.resolve(this.rootDir, "pack.rpc.mcmeta")).toString()
                    ],
                    schema: {
                        type: "object",
                        title: "Resource Pack Information",
                        description: "A file used to detect the resource pack.",
                        required: ["pack"],
                        properties: {
                            "pack": {
                                type: "object",
                                description: "Main resource pack object that holds information about the resource pack.",
                                properties: {
                                    "pack_format": {
                                        type: "integer",
                                        description: "The format version of the resource pack."
                                    },
                                    "description": {
                                        type: "string",
                                        description: "Two lines of text describing the resource pack. Is shown in the resource pack menu. Can contain color codes by using the '§' character. Lines are separated using \\n."
                                    }
                                }
                            },
                            "languages": {
                                type: "object",
                                description: "Information about languages this resource pack adds.",
                                additionalProperties: {
                                    type: "object",
                                    description: "The key of this language object is the language code. A file with the same name should be located at 'assets/minecraft/lang/<code>.json'.",
                                    properties: {
                                        "name": {
                                            type: "string",
                                            description: "The name of the language."
                                        },
                                        "region": {
                                            type: "string",
                                            description: "Country or region name."
                                        },
                                        "bidirectional": {
                                            type: "boolean",
                                            description: "Whether the language reads right to left or not."
                                        }
                                    }
                                }
                            },
                            "rpCompiler": {
                                type: "object",
                                title: "Resource Pack Compiler Information",
                                description: "Contains information used by rpCompiler (an experimental tool used for automating parts of resource pack creation).",
                                properties: {
                                    "name": {
                                        type: "string",
                                        description: "The name of the pack, will be used when the pack is uploaded to rpCompiler. Will also be the a part of the name of the final compiled pack.",
                                    },
                                    "onCompile": {
                                        type: "string",
                                        description: "Path to a file to run when the pack is being compiled. Will search in the same directory as the pack.mcmeta is in. For example 'rpCompiler.js'.",
                                        default: "rpCompiler.js"
                                    },
                                    "type": {
                                        enum: ["pack", "library", "combination"],
                                        description: "The type of pack this rpCompiler pack is."
                                    },
                                    "libraries": {
                                        type: "array",
                                        description: "A list of libraries to include in the final compiled pack.",
                                        items: {
                                            type: "string"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        });
    }
}