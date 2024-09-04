import fs from 'fs';
import glob from 'glob';
import p from 'path';
import { consoleError, decodeUuid } from './commonTool';

/** 查找路径 */
const findPath = async (path: string, buildPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    glob(path, { cwd: buildPath }, (err, matches) => {
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
};

let configMap = {};
async function getConfig(bundleName: string, buildPath: string) {
  if (configMap[bundleName]) return configMap[bundleName];
  const path = await findPath(`assets/${bundleName}/config.*.json`, buildPath);
  const file = fs.readFileSync(p.resolve(buildPath, path), { encoding: 'utf-8' });
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
}

export async function getPackInfo(name: string, bundleName: string, texturePath: string, buildPath: string): Promise<IPackInfo> {
  const config = await getConfig(bundleName, buildPath);
  const files = fs.readdirSync(p.resolve(texturePath, `${name}`));
  const images = [];
  files.forEach((fileName) => {
    if (fileName.indexOf('.meta') >= 0 && fileName.indexOf('.pac') < 0) {
      const imageMetaContent = JSON.parse(fs.readFileSync(p.resolve(texturePath, `${name}/${fileName}`), 'utf-8'));
      images.push({
        uuid: imageMetaContent.uuid,
        name: fileName.split('.')[0],
        index: config.uuids.indexOf(imageMetaContent.uuid + '@f9941'),
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
    } else {
      imageMap[image.name] = image.uuid;
    }
  });
  if (!packUuids.length) {
    consoleError(`can't found atlas json, make sure you have use these images; atlas folder: ${name}`);
  }
  return { uuid: packUuids[0], imageMap };
}

export async function getPackPath(packUuid: string, bundleName: string, buildPath: string) {
  const config = await getConfig(bundleName, buildPath);
  const versionIndex = config.versions.import.indexOf(packUuid);
  const version = config.versions.import[versionIndex + 1];
  const packPath = `assets/${bundleName}/import/${packUuid.slice(0, 2)}/${packUuid}.${version}.json`;
  return p.resolve(buildPath, packPath);
}
