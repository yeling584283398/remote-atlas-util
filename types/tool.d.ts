interface ICreateSpriteConfigOptions {
  /** 
   * the root path of project.
   */
  rootPath: string;
  /** 
   * the textures relative path.
   * @Defaults: ['assets/texture']
   */
  texturePath?: string[];
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
  /** 
   * the image will be removed when it is not used in the prefab.
   * @Defaults: {
   *   bundles: [{ name: 'resources', texturePath: ['assets/texture'] }],
   *   buildPath: 'build/web-mobile'
   * }
   */
  removeUselessImageConfig?: {
    bundles: IBundleConfig[];
    buildPath: string;
  } | false;
}

interface IRemoteImagePluginOptions {
  rootPath: string;
  bundles?: IBundleConfig[];
  excludes: [];
  buildPath: string;
}

interface IPackInfo {
  uuid: string;
  imageMap: Record<string, string>
}

interface IBundleConfig {
  name: string;
  texturePath: string[];
}

interface IUuidMap {
  atlas: Record<
    string,
    {
      uuid: string;
      imageMap: Record<string, string>;
    }
  >;
  single: Record<string, string>;
}

interface Window {
  uuidMap: IUuidMap;
}
