import { Asset, assetManager, Rect, resources, Size, SpriteFrame, sys, Vec2 } from 'cc';
import { BUILD } from 'cc/env';

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
    this.hackPipeline();
  }

  private atlasUrlMap: Record<string, string> = {};
  private imageUrlMap: Record<string, string> = {};
  private uuidMap: Record<string, string> = {};
  private isSupportWebp = sys.hasFeature(sys.Feature.WEBP);

  setRemoteUrl(name: string, urlInfos: TAtlasUrlInfo, isUseWebp = this.isSupportWebp) {
    if (!BUILD) return;
    const info = window.uuidMap.atlas[name];
    if (!info) {
      console.error(`[RemoteImageUtil]can't found the atlas info.(name: ${name})`);
      return;
    }
    if (urlInfos.length > 1) {
      console.error(`[RemoteImageUtil]atlas image too big.(name: ${name})`);
    }
    const urlInfo = urlInfos[0];
    const packUUid = info.uuid;
    this.uuidMap[packUUid] = name;
    this.imageUrlMap[packUUid] = isUseWebp ? urlInfo.spriteWebp : urlInfo.sprite;
    this.atlasUrlMap[name + '.json'] = isUseWebp ? urlInfo.paramsWebp : urlInfo.params;
  }

  setSingleImageUrl(name: string, url: string) {
    if (!BUILD) return;
    const uuid = window.uuidMap.single[name];
    if (!uuid) return;
    this.imageUrlMap[uuid] = url;
  }

  private hackPipeline() {
    assetManager.transformPipeline.append((task) => {
      const input = (task.output = task.input);
      input.forEach((item) => {
        if (item.uuid.indexOf('.json') >= 0) {
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
      const asset = new Asset();
      asset._uuid = options.uuid;
      onComplete(null, asset);
      const data = JSON.parse(file);
      const name = options.uuid.split('.')[0];
      const frameKeys = Object.keys(data.frames);
      frameKeys.forEach((key) => {
        const info = data.frames[key];
        const rect = new Rect(info.x, info.y, info.w, info.h);
        const offset = new Vec2(info.offX, info.offY);
        const originalSize = new Size(info.sourceW, info.sourceH);
        const atlasInfo = window.uuidMap.atlas[name];
        if (!atlasInfo) {
          console.error(`[RemoteImageUtil]can't found the atlas info.(name: ${name})`);
          return;
        }
        const uuid = atlasInfo.imageMap[key];
        if (!uuid) {
          console.error(`[RemoteImageUtil]can't found the image uuid from atlas.(name: ${name}/${key})`);
          return;
        }
        let spriteFrame = assetManager.assets.get(`${uuid}@f9941`) as SpriteFrame;
        if (!spriteFrame) {
          const file = assetManager['_files'].get(`${uuid}@f9941@import`);
          if (file) {
            spriteFrame = file[5][0] as SpriteFrame;
          }
        }
        if (!spriteFrame) {
          console.error(`[RemoteImageUtil]can't found the spriteFrame.(name: ${name}/${key})`);
          return;
        }
        if (spriteFrame.originalSize && spriteFrame.originalSize.width === originalSize.width) return;
        spriteFrame.rect = rect;
        spriteFrame.offset = offset;
        spriteFrame.originalSize = originalSize;
        spriteFrame.rotated = false;
      });
    });
  }
}
