import * as path from "path";
import { remote as electron } from "electron";
import Project from "./project/project";
import { showView } from "./views";
import * as themes from "./themes";
import { setCurrentProject } from "./variables";
import { values as packFormats } from "./packFormats";
import { getProject, getProjects, openProject } from "./project/projects";

window.addEventListener("DOMContentLoaded", async function() {
    const minecraftDirName = process.platform === "win32" ? ".minecraft" : "minecraft";
    const resourcePackDir = path.resolve(electron.app.getPath("appData"), minecraftDirName, "resourcepacks");
    const locationInput = document.getElementById("create-project-location") as HTMLInputElement;
    locationInput.value = resourcePackDir;

    document.getElementById("create-new-project-button")!.addEventListener("click", function() {
        showView("create-project");
    });

    document.getElementById("create-project-location-change")!.addEventListener("click", async function() {
        const result = await electron.dialog.showOpenDialog(electron.getCurrentWindow(), {
            properties: ["openDirectory"],
            defaultPath: locationInput.value
        });
        if (!result.canceled) {
            locationInput.value = result.filePaths[0];
        }
    });

    document.getElementById("open-new-project-button")!.addEventListener("click", async function() {
        const result = await electron.dialog.showOpenDialog(electron.getCurrentWindow(), {
            properties: ["openDirectory"],
            defaultPath: locationInput.value
        });
        if (!result.canceled) {
            const rootDir = result.filePaths[0];
            const name = path.basename(rootDir);
            const project = new Project({
                rootDir,
                name: name,
                packFormat: packFormats[0].packFormat,
                lastOpened: new Date().toJSON()
            });
            await openProject(project);
        }
    });

    themes.update();

    const packFormatSelect = document.getElementById("create-project-version") as HTMLSelectElement;
    for (let i = 0; i < packFormats.length; i++) {
        const packFormat = packFormats[i];
        const element = document.createElement("option");
        element.value = packFormat.packFormat.toString();
        if (i == 0) element.selected = true;
        element.appendChild(document.createTextNode(`${packFormat.packFormat} (${packFormat.versions})`));
        packFormatSelect.appendChild(element);
    }
    
    (async function() {
        const projects = await getProjects();
    
        projects.sort((a, b) => {
            return new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime();
        });

        const receptProjects = document.getElementById("recentProjects");
        for (const project of projects) {
            const element = document.createElement("li");
            element.appendChild(document.createTextNode(project.name));
            element.setAttribute("data-project-hash", project.hash);
            element.addEventListener("click", async function() {
                const hash = this.getAttribute("data-project-hash")!;
                const project = await getProject(hash);
                if (project == null) {
                    alert("Unable to find that project.");
                    return;
                }

                await openProject(project);
            });
            receptProjects?.appendChild(element);
        }
    })();
});