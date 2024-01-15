interface IBundleConfig {
    name: string;
    texturePath: string[];
}
interface IRemoteImagePluginOptions {
    /**
     * the root path of project.
     */
    rootPath: string;
    /**
     * the bundles of images that need to be replaced by admin
     * @default: [{ name: 'resources', texturePath: ['assets/texture'] }]
     */
    bundles?: IBundleConfig[];
    /**
     * the folders name don't want replace remote atlas.
     * @default: []
     */
    excludes: [];
    /**
     * Cocos Editor build path.
     * @default: 'build/web-mobile'
     */
    buildPath: string;
}
export declare class RemoteImagePlugin {
    static getUuidMap(): Promise<IUuidMap>;
    private static getUuidMapResolve;
    private static uuidMap;
    private options;
    private promiseCache;
    constructor(options: IRemoteImagePluginOptions);
    apply(compiler: any): void;
    generateUuidMap(): Promise<IUuidMap>;
    setUuidMap(compiler: any): void;
}
export {};
