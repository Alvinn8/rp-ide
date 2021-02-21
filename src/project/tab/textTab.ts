import type * as monaco from "monaco-editor";
import * as editorUtil from "../../editorUtil";
import Tab from "./tab";
import * as fs from "fs";
import * as path from "path";
import { makeElement } from "../../util";
import Project from "../project";

/**
 * A tab representing a text file.
 */
export default class TextTab implements Tab {
    private project: Project;
    private filePath: string;
    private model?: monaco.editor.IModel;
    private unsavedChanges = false;
    private element?: HTMLElement;

    constructor(project: Project, filePath: string) {
        this.project = project;
        this.filePath = path.normalize(filePath);
    }

    public async init() {
        await editorUtil.ensureEditorLoaded();
        const value = await fs.promises.readFile(this.filePath, "utf-8");
        const monaco = editorUtil.getMonaco();
        this.model = monaco.editor.createModel(value, undefined, monaco.Uri.file(this.filePath));
        this.model.setEOL(value.includes("\r\n") ? monaco.editor.EndOfLineSequence.CRLF : monaco.editor.EndOfLineSequence.LF);
        console.log("Using "+ this.model.getEOL().replace('\r', '\\r').replace('\n', '\\n') + " as line endings");
        this.model.detectIndentation(true, 4);
        this.model.onDidChangeContent(() => {
            if (!this.unsavedChanges) {
                this.unsavedChanges = true;
                this.render();
            }
        })
    }

    public getProject(): Project {
        return this.project;
    }

    public getFilePath(): string {
        return this.filePath;
    }

    public hasUnsavedChanges(): boolean {
        return this.unsavedChanges;
    }

    public render() {
        if (!this.element) {
            this.element = makeElement({
                tag: "div",
                className: "tab"
            });
            this.element.appendChild(makeElement({
                tag: "span",
                className: "tab-filename",
                textContent: path.basename(this.filePath)
            }));
            this.element.appendChild(makeElement({
                tag: "span",
                className: "tab-unsavedchanges",
                htmlContent: "&bull;"
            }));
            this.element.appendChild(makeElement({
                tag: "span",
                className: "tab-close",
                htmlContent: "&times;"
            }));
            document.getElementById("tabs")!.appendChild(this.element);
        }
        (this.element.querySelector(".tab-unsavedchanges") as HTMLElement).style.visibility = this.hasUnsavedChanges() ? "visible" : "hidden";
        const options = this.model!.getOptions();
        document.getElementById("editor-extras-indentation")!.textContent = options.insertSpaces ? "Spaces: " + options.indentSize : "Tabs: " + options.tabSize;
        document.getElementById("editor-extras-eol")!.textContent = this.model!.getEOL().replace("\r", "CR").replace("\n", "LF");
    }

    public async open() {
        if (!this.model) throw new Error("Can not open before init has been called.");
        const editor = await editorUtil.ensureEditorLoaded();

        editor.setModel(this.model);
    }

    public async saveChanges() {
        if (!this.model) throw new Error("Can not saveChanges before init has been called.");
        const value = this.model.getValue();
        await fs.promises.writeFile(this.filePath, value, "utf-8");
        this.unsavedChanges = false;
        this.render();
    }
}