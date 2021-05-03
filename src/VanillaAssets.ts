import { remote as electron } from "electron";
import * as fs from "fs";
import * as path from "path";
import "extract-zip";
import extract = require("extract-zip");
import Process from "./process";

/**
 * The directory where the cached vanilla assets are stored.
 */
export const vanillaAssetsDir = path.resolve(electron.app.getPath("userData"), "VanillaAssets");

/**
 * Vanilla assets for a specified game version.
 */
export default class VanillaAssets {
    private version: string;

    constructor(version: string) {
        this.version = version;
    }

    public getVersion(): string {
        return this.version;
    }

    /**
     * Get the absolute path of a resource in these assets which
     * can later be used in an fs operation.
     * 
     * @param resource The resource to find, for example "assets/minecraft/textures/block/stone.png".
     */
    public getAbsolutePath(resource: string): string {
        if (resource.includes("..")) throw new Error("resource may not include a '..'");
        return path.join(vanillaAssetsDir, this.version, resource);
    }

    /**
     * Check whether the assets have already been extracted and cached
     * in rp-ide's app data folder.
     * 
     * @returns {@code true} if the assets exist cached, {@code false} otherwise.
     */
    public async existCached(): Promise<boolean> {
        const versionDir = path.resolve(vanillaAssetsDir, this.version);
        console.log('Checking if "' + versionDir + '" exists.');
        if (fs.existsSync(versionDir)) {
            const stat = await fs.promises.stat(versionDir);
            if (stat.isDirectory()) return true;
        }
        return false;
    }

    /**
     * Extract the assets from the game and store them.
     */
    public async extract() {
        const processBar = new Process("Extracting vanilla assets for " + this.version, 1);

        if (!fs.existsSync(vanillaAssetsDir) || !(await fs.promises.stat(vanillaAssetsDir)).isDirectory()) {
            await fs.promises.mkdir(vanillaAssetsDir);
        }

        const versionDir = path.resolve(vanillaAssetsDir, this.version);
        if (!fs.existsSync(versionDir) || !(await fs.promises.stat(versionDir)).isDirectory()) {
            await fs.promises.mkdir(versionDir);
        }

        const minecraftDirName = process.platform === "darwin" ? "minecraft" : ".minecraft";
        const minecraftDir = path.resolve(electron.app.getPath("appData"), minecraftDirName);
        const versionJar = path.resolve(minecraftDir, "versions", this.version, this.version + ".jar");

        if (!fs.existsSync(versionJar) || !(await fs.promises.stat(versionJar)).isFile()) {
            processBar.fail();
            throw new Error("The minecraft jar for "+ this.version + " does not exist, have you ran it in the launcher once?");
        }

        console.log("Copying jar");

        const dest = path.resolve(versionDir, "jar.jar");
        await fs.promises.copyFile(versionJar, dest);
        
        const extractDir = path.resolve(versionDir, "extracted-jar");

        console.log("Extracting jar... this might take a while");

        let entryCount: number;
        await (function() {
            return new Promise<void>(function(resolve, reject) {
                extract(dest, {
                    dir: extractDir,
                    onEntry: function(entry, zipFile) {
                        if (entryCount == undefined) {
                            entryCount = zipFile.entryCount;
                            processBar.setMax(entryCount);
                        }
                        processBar.increment();
                    }
                }, function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });
        })();

        console.log("Jar extracted!");
        console.log("Moving files");

        console.log("    assets folder...");
        await fs.promises.rename(path.resolve(extractDir, "assets"), path.resolve(versionDir, "assets"));
        console.log("    pack.png...");
        await fs.promises.rename(path.resolve(extractDir, "pack.png"), path.resolve(versionDir, "pack.png"));
        console.log("    pack.mcmeta...");
        try {
            await fs.promises.rename(path.resolve(extractDir, "pack.mcmeta"), path.resolve(versionDir, "pack.mcmeta"));
        } catch(e) {
            console.log("No pack.mcmeta");
        }

        console.log("Removing temporary files and folders");

        console.log("Deleteing "+ dest);
        await fs.promises.unlink(dest);
        console.log("Deleteing "+ extractDir);
        await fs.promises.rmdir(extractDir, { recursive: true });

        processBar.finish();
        console.log("All done!");
    }
}