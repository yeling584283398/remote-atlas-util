import { assetManager, Rect, Size, sys, Vec2 } from 'cc';
import { BUILD } from 'cc/env';
import { RemoteAtlasAsset } from './RemoteAtlasAsset';

type TAtlasUrlInfo = {
  params: string;
  paramsWebp: string;
  sprite: string;
  spriteWebp: string;
}[];

export default class RemoteImageUtil {
  static instance: RemoteImageUtil;
  static getInstance() {
    if (!this.instance) {
      this.instance = new RemoteImageUtil();
    }
    return this.instance;
  }
  constructor() {
    if (!BUILD) return;
    this.mockRemoteAtlasAsset();
    this.hackPipeline();
  }

  private atlasUrlMap: Record<string, string> = {};
  private imageUrlMap: Record<string, string> = {};
  private uuidMap: Record<string, string> = {};
  private isSupportWebp = sys.hasFeature(sys.Feature.WEBP);

  setRemoteUrl(name: string, urlInfos: TAtlasUrlInfo, isUseWebp = this.isSupportWebp) {
    if (!BUILD) return;
    const packUUid = window.uuidMap.atlas[name];
    if (!packUUid) {
      console.error(`[RemoteImageUtil]can't found the atlas info.(name: ${name})`);
      return;
    }
    if (urlInfos.length > 1) {
      console.error(`[RemoteImageUtil]atlas image too big.(name: ${name})`);
    }
    const urlInfo = urlInfos[0];
    this.uuidMap[packUUid] = name;
    this.imageUrlMap[packUUid] = isUseWebp ? urlInfo.spriteWebp : urlInfo.sprite;
    this.atlasUrlMap[name + '.json'] = isUseWebp ? urlInfo.paramsWebp : urlInfo.params;
    // 有设置远程图片了就可以删除mock的资源了
    assetManager.assets.remove(`${name}.json`);
  }

  setSingleImageUrl(name: string, url: string) {
    if (!BUILD) return;
    const uuid = window.uuidMap.single[name];
    if (!uuid) return;
    this.imageUrlMap[uuid] = url;
  }

  checkAllImageSetUrl() {
    const atlas = [];
    Object.keys(window.uuidMap.atlas).forEach((name: string) => {
      if (!this.atlasUrlMap[name + '.json']) {
        atlas.push(name);
      }
    });
    const single = [];
    Object.keys(window.uuidMap.single).forEach((name: string) => {
      if (!this.imageUrlMap[window.uuidMap.single[name]]) {
        single.push(name);
      }
    });
    return {
      atlas,
      single,
    };
  }

  private mockRemoteAtlasAsset() {
    // 先把所有的 atlas 资源注册到 assetManager 中，避免admin图片没配置时仍然去请求json文件导致找不到
    Object.keys(window.uuidMap.atlas).forEach((name: string) => {
      const uuid = window.uuidMap.atlas[name];
      if (!uuid) return;
      const asset = new RemoteAtlasAsset();
      assetManager.assets.add(`${name}.json`, asset);
    });
  }

  private hackPipeline() {
    assetManager.transformPipeline.append((task) => {
      const input = (task.output = task.input);
      input.forEach((item) => {
        if (item.uuid.indexOf('.json') >= 0 && this.atlasUrlMap[item.uuid]) {
          item.url = this.atlasUrlMap[item.uuid];
          item.ext = '.sa';
          item.isNative = true;
          item.options.uuid = item.uuid;
        } else if (this.imageUrlMap[item.uuid] && item.isNative) {
          item.url = this.imageUrlMap[item.uuid];
        }
      });
    });
    assetManager.parser.register('.sa', (file, options, onComplete) => {
      const asset = new RemoteAtlasAsset();
      asset._uuid = options.uuid;
      const data = JSON.parse(file);
      const frameKeys = Object.keys(data.frames);
      frameKeys.forEach((key) => {
        const info = data.frames[key];
        const rect = new Rect(info.x, info.y, info.w, info.h);
        const offset = new Vec2(info.offX, info.offY);
        const originalSize = new Size(info.sourceW, info.sourceH);
        asset.frameMap[key] =  {
          rect,
          offset,
          originalSize,
        };
      });
      onComplete(null, asset);
    });
  }
}
