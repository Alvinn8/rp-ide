import type * as monaco from "monaco-editor";
import * as themes from "./themes";

let windowMonaco: typeof monaco;
let editor: monaco.editor.IStandaloneCodeEditor;

/**
 * Load the editor.
 */
export async function loadEditor(): Promise<monaco.editor.IStandaloneCodeEditor> {
    // The monaco editor uses AMD and therefore can not run in
    // this node enviorment. We therefore load it via an iframe
    return new Promise(function (resolve, reject) {
        var iframe = document.createElement("iframe");
        iframe.src = "editor.html";
        iframe.onload = function () {
            // @ts-ignore
            windowMonaco = iframe.contentWindow.monaco;
            // @ts-ignore
            editor = iframe.contentWindow.editor;

            themes.update();

            resolve(editor as monaco.editor.IStandaloneCodeEditor);
        };
        document.getElementById("editor")!.appendChild(iframe);
    });
}

/**
 * Ensure the editor is loaded and get it.
 */
export async function ensureEditorLoaded(): Promise<monaco.editor.IStandaloneCodeEditor> {
    if (!editor) return await loadEditor();
    return editor;
}

export function getMonaco(): typeof monaco {
    if (!windowMonaco) throw new Error("Can not get monaco before the editor has been loaded.");
    return windowMonaco;
}

export function getEditor(): monaco.editor.IStandaloneCodeEditor {
    if (!editor) throw new Error("Can not get editor before the editor has been loaded.");
    return editor;
}

export function isEditorLoaded(): boolean {
    if (editor) return true;
    return false;
}