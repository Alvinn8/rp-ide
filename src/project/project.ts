import * as fs from "fs";
import * as path from "path";
import { ContextMenu } from "../contextmenu";
import * as editorUtil from "../editorUtil";
import PackFormat, { getPackFormat } from "../packFormats";
import { makeElement } from "../util";
import { updateAllProjectsJson, updateProjectJson } from "./projects";
import Tab from "./tab/tab";
import TextTab from "./tab/textTab";
import * as dialog from "../dialog";
import { shell } from "electron";

export interface ProjectInfo {
    rootDir: string;
    packFormat: number;
    name: string;
    lastOpened: string;
}

export interface ShortProjectInfo {
    name: string;
    lastOpened: string;
    hash: string;
}

export default class Project {
    private rootDir: string;
    private packFormat: PackFormat;
    private name: string;
    private tabs: Tab[] = [];
    private currentTab?: Tab;

    constructor(info: ProjectInfo) {
        this.rootDir = info.rootDir;
        this.name = info.name;

        const packFormat = getPackFormat(info.packFormat);
        if (packFormat == null) throw new Error(`Can not find pack format for: "${info.packFormat}"`);
        this.packFormat = packFormat;

        if (editorUtil.isEditorLoaded()) {
            this.setupEditorIntelligence();
        }

        updateAllProjectsJson(this);
        updateProjectJson(this);
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

    public getPackFormat(): PackFormat {
        return this.packFormat;
    }

    public getName(): string {
        return this.name;
    }

    public getProjectInfo(): ProjectInfo {
        return {
            rootDir: this.rootDir,
            packFormat: this.packFormat.packFormat,
            lastOpened: new Date().toJSON(),
            name: this.name
        };
    }

    /**
     * Called when a context menu is triggered in the files view.
     * 
     * @param e The event that triggered the context menu
     * @param path_ The path of the file or folder that was clicked.
     * @param isFile Whether the click entry is a file
     * @param isDirectory Whether the click entry is a directory
     */
    public onFilesContextmenu(e: MouseEvent, path_: string, isFile: boolean, isDirectory: boolean) {
        const contextmenu = new ContextMenu();
        contextmenu.addEntry({
            name: "Test",
            onclick: function(e: MouseEvent) {
                shell.beep();
            }
        });
        if (isDirectory) {
            contextmenu.setCategoryPriority("new", 10);
            contextmenu.addEntry("new", {
                name: "New File",
                onclick: (e: MouseEvent) => {
                    dialog.prompt("Create new file", "Enter the name and extention of the file to create.", name => {
                        const filePath = path.resolve(path_, name);
                        fs.promises.access(filePath).then(function() {
                            dialog.info("Error", "That file already exists.");
                        }).catch(() => {
                            fs.promises.writeFile(filePath, Buffer.alloc(0)).then(() => {
                                this.renderFiles();
                            }).catch(function(err) {
                                dialog.info("Unexpected Error", err.toString());
                                throw err;
                            });
                        });
                    });
                }
            });
            contextmenu.addEntry("new", {
                name: "New Folder",
                onclick: (e: MouseEvent) => {
                    dialog.prompt("Create new folder", "Enter the name of the folder to create.", name => {
                        fs.promises.mkdir(path.resolve(path_, name)).then(() => {
                            this.renderFiles();
                        }).catch(function(err) {
                            if (err.code == 'EEXIST') {
                                dialog.info("Error", "That folder already exists.");
                            } else {
                                dialog.info("Unexpected Error", err.toString());
                                throw err;
                            }
                        });
                    });
                }
            });
        }
        if (isFile) {
            contextmenu.addEntry({
                name: "View in " + (process.platform == "darwin" ? "Finder" : "File Explorer"),
                onclick: (e: MouseEvent) => {
                    shell.showItemInFolder(path_);
                }
            });
            contextmenu.addEntry({
                name: "Open with default external program",
                onclick: (e: MouseEvent) => {
                    shell.openPath(path_);
                }
            });
        }
        contextmenu.addEntry({
            name: "Delete",
            onclick: (e: MouseEvent) => {
                const success = shell.moveItemToTrash(path_);
                if (success) {
                    this.renderFiles();
                } else {
                    dialog.info("Unexpected Error", "Failed to move the file/folder to the trash.");
                }
            }
        });


        contextmenu.render(e.clientX, e.clientY);
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
                tag: "div",
                className: "file-entry " + (stat.isDirectory() ? "folder" : (stat.isFile() ? "file" : "unknown"))
            });
            element.appendChild(makeElement({
                tag: "span",
                textContent: entry
            }));
            switch (path.extname(filePath)) {
                case ".json":
                case ".mcmeta":
                case ".bbmodel":
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
            if (stat.isFile()) element.setAttribute("data-is-file", "true");
            if (stat.isDirectory()) element.setAttribute("data-is-directory", "true");
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
                    if (!(e.composedPath()[0] == this) && !(e.composedPath()[1] == this)) return;

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
            const project = this;
            element.addEventListener("contextmenu", function(e: MouseEvent) {
                e.preventDefault();
                if (!(e.composedPath()[0] == this) && !(e.composedPath()[1] == this)) return;

                const path = this.getAttribute("data-path");
                if (path == null) throw new Error("No data-path attribute on folder.");
                const isFile = this.getAttribute("data-is-file") == "true";
                const isDirectory = this.getAttribute("data-is-directory") == "true";
                project.onFilesContextmenu(e, path, isFile, isDirectory);
            });
            container?.appendChild(element);
        }
    }

    public async renderFiles() {
        const container = document.getElementById("files");
        if (container == null) throw new Error("Can not render files before the document has loaded.");
        container.innerHTML = "";
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