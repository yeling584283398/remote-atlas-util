interface IBundleConfig {
    name: string;
    texturePath: string[];
}
interface ICreateSpriteConfigOptions {
    /**
     * the root path of project.
     */
    rootPath: string;
    /**
     * the textures relative path.
     * @default: ['assets/texture']
     */
    texturePath?: string[];
    /**
     * the sprite config relative path.
     * @default: config/sprite.config.json
     */
    spriteConfigPath?: string;
    /**
     * the folders name don't want replace remote atlas.
     * @default: []
     */
    excludes?: string[];
    /**
     * the image will be removed when it is not used in the prefab.
     * @default: false
     */
    removeUselessImageConfig?: {
        bundles: IBundleConfig[];
        buildPath: string;
    } | false;
}
export declare function createSpriteConfig(options: ICreateSpriteConfigOptions): Promise<void>;
export {};
