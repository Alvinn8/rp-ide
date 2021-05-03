import { makeElement } from "./util";

const processes: Process[] = [];

export default class Process {
    private name: string;
    private value: number = 0;
    private max: number;
    private element: HTMLElement;
    private progressBar: HTMLElement;
    private progressBarContainer: HTMLElement;

    /**
     * Create a process that will be displayed in the bottom right corner that has a
     * progress bar.
     * 
     * @param name The name of the process, will be displayed in the bottom right corner
     * @param max The highest value for the progress bar
     */
    constructor(name: string, max: number) {
        this.name = name;
        this.max = max;
        this.element = makeElement({
            tag: "div",
            className: "process bg-info rounded text-dark"
        });
        this.element.appendChild(makeElement({
            tag: "span",
            textContent: this.name
        }));
        this.progressBarContainer = makeElement({
            tag: "div",
            className: "progress"
        });
        this.progressBar = makeElement({
            tag: "div",
            className: "progress-bar progress-bar-striped progress-bar-animated"
        });
        this.progressBar.setAttribute("role", "progressbar");
        this.progressBar.setAttribute("aria-valuemin", "0");
        this.progressBar.setAttribute("aria-valuemax", this.max.toString());
        this.progressBarContainer.appendChild(this.progressBar);
        this.element.appendChild(this.progressBarContainer);
        document.getElementById("processesContainer")!.appendChild(this.element);
    }

    private updateProgressbar() {
        this.progressBar.style.width = (this.value / this.max) * 100 + "%";
        this.progressBar.setAttribute("aria-valuenow", this.value.toString());
    }

    /**
     * Add one to the progress bar
     */
    public increment() {
        this.value++;
        this.updateProgressbar();
    }

    /**
     * Set the value for the progress bar
     * 
     * @param value The new value
     */
    public setValue(value: number) {
        this.value = value;
        this.updateProgressbar();
    }

    /**
     * Change the max value for the progress bar
     * 
     * @param max The new max
     */
    public setMax(max: number) {
        this.max = max;
        this.progressBar.setAttribute("aria-valuemax", this.max.toString());
        this.updateProgressbar();
    }

    private slideDown() {
        const box = this.element.getBoundingClientRect();
        this.element.style.top = box.top + "px";
        this.element.style.left = box.left + "px";
        this.element.style.position = "fixed";
        setTimeout(() => {
            this.element.style.top = window.innerHeight + 200 + "px";
            this.element.remove();
            processes.splice(processes.indexOf(this), 1);
        }, 500);
    }

    /**
     * Finish the process and remove the notification in the bottom right corner.
     */
    public finish() {
        this.value = this.max;
        this.updateProgressbar();
        this.slideDown();
    }

    public cancel() {
        this.element.classList.remove("bg-info");
        this.element.classList.add("bg-secondary");
        this.slideDown();
    }

    public fail() {
        this.element.classList.remove("bg-info");
        this.element.classList.add("bg-danger");
        this.slideDown();
    }
}