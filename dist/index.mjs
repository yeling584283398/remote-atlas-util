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
        Object.keys(value.frameMap[this.name]).forEach((key) => {
            this[key] = value.frameMap[this.name][key];
        });
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
    }
    setSingleImageUrl(name, url) {
        if (!BUILD)
            return;
        const uuid = window.uuidMap.single[name];
        if (!uuid)
            return;
        this.imageUrlMap[uuid] = url;
    }
    hackPipeline() {
        assetManager.transformPipeline.append((task) => {
            const input = (task.output = task.input);
            input.forEach((item) => {
                if (item.uuid.indexOf('.json') >= 0) {
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
