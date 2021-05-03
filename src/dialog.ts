import { getTheme } from "./themes";
import { makeElement } from "./util";
import type * as bootstrap from "bootstrap";

/**
 * Ask the user for confirmation.
 * 
 * @param title The title to display, html allowed
 * @param prompt The text to display, html allowed
 * @param callback Called if the user confirms
 * @param cancelCallback Called if the user cancels
 */
export function confirm(title: string, prompt: string, callback: Function, cancelCallback?: Function) {
    const html = /* html */`
        <div class="modal">
            <div class="modal-dialog">
                <div class="modal-content${getTheme() == "dark" ? " bg-dark" : ""}">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                    </div>
                    <div class="modal-body">
                        <p>${prompt}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary confirm-modal-close" data-bs-dismiss="modal">Cancel</button>
                        <button class="btn btn-primary confirm-modal-confirm" data-bs-dismiss="modal">Confirm</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const container = makeElement({
        tag: "div",
        htmlContent: html
    });
    document.getElementById("modals")!.appendChild(container);

    // @ts-ignore
    const modal = new bootstrap.Modal(container.getElementsByClassName("modal")[0], {
        backdrop: "static",
        keyboard: false
    });
    modal.show();

    container.getElementsByClassName("confirm-modal-confirm")[0].addEventListener("click", e => {
        callback();
    });
    if (typeof cancelCallback == "function") {
        container.getElementsByClassName("confirm-modal-close")[0].addEventListener("click", e => {
            cancelCallback();
        });
    }
}


/**
 * Inform the user of something
 * 
 * @param title The title to display, html allowed
 * @param prompt The text to display, html allowed
 */
 export function info(title: string, text: string) {
    const html = /* html */`
        <div class="modal">
            <div class="modal-dialog">
                <div class="modal-content${getTheme() == "dark" ? " bg-dark" : ""}">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                    </div>
                    <div class="modal-body">
                        <p>${text}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" data-bs-dismiss="modal">Ok</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const container = makeElement({
        tag: "div",
        htmlContent: html
    });
    document.getElementById("modals")!.appendChild(container);

    // @ts-ignore
    const modal = new bootstrap.Modal(container.getElementsByClassName("modal")[0]);
    modal.show();
}

/**
 * Ask the user for a string input.
 * 
 * @param title The title to display, html allowed
 * @param prompt The text to display, html allowed
 * @param callback Called when the user is done
 * @param cancelCallback Called if the user cancels
 */
 export function prompt(title: string, prompt: string, callback: (input: string) => void, cancelCallback?: Function) {
    const html = /* html */`
        <div class="modal">
            <div class="modal-dialog">
                <div class="modal-content${getTheme() == "dark" ? " bg-dark" : ""}">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                    </div>
                    <div class="modal-body">
                        <p>${prompt}</p>
                        <input type="text" class="input-modal-input form-control">
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary confirm-modal-close" data-bs-dismiss="modal">Cancel</button>
                        <button class="btn btn-primary confirm-modal-confirm" data-bs-dismiss="modal">Done</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const container = makeElement({
        tag: "div",
        htmlContent: html
    });
    document.getElementById("modals")!.appendChild(container);

    // @ts-ignore
    const modal = new bootstrap.Modal(container.getElementsByClassName("modal")[0], {
        backdrop: "static",
        keyboard: false
    });
    modal.show();

    const input = container.getElementsByClassName("input-modal-input")[0] as HTMLInputElement;
    
    container.getElementsByClassName("confirm-modal-confirm")[0].addEventListener("click", e => {
        callback(input.value);
    });
    if (typeof cancelCallback == "function") {
        container.getElementsByClassName("confirm-modal-close")[0].addEventListener("click", e => {
            cancelCallback();
        });
    }
}