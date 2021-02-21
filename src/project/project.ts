import * as fs from "fs";
import * as path from "path";
import { makeElement } from "../util";
import Tab from "./tab/tab";
import TextTab from "./tab/textTab";

export default class Project {
    private rootDir: string;
    private tabs: Tab[] = [];
    private currentTab?: Tab;

    constructor(rootDir: string) {
        this.rootDir = rootDir;
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

    public async renderFiles() {
        const projectThis = this;
        const container = document.getElementById("files");
        const entries = await fs.promises.readdir(this.rootDir);
        for (const entry of entries) {
            const filePath = path.resolve(this.rootDir, entry);
            const stat = await fs.promises.stat(filePath);
            const element = makeElement({
                tag: "span",
                className: "file-entry " + (stat.isDirectory() ? "folder" : (stat.isFile() ? "file" : "unknown")),
                textContent: entry
            });
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
                        await tab.open();
                    }
                });
            }
            container?.appendChild(element);
        }
    }
}