'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var path = require('path');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);

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

let excludes = [];
let rootPath = '';
const packSubKeys = {};
function getAllPackDir(texturePath) {
    const dirs = fs__default["default"].readdirSync(texturePath);
    return dirs.filter((dir) => {
        if (!excludes.includes(dir) && fs__default["default"].existsSync(path__default["default"].resolve(texturePath, `${dir}/auto-atlas.pac`)))
            return true;
    });
}
function setSubKey(texturePath) {
    getAllPackDir(texturePath).forEach((dir) => {
        if (packSubKeys[dir])
            throw new Error(`atlas repeat: ${texturePath}/${dir}}`);
        const files = fs__default["default"].readdirSync(path__default["default"].resolve(texturePath, dir));
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
const defaultOptions = {
    texturePath: ['assets/texture'],
    spriteConfigPath: 'config/sprite.config.json',
    excludes: [],
};
function createSpriteConfig(options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!options.rootPath) {
            throw new Error('please provide the rootPath parameter');
        }
        options = Object.assign(Object.assign({}, defaultOptions), options);
        rootPath = options.rootPath;
        let spriteConfigPath = path__default["default"].resolve(rootPath, options.spriteConfigPath);
        excludes = options.excludes;
        for (let i = 0; i < options.texturePath.length; i++) {
            const texturePath = options.texturePath[i];
            setSubKey(path__default["default"].resolve(rootPath, texturePath));
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
            const atlasName = name.length === 17 ? (name + '_prolong') : name;
            spriteConfig.spriteConfig[atlasName] = {
                keys: packSubKeys[name],
            };
        });
        fs__default["default"].mkdirSync(spriteConfigPath.slice(0, spriteConfigPath.lastIndexOf('/')), { recursive: true });
        fs__default["default"].writeFileSync(spriteConfigPath, JSON.stringify(spriteConfig, null, 2));
        console.log('sprite.config.json updated');
    });
}

exports.createSpriteConfig = createSpriteConfig;
