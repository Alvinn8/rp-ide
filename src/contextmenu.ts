import { makeElement } from "./util";

export interface ContextMenuEntry {
    name: string;
    onclick: (this: HTMLElement, e: MouseEvent) => void;
}

export class ContextMenuCategory {
    private entries: ContextMenuEntry[] = [];
    /**
     * The priority of this category. Higer values will be displayed higher up.
     */
    public priority: number = 0;

    public addEntry(entry: ContextMenuEntry) {
        this.entries.push(entry);
    }

    public getEntries(): ContextMenuEntry[] {
        return this.entries;
    }
}

/**
 * A context menu that is about to appear due to a user right click.
 */
export class ContextMenu {
    private categories: {[key: string]: ContextMenuCategory} = {};

    /**
     * Add an entry to the main category.
     * 
     * @param entry The entry to add
     */
    public addEntry(entry: ContextMenuEntry): void;
    /**
     * Add an entry to a specific category. Other entries on the same
     * category will be displayed in the same area.
     * 
     * @param category The category to add to
     * @param entry The entry to add
     */
    public addEntry(category: string, entry: ContextMenuEntry): void;
    public addEntry(var0: string | ContextMenuEntry, var1?: ContextMenuEntry) {
        let category: string;
        let entry: ContextMenuEntry;
        if (typeof var0 == "string") {
            if (var1 == undefined) throw new TypeError("Expected entry as a second parameter.");
            category = var0;
            entry = var1;
        } else {
            category = "main";
            entry = var0;
        }

        if (!this.categories[category]) this.categories[category] = new ContextMenuCategory();
        
        this.categories[category].addEntry(entry);
    }

    /**
     * Set the priority for the specified category. Higer values will
     * display the category displayed higher up.
     * 
     * @param category The category to set the priority for
     * @param priority The priority to set
     */
    public setCategoryPriority(category: string, priority: number) {
        if (!this.categories[category]) this.categories[category] = new ContextMenuCategory();

        this.categories[category].priority = priority;
    }

    public getCategory(category: string): ContextMenuCategory | null {
        return this.categories[category] || null;
    }

    public render(x: number, y: number) {
        document.getElementById("contextmenu")?.remove(); // Remove existing context menu if it exists

        const container = makeElement({
            tag: "ul",
            id: "contextmenu",
            className: "dropdown-menu"
        });
        container.style.display = "block";
        container.style.position = "fixed";
        container.style.left = x + "px";
        container.style.top = y + "px";

        const categories: ContextMenuCategory[] = Object.values(this.categories);
        categories.sort((a, b) => {
            return b.priority - a.priority;
        });

        let isFirst = true;
        for (const category of categories) {
            if (isFirst) isFirst = false;
            else {
                const dividerLi = makeElement({
                    tag: "li"
                });
                dividerLi.appendChild(makeElement({
                    tag: "hr",
                    className: "dropdown-divider"
                }));
                container.appendChild(dividerLi);
            }

            for (const entry of category.getEntries()) {
                const entryContainer = makeElement({
                    tag: "li",
                });
                const entryElement = makeElement({
                    tag: "a",
                    className: "contextmenu-entry dropdown-item",
                    textContent: entry.name 
                });
                entryElement.addEventListener("click", entry.onclick);
                entryContainer.appendChild(entryElement);
                container.appendChild(entryContainer);
            }
        }
        document.body.appendChild(container);
    }
}

window.addEventListener("click", function(e) {
    const contextmenu = document.getElementById("contextmenu");
    if (contextmenu != null) {
        contextmenu.remove();
    }
});