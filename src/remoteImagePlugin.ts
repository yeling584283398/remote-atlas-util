import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import { getUuidMap, updateAllPack } from './updatePack';

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

const defaultOptions = {
  projectRootPath: '',
  bundles: [
    {
      name: 'resources',
      texturePath: ['assets/texture'],
    },
  ],
  excludes: [],
  buildPath: '',
};

export class RemoteImagePlugin {
  private options: IRemoteImagePluginOptions;
  private promiseCache: Promise<IUuidMap>;
  constructor(options: IRemoteImagePluginOptions) {
    if (!options.rootPath) throw new Error('[RemoteImagePlugin] params: projectRootPath can not empty!');
    this.options = { ...defaultOptions, ...options };
  }

  apply(compiler) {
    this.setUuidMap(compiler);
  }

  generateUuidMap() {
    if (this.promiseCache) return this.promiseCache;
    const { rootPath, bundles, excludes, buildPath } = this.options;
    const promises = [];
    bundles.forEach((bundle) => {
      if (!Array.isArray(bundle.texturePath)) bundle.texturePath = [bundle.texturePath];
      bundle.texturePath.forEach((texturePath) => {
        const textureAbsPath = path.resolve(rootPath, texturePath)
        promises.push(updateAllPack(bundle.name, textureAbsPath, excludes, buildPath))
      })
    })
    this.promiseCache = Promise.all(promises).then(() => {
      return getUuidMap();
    });
  }

  setUuidMap(compiler) {
    this.generateUuidMap();
    compiler.hooks.compilation.tap('RemoteImagePlugin', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
        'RemoteImagePlugin',
        (htmlPluginData, cb) => {
          this.generateUuidMap().then((uuidMap) => {
            const uuidMapScript = `<script>window.uuidMap=${JSON.stringify(uuidMap)}</script>`
            const html = htmlPluginData.html;
            const insertIndex = html.indexOf('<body>') + 6;
            htmlPluginData.html = html.slice(0, insertIndex) + uuidMapScript + html.slice(insertIndex);
            cb(null, htmlPluginData);
          });
        }
      );
    });
  }
}
