import { SpriteFrame, Asset, sys, assetManager, Rect, Vec2, Size } from 'cc';
import { BUILD } from 'cc/env';

class RemoteAtlasAsset extends Asset {
    constructor() {
        super(...arguments);
        this.frameMap = {};
    }
}
Object.defineProperty(SpriteFrame.prototype, '__remoteAtlas', {
    set: function (value) {
        if (!(value instanceof RemoteAtlasAsset)) {
            console.warn(`${this.name} 没有找到admin合图资源，将使用本地图`);
            return;
        }
        if (value.frameMap[this.name]) {
            Object.keys(value.frameMap[this.name]).forEach((key) => {
                this[key] = value.frameMap[this.name][key];
            });
        }
        else {
            console.error(`缺少了admin图片: ${this.name}，请检查配置！`);
        }
    },
});

class RemoteImageUtil {
    constructor() {
        this.atlasUrlMap = {};
        this.imageUrlMap = {};
        this.uuidMap = {};
        this.isSupportWebp = sys.hasFeature(sys.Feature.WEBP);
        if (!BUILD)
            return;
        this.mockRemoteAtlasAsset();
        this.hackPipeline();
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new RemoteImageUtil();
        }
        return this.instance;
    }
    setRemoteUrl(name, urlInfos, isUseWebp = this.isSupportWebp) {
        if (!BUILD)
            return;
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
    setSingleImageUrl(name, url) {
        if (!BUILD)
            return;
        const uuid = window.uuidMap.single[name];
        if (!uuid)
            return;
        this.imageUrlMap[uuid] = url;
    }
    checkAllImageSetUrl() {
        const atlas = [];
        Object.keys(window.uuidMap.atlas).forEach((name) => {
            if (!this.atlasUrlMap[name + '.json']) {
                atlas.push(name);
            }
        });
        const single = [];
        Object.keys(window.uuidMap.single).forEach((name) => {
            if (!this.imageUrlMap[window.uuidMap.single[name]]) {
                single.push(name);
            }
        });
        return {
            atlas,
            single,
        };
    }
    mockRemoteAtlasAsset() {
        // 先把所有的 atlas 资源注册到 assetManager 中，避免admin图片没配置时仍然去请求json文件导致找不到
        Object.keys(window.uuidMap.atlas).forEach((name) => {
            const uuid = window.uuidMap.atlas[name];
            if (!uuid)
                return;
            const asset = new RemoteAtlasAsset();
            assetManager.assets.add(`${name}.json`, asset);
        });
    }
    hackPipeline() {
        assetManager.transformPipeline.append((task) => {
            const input = (task.output = task.input);
            input.forEach((item) => {
                if (item.uuid.indexOf('.json') >= 0 && this.atlasUrlMap[item.uuid]) {
                    item.url = this.atlasUrlMap[item.uuid];
                    item.ext = '.sa';
                    item.isNative = true;
                    item.options.uuid = item.uuid;
                }
                else if (this.imageUrlMap[item.uuid] && item.isNative) {
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
                asset.frameMap[key] = {
                    rect,
                    offset,
                    originalSize,
                };
            });
            onComplete(null, asset);
        });
    }
}

export { RemoteImageUtil as default };
