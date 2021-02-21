interface MakeElementOptions {
    tag: string;
    id?: string;
    className?: string;
    textContent?: string;
    htmlContent?: string;
}

export function makeElement(options: MakeElementOptions): HTMLElement {
    if (options.textContent && options.htmlContent) throw new Error("Can not have text and html content.");
    const element = document.createElement(options.tag);
    if (options.id) element.id = options.id;
    if (options.className) element.className = options.className;
    if (options.textContent) element.appendChild(document.createTextNode(options.textContent));
    if (options.htmlContent) element.innerHTML = options.htmlContent;
    return element;
}