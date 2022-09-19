import { resources, assetManager, Asset, Rect, Vec2, Size } from 'cc';
import { BUILD } from 'cc/env';

class RemoteAtlasUtil {
    constructor(options = {}) {
        this.atlasUrlMap = {};
        this.imageUrlMap = {};
        this.imageUrlCache = {};
        this.uuidMap = {};
        if (!BUILD)
            return;
        this.texturePath = options.texturePath || 'texture';
        this.hackDownloader();
        this.hackPipeline();
    }
    setRemoteUrl(name, atlasUrl, imageUrl) {
        if (!BUILD)
            return;
        const info = resources.getInfoWithPath(`${this.texturePath}/${name}/auto-atlas`);
        if (!info || !info.packs) {
            console.warn(`[RemoteAtlasUtil.setRemoteUrl]can\'t found the auto-atlas file.(name: ${name})`);
            return;
        }
        const packUUid = info.packs[0].uuid;
        this.uuidMap[packUUid] = name;
        this.imageUrlCache[packUUid] = imageUrl;
        this.atlasUrlMap[name + '.json'] = atlasUrl;
    }
    setSingleImageUrl(imageRelativePath, url) {
        if (!BUILD)
            return;
        const info = resources.getInfoWithPath(`${this.texturePath}/${imageRelativePath}`);
        if (!info) {
            console.warn(`[RemoteAtlasUtil.setSingleImageUrl]can\'t found the spriteFrame file.(name: ${name})`);
            return;
        }
        const uuid = info.uuid;
        this.imageUrlMap[uuid] = url;
    }
    hackDownloader() {
        const oldJsonDownloader = assetManager.downloader['_downloaders']['.json'];
        assetManager.downloader.register('.json', (url, options, onComplete) => {
            const newOnComplete = (err, data) => {
                if (!err && data) {
                    const pathname = url.slice(url.lastIndexOf('/') + 1);
                    const uuid = pathname.slice(0, pathname.indexOf('.'));
                    if (this.uuidMap[uuid]) {
                        const imageUrl = this.imageUrlCache[uuid];
                        this.imageUrlMap[data[1][0].split('@')[0]] = imageUrl;
                        data[1].push(this.uuidMap[uuid] + '.json');
                        data[2].push('_depends');
                        data[5].forEach((ins) => {
                            ins[3].push(0);
                            ins[4].push(1);
                            ins[5].push(1);
                        });
                    }
                }
                onComplete(err, data);
            };
            oldJsonDownloader(url, options, newOnComplete);
        });
    }
    hackPipeline() {
        assetManager.transformPipeline.append((task) => {
            const input = task.output = task.input;
            input.forEach((item) => {
                if (item.uuid.indexOf('.json') >= 0) {
                    item.url = this.atlasUrlMap[item.uuid];
                    item.ext = '.sa';
                    item.isNative = true;
                    item.options.uuid = item.uuid;
                }
                else if (this.imageUrlMap[item.uuid]) {
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
                const assetInfo = resources.getInfoWithPath(`${this.texturePath}/${name}/${key}/spriteFrame`);
                if (!assetInfo)
                    return;
                const uuid = assetInfo.uuid;
                let spriteFrame = assetManager.assets.get(uuid);
                if (!spriteFrame) {
                    const file = assetManager['_files'].get(`${uuid}@import`);
                    if (file) {
                        spriteFrame = file[5][0];
                        file[1][1] && file[1].pop();
                        file[2][1] && file[2].pop();
                        file[8][1] && file[8].pop();
                        file[9][1] && file[9].pop();
                        file[10][1] && file[10].pop();
                    }
                }
                if (!spriteFrame)
                    return;
                if (spriteFrame.originalSize && spriteFrame.originalSize.width === originalSize.width)
                    return;
                spriteFrame.rect = rect;
                spriteFrame.offset = offset;
                spriteFrame.originalSize = originalSize;
                spriteFrame.rotated = false;
            });
        });
    }
}

export { RemoteAtlasUtil as default };
