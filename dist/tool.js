'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var p = require('path');
var glob = require('glob');
var HtmlWebpackPlugin = require('html-webpack-plugin');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var p__default = /*#__PURE__*/_interopDefaultLegacy(p);
var glob__default = /*#__PURE__*/_interopDefaultLegacy(glob);
var HtmlWebpackPlugin__default = /*#__PURE__*/_interopDefaultLegacy(HtmlWebpackPlugin);

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

const HexChars = '0123456789abcdef'.split('');
const _t = ['', '', '', ''];
const UuidTemplate = _t.concat(_t, '-', _t, '-', _t, '-', _t, '-', _t, _t, _t);
const Indices = UuidTemplate.map((x, i) => (x === '-' ? NaN : i)).filter(isFinite);
const BASE64_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const BASE64_VALUES = new Array(123); // max char code in base64Keys
for (let i = 0; i < 123; ++i) {
    BASE64_VALUES[i] = 64;
} // fill with placeholder('=') index
for (let i = 0; i < 64; ++i) {
    BASE64_VALUES[BASE64_KEYS.charCodeAt(i)] = i;
}
function decodeUuid(base64) {
    const strs = base64.split('@');
    const uuid = strs[0];
    if (uuid.length !== 22) {
        return base64;
    }
    UuidTemplate[0] = base64[0];
    UuidTemplate[1] = base64[1];
    for (let i = 2, j = 2; i < 22; i += 2) {
        const lhs = BASE64_VALUES[base64.charCodeAt(i)];
        const rhs = BASE64_VALUES[base64.charCodeAt(i + 1)];
        UuidTemplate[Indices[j++]] = HexChars[lhs >> 2];
        UuidTemplate[Indices[j++]] = HexChars[((lhs & 3) << 2) | rhs >> 4];
        UuidTemplate[Indices[j++]] = HexChars[rhs & 0xF];
    }
    return base64.replace(uuid, UuidTemplate.join(''));
}
function consoleError(msg) {
    console.log('\x1B[31m%s\x1B[0m', msg);
}

/** 查找路径 */
const findPath = (path, buildPath) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        glob__default["default"](path, { cwd: buildPath }, (err, matches) => {
            if (err) {
                return reject(err);
            }
            if (matches.length > 1) {
                return reject('found path more than 1,' + matches.join(','));
            }
            if (matches.length === 0) {
                return reject(`can't found path: ${path}`);
            }
            resolve(matches[0]);
        });
    });
});
let configMap = {};
function getConfig(bundleName, buildPath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (configMap[bundleName])
            return configMap[bundleName];
        const path = yield findPath(`assets/${bundleName}/config.*.json`, buildPath);
        const file = fs__default["default"].readFileSync(p__default["default"].resolve(buildPath, path), { encoding: 'utf-8' });
        const content = JSON.parse(file);
        content.uuids.forEach((uuid, i) => {
            content.uuids[i] = decodeUuid(uuid);
        });
        for (const folder in content.versions) {
            const entries = content.versions[folder];
            for (let i = 0; i < entries.length; i += 2) {
                const uuid = entries[i];
                entries[i] = content.uuids[uuid] || uuid;
            }
        }
        configMap[bundleName] = content;
        return content;
    });
}
function getPackInfo(name, bundleName, texturePath, buildPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield getConfig(bundleName, buildPath);
        const files = fs__default["default"].readdirSync(p__default["default"].resolve(texturePath, `${name}`));
        const images = [];
        files.forEach((fileName) => {
            if (fileName.indexOf('.meta') >= 0 && fileName.indexOf('.pac') < 0) {
                const imageMetaContent = JSON.parse(fs__default["default"].readFileSync(p__default["default"].resolve(texturePath, `${name}/${fileName}`), 'utf-8'));
                images.push({
                    uuid: imageMetaContent.uuid,
                    name: fileName.split('.')[0],
                    index: config.uuids.indexOf(imageMetaContent.uuid + '@f9941') + '',
                });
            }
        });
        let packUuids = [];
        const imageMap = {};
        Object.keys(config.packs).forEach((uuid) => {
            const packIndexList = config.packs[uuid];
            images.forEach((image) => {
                if (packIndexList.indexOf(image.index) >= 0) {
                    packUuids.indexOf(uuid) < 0 && packUuids.push(uuid);
                    if (packUuids.length > 1) {
                        throw new Error(`image pack into different atlas; packUuid:${packUuids.join(',')}; image:${image.name}`);
                    }
                    image.packUuids = image.packUuids || [];
                    image.packUuids.push(uuid);
                }
            });
        });
        images.forEach((image) => {
            if (image.index < 0 || !image.packUuids) {
                consoleError(`can't found image, make sure you have use this images: ${image.name}`);
            }
            else {
                imageMap[image.name] = image.uuid;
            }
        });
        if (!packUuids.length) {
            consoleError(`can't found atlas json, make sure you have use these images; atlas folder: ${name}`);
        }
        return { uuid: packUuids[0], imageMap };
    });
}
function getPackPath(packUuid, bundleName, buildPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield getConfig(bundleName, buildPath);
        const versionIndex = config.versions.import.indexOf(packUuid);
        const version = config.versions.import[versionIndex + 1];
        const packPath = `assets/${bundleName}/import/${packUuid.slice(0, 2)}/${packUuid}.${version}.json`;
        return p__default["default"].resolve(buildPath, packPath);
    });
}

