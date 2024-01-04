import fs from 'fs' ;
import p from 'path';
import { getPackPath, getPackInfo } from './getPackInfo';

function getAllPackName(texturePath) {
  const dirs = fs.readdirSync(texturePath);
  const res = [];
  dirs.forEach((dir) => {
    const stat = fs.lstatSync(p.resolve(texturePath, dir));
    if (stat.isDirectory()) {
      res.push(dir);
    }
  });
  return res;
}

let uuidMap: IUuidMap = {
  atlas: {},
  single: {},
};
async function updatePack(name: string, bundleName: string, texturePath: string, buildPath: string) {
  const packInfo = await getPackInfo(name, bundleName, texturePath, buildPath);
  const packPath = await getPackPath(packInfo.uuid, bundleName, buildPath);
  const packContent = JSON.parse(fs.readFileSync(packPath, { encoding: 'utf-8' }));
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
  fs.writeFileSync(packPath, JSON.stringify(packContent));
}

function saveUuidMap(dirPath) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    if (file.indexOf('.meta') > -1) {
      const name = file.split('.')[0];
      const content = fs.readFileSync(p.resolve(dirPath, file), 'utf-8');
      const data = JSON.parse(content);
      uuidMap.single[name] = data.uuid;
    }
  });
}

export function getUuidMap() {
  return uuidMap;
}

export async function updateAllPack(bundleName: string, texturePath: string, excludes: string[], buildPath: string): Promise<void> {
  const packs = getAllPackName(texturePath);
  const promises = [];
  packs.forEach((packName) => {
    if (excludes.includes(packName)) return;
    if (!fs.existsSync(p.resolve(texturePath, `${packName}/auto-atlas.pac`))) {
      saveUuidMap(p.resolve(texturePath, packName));
    } else {
      promises.push(updatePack(packName, bundleName, texturePath, buildPath));
    }
  });
  await Promise.all(promises);
}
