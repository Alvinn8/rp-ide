import Project, { ProjectInfo, ShortProjectInfo } from "./project";
import * as path from "path";
import { remote as electron } from "electron";
import { createHash } from "crypto";
import { promises as fs } from "fs";
import { setCurrentProject } from "../variables";
import { showView } from "../views";

export const projectsDir = path.resolve(electron.app.getPath("userData"), "projects");

export function getProjectHash(project: Project): string {
    const md5 = createHash("md5");
    md5.update(path.normalize(project.getRootDir()));
    return md5.digest("hex");
}

/**
 * Update the json file for the specified project.
 * 
 * @param project The project to update the file for
 */
export async function updateProjectJson(project: Project) {
    try {
        await fs.mkdir(projectsDir);
    } catch(e) {}

    const rootDirHash = getProjectHash(project);
    const filePath = path.resolve(projectsDir, rootDirHash + ".json");
    const content = JSON.stringify(project.getProjectInfo());
    await fs.writeFile(filePath, content);
}

/**
 * Update the projects.json file with update content comming from the
 * provided project.
 * 
 * @param project The project with updated information.
 */
export async function updateAllProjectsJson(project: Project) {
    const filePath = path.resolve(electron.app.getPath("userData"), "projects.json");
    let json: any = {};
    try {
        const text = await fs.readFile(filePath, "utf-8");
        json = JSON.parse(text);
    } catch(e) {}
    json[getProjectHash(project)] = {
        name: project.getName(),
        lastOpened: Date.now()
    };
    try {
        await fs.mkdir(projectsDir);
    } catch(e) {}

    await fs.writeFile(filePath, JSON.stringify(json));
}

export async function getProjects(): Promise<ShortProjectInfo[]> {
    const filePath = path.resolve(electron.app.getPath("userData"), "projects.json");
    let json: any = {};
    try {
        const text = await fs.readFile(filePath, "utf-8");
        json = JSON.parse(text);
    } catch(e) {
        return [];
    }
    const entries: ShortProjectInfo[] = [];
    for (const hash in json) {
        const entry = json[hash];
        entries.push({
            name: entry.name,
            lastOpened: entry.lastOpened,
            hash: hash
        });
    }
    return entries;
}

export async function getProject(hash: string): Promise<Project | null> {
    const filePath = path.resolve(projectsDir, hash + ".json");
    let json: ProjectInfo;
    try {
        const text = await fs.readFile(filePath, "utf-8");
        json = JSON.parse(text) as ProjectInfo;
    } catch(e) {
        console.warn(e);
        return null;
    }
    return new Project(json);
}

export async function openProject(project: Project) {
    showView("project-view");
    await project.renderFiles();
    setCurrentProject(project);
    // // @ts-ignore
    // window["project"] = project;
}