export default class PackFormat {
    public readonly packFormat: number;
    public readonly versions: string;
    public readonly assetVersion: string;

    /**
     * Create a new PackFormat object.
     * 
     * @param packFormat The number to use in pack.mcmeta files.
     * @param versions A human readable range of game versions that use this pack format.
     * @param assetVersion The version to read assets from when this pack format is used.
     */
    constructor(packFormat: number, versions: string, assetVersion: string) {
        this.packFormat = packFormat;
        this.versions = versions;
        this.assetVersion = assetVersion;
        values.push(this);
    }
}

/**
 * A list of all pack formats.
 */
export const values: PackFormat[] = [];

export const PACK_FORMAT_6 = new PackFormat(6, "1.16.2-1.16.5", "1.16.5");
export const PACK_FORMAT_5 = new PackFormat(5, "1.15-1.16.1",   "1.15.2");
export const PACK_FORMAT_4 = new PackFormat(4, "1.13-1.14.4",   "1.14.4");
export const PACK_FORMAT_3 = new PackFormat(3, "1.11-1.12.2",   "1.12.2");
export const PACK_FORMAT_2 = new PackFormat(2, "1.9-1.10.2",    "1.10.2");
export const PACK_FORMAT_1 = new PackFormat(1, "1.6.1-1.8.9",   "1.8.9");

/**
 * Get a PackFormat object from a pack format number.
 * 
 * @param packFormat The pack format to look for
 * @returns The pack format object matched, or null
 */
export function getPackFormat(packFormat: number): PackFormat | null {
    switch (packFormat) {
        case 6: return PACK_FORMAT_6;
        case 5: return PACK_FORMAT_5;
        case 4: return PACK_FORMAT_4;
        case 3: return PACK_FORMAT_3;
        case 2: return PACK_FORMAT_2;
        case 1: return PACK_FORMAT_1;
        default: return null;
    }
}