type CreateSpriteConfigOptions = {
    /** 
     * the root path of project.
     */
    rootPath: string;
    /** 
     * the textures relative path.
     * @Defaults: assets/resources/texture
     */
    texturePath?: string;
    /** 
     * the sprite config relative path.
     * @Defaults: config/sprite.config.json
     */
    spriteConfigPath?: string;
    /** 
     * the folders name don't want replace remote atlas.
     * @Defaults: []
     */
    excludes?: string[];
}

import fs from 'fs';
import path from 'path';

let excludes = [];
const packSubKeys = {};

function setSubKey(texturePath: string) {
	const dirs = fs.readdirSync(texturePath);
	dirs.forEach((dir: string) => {
		if (excludes.includes(dir) || !fs.existsSync(path.resolve(texturePath, `${dir}/auto-atlas.pac`))) return;
        const stat = fs.lstatSync(path.resolve(texturePath, dir));
        if (stat.isDirectory() ) {
			packSubKeys[dir] = {};
            const files = fs.readdirSync(path.resolve(texturePath, dir));
			const images = []
			files.forEach((file: string) => {
				if (file.indexOf('.meta') < 0 && file.indexOf('.pac') < 0 && file.indexOf('.DS') < 0) {
					if (/\s/.test(file)) throw new Error(`[setSubKey]the file name can not contain space: ${dir}/${file}`)
					file = file.split('.')[0];
					images.push(file)
				}
			})
			packSubKeys[dir] = images.join(',');
        }
    })
}

export function createSpriteConfig(options: CreateSpriteConfigOptions) {
    if (!options.rootPath) {
        throw new Error('please provide the rootPath parameter');
    }
    const rootPath = options.rootPath;
    let texturePath = path.resolve(rootPath, 'assets/resources/texture');
    if (options.texturePath) texturePath = options.texturePath;
    let spriteConfigPath = path.resolve(rootPath, 'config/sprite.config.json');
    if (options.spriteConfigPath) spriteConfigPath = options.spriteConfigPath;
    if (options.excludes) excludes = options.excludes;
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
		const group = (spriteConfig.spriteConfig[name] = {}) as { keys: string };
		group.keys = packSubKeys[name].split(',');
	})
    if (!fs.existsSync(spriteConfigPath)) fs.mkdirSync(spriteConfigPath.slice(0, spriteConfigPath.lastIndexOf('/')));
    fs.writeFileSync(spriteConfigPath, JSON.stringify(spriteConfig, null, 2));
    console.log('sprite.config.json updated');
}

