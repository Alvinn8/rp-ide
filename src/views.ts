export type View = "welcome" | "create-project" | "project-view";

export function showView(view: View) {
    const views = document.getElementsByClassName("view");
    for (const view of views) {
        view.classList.remove("active-view");
    }
    const element = document.getElementById(view);
    if (!element) throw new Error(`View ${view} not found`);
    element.classList.add("active-view");
}