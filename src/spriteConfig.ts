import fs from 'fs';
import path from 'path';
import { getPackInfo } from './getPackInfo';

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

let excludes = [];
let rootPath = '';
const packSubKeys = {};

function getAllPackDir(texturePath: string) {
  const dirs = fs.readdirSync(texturePath);
  return dirs.filter((dir: string) => {
    if (!excludes.includes(dir) && fs.existsSync(path.resolve(texturePath, `${dir}/auto-atlas.pac`))) return true;
  });
}

function setSubKey(texturePath: string) {
  getAllPackDir(texturePath).forEach((dir: string) => {
    if (packSubKeys[dir]) throw new Error(`atlas repeat: ${texturePath}/${dir}}`);
    const files = fs.readdirSync(path.resolve(texturePath, dir));
    const images = [];
    files.forEach((file: string) => {
      if (file.indexOf('.meta') >= 0 && file.indexOf('.pac') < 0) {
        if (/\s/.test(file)) throw new Error(`the file name can not contain space: ${dir}/${file}`);
        file = file.split('.')[0];
        images.push(file);
      }
    });
    packSubKeys[dir] = images;
  });
}

async function removeUselessImage(texturePath: string, bundles: IBundleConfig[], buildPath: string) {
  const promises = bundles.map((bundle) => {
    if (bundle.texturePath.includes(texturePath)) {
      const absPath = path.resolve(rootPath, texturePath);
      const promises = getAllPackDir(absPath).map((dir: string) => {
        return getPackInfo(dir, bundle.name, absPath, buildPath).then(((info) => {
          if (packSubKeys[dir]) throw new Error(`atlas repeat: ${texturePath}/${dir}}`);
          packSubKeys[dir] = Object.keys(info.imageMap);
        }));
      });
      return Promise.all(promises);
    }
  });
  await Promise.all(promises);
}

const defaultOptions = {
  texturePath: ['assets/texture'],
  spriteConfigPath: 'config/sprite.config.json',
  excludes: [],
  removeUselessImageConfig: {
    bundles: [{ name: 'resources', texturePath: ['assets/texture'] }],
    buildPath: 'build/web-mobile',
  },
};

export async function createSpriteConfig(options: ICreateSpriteConfigOptions) {
  if (!options.rootPath) {
    throw new Error('please provide the rootPath parameter');
  }
  options = { ...defaultOptions, ...options };
  rootPath = options.rootPath;
  let spriteConfigPath = path.resolve(rootPath, options.spriteConfigPath);
  excludes = options.excludes;
  for (let i = 0; i < options.texturePath.length; i++) {
    const texturePath = options.texturePath[i];
    if (options.removeUselessImageConfig) {
      const config = options.removeUselessImageConfig;
      await removeUselessImage(texturePath, config.bundles, config.buildPath);
    } else {
      setSubKey(path.resolve(rootPath, texturePath));
    }
  }
  const spriteConfig = {
    engine: 'egret',
    size: {
      width: 2048,
      height: 2048,
    },
    webp: true,
    quality: [0.8, 0.9],
    spriteConfig: {},
  };
  Object.keys(packSubKeys).forEach((name) => {
    spriteConfig.spriteConfig[name] = {
      keys: packSubKeys[name],
    };
  });
  fs.mkdirSync(spriteConfigPath.slice(0, spriteConfigPath.lastIndexOf('/')), { recursive: true });
  fs.writeFileSync(spriteConfigPath, JSON.stringify(spriteConfig, null, 2));
  console.log('sprite.config.json updated');
}
