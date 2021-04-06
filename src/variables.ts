import Project from "./project/project";

let currentProject: Project | null = null;

export function getCurrentProject(): Project | null {
    return currentProject;
}

export function setCurrentProject(project: Project | null) {
    currentProject = project;
}