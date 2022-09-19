'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var path = require('path');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);

let excludes = [];
const packSubKeys = {};
function setSubKey(texturePath) {
    const dirs = fs__default["default"].readdirSync(texturePath);
    dirs.forEach((dir) => {
        if (excludes.includes(dir) || !fs__default["default"].existsSync(path__default["default"].resolve(texturePath, `${dir}/auto-atlas.pac`)))
            return;
        const stat = fs__default["default"].lstatSync(path__default["default"].resolve(texturePath, dir));
        if (stat.isDirectory()) {
            packSubKeys[dir] = {};
            const files = fs__default["default"].readdirSync(path__default["default"].resolve(texturePath, dir));
            const images = [];
            files.forEach((file) => {
                if (file.indexOf('.meta') < 0 && file.indexOf('.pac') < 0 && file.indexOf('.DS') < 0) {
                    if (/\s/.test(file))
                        throw new Error(`[setSubKey]the file name can not contain space: ${dir}/${file}`);
                    file = file.split('.')[0];
                    images.push(file);
                }
            });
            packSubKeys[dir] = images.join(',');
        }
    });
}
function createSpriteConfig(options) {
    if (!options.rootPath) {
        throw new Error('please provide the rootPath parameter');
    }
    const rootPath = options.rootPath;
    let texturePath = path__default["default"].resolve(rootPath, 'assets/resources/texture');
    if (options.texturePath)
        texturePath = options.texturePath;
    let spriteConfigPath = path__default["default"].resolve(rootPath, 'config/sprite.config.json');
    if (options.spriteConfigPath)
        spriteConfigPath = options.spriteConfigPath;
    if (options.excludes)
        excludes = options.excludes;
    setSubKey(texturePath);
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
        const group = (spriteConfig.spriteConfig[name] = {});
        group.keys = packSubKeys[name].split(',');
    });
    if (!fs__default["default"].existsSync(spriteConfigPath))
        fs__default["default"].mkdirSync(spriteConfigPath.slice(0, spriteConfigPath.lastIndexOf('/')));
    fs__default["default"].writeFileSync(spriteConfigPath, JSON.stringify(spriteConfig, null, 2));
    console.log('sprite.config.json updated');
}

exports.createSpriteConfig = createSpriteConfig;