let excludes = [];
let rootPath = '';
const packSubKeys = {};
function getAllPackDir(texturePath) {
    const dirs = fs__default["default"].readdirSync(texturePath);
    return dirs.filter((dir) => {
        if (!excludes.includes(dir) && fs__default["default"].existsSync(p__default["default"].resolve(texturePath, `${dir}/auto-atlas.pac`)))
            return true;
    });
}
function setSubKey(texturePath) {
    getAllPackDir(texturePath).forEach((dir) => {
        if (packSubKeys[dir])
            throw new Error(`atlas repeat: ${texturePath}/${dir}}`);
        const files = fs__default["default"].readdirSync(p__default["default"].resolve(texturePath, dir));
        const images = [];
        files.forEach((file) => {
            if (file.indexOf('.meta') >= 0 && file.indexOf('.pac') < 0) {
                if (/\s/.test(file))
                    throw new Error(`the file name can not contain space: ${dir}/${file}`);
                file = file.split('.')[0];
                images.push(file);
            }
        });
        packSubKeys[dir] = images;
    });
}
function removeUselessImage(texturePath, bundles, buildPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const promises = bundles.map((bundle) => {
            if (bundle.texturePath.includes(texturePath)) {
                const absPath = p__default["default"].resolve(rootPath, texturePath);
                const promises = getAllPackDir(absPath).map((dir) => {
                    return getPackInfo(dir, bundle.name, absPath, buildPath).then(((info) => {
                        if (packSubKeys[dir])
                            throw new Error(`atlas repeat: ${texturePath}/${dir}}`);
                        packSubKeys[dir] = Object.keys(info.imageMap);
                    }));
                });
                return Promise.all(promises);
            }
        });
        yield Promise.all(promises);
    });
}
const defaultOptions$1 = {
    texturePath: ['assets/texture'],
    spriteConfigPath: 'config/sprite.config.json',
    excludes: [],
    removeUselessImageConfig: {
        bundles: [{ name: 'resources', texturePath: ['assets/texture'] }],
        buildPath: 'build/web-mobile',
    },
};
function createSpriteConfig(options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!options.rootPath) {
            throw new Error('please provide the rootPath parameter');
        }
        options = Object.assign(Object.assign({}, defaultOptions$1), options);
        rootPath = options.rootPath;
        let spriteConfigPath = p__default["default"].resolve(rootPath, options.spriteConfigPath);
        excludes = options.excludes;
        for (let i = 0; i < options.texturePath.length; i++) {
            const texturePath = options.texturePath[i];
            if (options.removeUselessImageConfig) {
                const config = options.removeUselessImageConfig;
                yield removeUselessImage(texturePath, config.bundles, config.buildPath);
            }
            else {
                setSubKey(p__default["default"].resolve(rootPath, texturePath));
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
        fs__default["default"].mkdirSync(spriteConfigPath.slice(0, spriteConfigPath.lastIndexOf('/')), { recursive: true });
        fs__default["default"].writeFileSync(spriteConfigPath, JSON.stringify(spriteConfig, null, 2));
        console.log('sprite.config.json updated');
    });
}

