import * as path from "path";
import { remote as electron } from "electron";
import Project from "./project/project";
import { showView } from "./views";
import * as themes from "./themes";
import { setCurrentProject } from "./variables";

window.addEventListener("DOMContentLoaded", async function() {
    const minecraftDirName = process.platform === "win32" ? ".minecraft" : "minecraft";
    const resourcePackDir = path.resolve(electron.app.getPath("appData"), minecraftDirName, "resourcepacks");
    const locationInput = document.getElementById("create-project-location") as HTMLInputElement;
    locationInput.value = resourcePackDir;

    document.getElementById("create-project-location-change")?.addEventListener("click", async function() {
        const result = await electron.dialog.showOpenDialog(electron.getCurrentWindow(), {
            properties: ["openDirectory"],
            defaultPath: locationInput.value
        });
        if (!result.canceled) {
            locationInput.value = result.filePaths[0];
        }
    });

    themes.update();
    
    (async function() {
        // return;
        showView("project-view");
        
        const project = new Project("/Users/Alvin/Library/Application Support/minecraft/resourcepacks/SVCraftVehicles");
        
        await project.renderFiles();

        setCurrentProject(project);

        // @ts-ignore
        window["project"] = project;
    })();
});