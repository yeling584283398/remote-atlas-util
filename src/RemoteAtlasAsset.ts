import { Asset, SpriteFrame } from "cc";

export class RemoteAtlasAsset extends Asset {
  frameMap: {[key: string]: any} = {};
}

Object.defineProperty(SpriteFrame.prototype, '__remoteAtlas', {
  set: function(value) {
    if (!(value instanceof RemoteAtlasAsset)) {
      console.warn(`${this.name} 没有找到admin合图资源，将使用本地图`);
      return;
    }
    if (value.frameMap[this.name]) {
      Object.keys(value.frameMap[this.name]).forEach((key) => {
        this[key] = value.frameMap[this.name][key];
      });
    } else {
      console.error(`缺少了admin图片: ${this.name}，请检查配置！`);
    }
    
  },
});