function getAllPackName(texturePath) {
    const dirs = fs__default["default"].readdirSync(texturePath);
    const res = [];
    dirs.forEach((dir) => {
        const stat = fs__default["default"].lstatSync(p__default["default"].resolve(texturePath, dir));
        if (stat.isDirectory()) {
            res.push(dir);
        }
    });
    return res;
}
let uuidMap = {
    atlas: {},
    single: {},
};
function updatePack(name, bundleName, texturePath, buildPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const packInfo = yield getPackInfo(name, bundleName, texturePath, buildPath);
        const packPath = yield getPackPath(packInfo.uuid, bundleName, buildPath);
        const packContent = JSON.parse(fs__default["default"].readFileSync(packPath, { encoding: 'utf-8' }));
        const pngUuid = packContent[1][0];
        uuidMap.atlas[name] = {
            uuid: pngUuid.split('@')[0],
            imageMap: packInfo.imageMap,
        };
        packContent[1].push(`${name}.json`); // 添加依赖uuid
        packContent[2].push('__depends'); // 添加依赖属性
        const instances = packContent[5];
        instances.forEach((instance) => {
            instance[3].push(0); // dependObj
            instance[4].push(1); // dependKey
            instance[5].push(1); // dependUuid
            const property = instance[0][0]; // 图片属性
            delete property.rect;
            delete property.offset;
            delete property.originalSize;
            property.rotated = false;
        });
        fs__default["default"].writeFileSync(packPath, JSON.stringify(packContent));
    });
}
function saveUuidMap(dirPath) {
    const files = fs__default["default"].readdirSync(dirPath);
    files.forEach((file) => {
        if (file.indexOf('.meta') > -1) {
            const name = file.split('.')[0];
            const content = fs__default["default"].readFileSync(p__default["default"].resolve(dirPath, file), 'utf-8');
            const data = JSON.parse(content);
            uuidMap.single[name] = data.uuid;
        }
    });
}
function getUuidMap() {
    return uuidMap;
}
function updateAllPack(bundleName, texturePath, excludes, buildPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const packs = getAllPackName(texturePath);
        const promises = [];
        packs.forEach((packName) => {
            if (excludes.includes(packName))
                return;
            if (!fs__default["default"].existsSync(p__default["default"].resolve(texturePath, `${packName}/auto-atlas.pac`))) {
                saveUuidMap(p__default["default"].resolve(texturePath, packName));
            }
            else {
                promises.push(updatePack(packName, bundleName, texturePath, buildPath));
            }
        });
        yield Promise.all(promises);
    });
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
class RemoteImagePlugin {
    constructor(options) {
        if (!options.rootPath)
            throw new Error('[RemoteImagePlugin] params: projectRootPath can not empty!');
        this.options = Object.assign(Object.assign({}, defaultOptions), options);
    }
    apply(compiler) {
        this.setUuidMap(compiler);
    }
    generateUuidMap() {
        if (this.promiseCache)
            return this.promiseCache;
        const { rootPath, bundles, excludes, buildPath } = this.options;
        const promises = [];
        bundles.forEach((bundle) => {
            if (!Array.isArray(bundle.texturePath))
                bundle.texturePath = [bundle.texturePath];
            bundle.texturePath.forEach((texturePath) => {
                const textureAbsPath = p__default["default"].resolve(rootPath, texturePath);
                promises.push(updateAllPack(bundle.name, textureAbsPath, excludes, buildPath));
            });
        });
        this.promiseCache = Promise.all(promises).then(() => {
            return getUuidMap();
        });
    }
    setUuidMap(compiler) {
        compiler.hooks.compilation.tap('RemoteImagePlugin', (compilation) => {
            HtmlWebpackPlugin__default["default"].getHooks(compilation).beforeEmit.tapAsync('RemoteImagePlugin', (htmlPluginData, cb) => {
                this.generateUuidMap().then((uuidMap) => {
                    const uuidMapScript = `<script>window.uuidMap=${JSON.stringify(uuidMap)}</script>`;
                    const html = htmlPluginData.html;
                    const insertIndex = html.indexOf('<body>') + 6;
                    htmlPluginData.html = html.slice(0, insertIndex) + uuidMapScript + html.slice(insertIndex);
                    cb(null, htmlPluginData);
                }).catch((e) => {
                    cb(e);
                });
            });
        });
    }
}

exports.RemoteImagePlugin = RemoteImagePlugin;
exports.createSpriteConfig = createSpriteConfig;
