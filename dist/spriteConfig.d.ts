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
}
export declare function createSpriteConfig(options: ICreateSpriteConfigOptions): Promise<void>;
export {};
