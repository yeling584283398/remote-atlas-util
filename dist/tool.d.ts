declare type CreateSpriteConfigOptions = {
    /**
     * the root path of project.
     */
    rootPath: string;
    /**
     * the textures relative path.
     * @Defaults: assets/resources/texture
     */
    texturePath?: string;
    /**
     * the sprite config relative path.
     * @Defaults: config/sprite.config.json
     */
    spriteConfigPath?: string;
    /**
     * the folders name don't want replace remote atlas.
     * @Defaults: []
     */
    excludes?: string[];
};
export declare function createSpriteConfig(options: CreateSpriteConfigOptions): void;
export {};
