import { Asset, SpriteFrame } from "cc";

export class RemoteAtlasAsset extends Asset {
  frameMap: {[key: string]: any} = {};
}

Object.defineProperty(SpriteFrame.prototype, '__remoteAtlas', {
  set: function(value) {
    Object.keys(value.frameMap[this.name]).forEach((key) => {
      this[key] = value.frameMap[this.name][key];
    });
  },
});
