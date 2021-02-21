import Project from "../project";

export default interface Tab {
    /**
     * Get the project this tab belongs to.
     */
    getProject(): Project;

    /**
     * Get the absolute path to the file this tab represents.
     */
    getFilePath(): string;

    /**
     * Initialize the tab. Can read files from disk and prepare editors.
     * Can be async.
     */
    init(): void;

    /**
     * Render the tab, adding the element to the document.
     */
    render(): void;

    /**
     * Open the tab in the editor. May be async.
     */
    open(): void;

    /**
     * Whether the tab has unsaved changes.
     */
    hasUnsavedChanges(): boolean;
}