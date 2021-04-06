import * as editorUtil from "./editorUtil";

export type Theme = "dark" | "light";

let currentTheme: Theme = "dark";

export function getTheme(): Theme {
    return currentTheme;
}

export function setTheme(theme: Theme) {
    currentTheme = theme;
    if (editorUtil.isEditorLoaded()) {
        editorUtil.getMonaco().editor.setTheme(currentTheme == "dark" ? "vs-dark" : "vs");
    }
    const themeStyleElement = document.getElementById("theme");
    if (themeStyleElement != null) {
        themeStyleElement.innerHTML = `
        body {
            background-color: ${currentTheme == "dark" ? "#272727" : "white"};
            color: ${currentTheme == "dark" ? "white" : "black"};
        }
        ` + (currentTheme == "dark" ? `
        .file-entry::before {
            filter: invert(1);
        }
        ` : "");
    }
}

export function update() {
    setTheme(currentTheme);
}