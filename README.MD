# cocos-remote-atlas-util

This is a tool to replace the remote atlas/image in the cocos engine.

### Install

```bash
npm install --save @game-engine/cocos-remote-atlas-util
```

### Usages

```bash
import RemoteAtlasUtil from '@game-engine/cocos-remote-atlas-util';

const remoteAtlasUtil = new RemoteAtlasUtil();
// set remote atlas image
remoteAtlasUtil.setRemoteUrl(atlasDirName, atlasJsonRemoteUrl, atlasImageRemoteUrl);
// set single remote image
remoteAtlasUtil.setSingleImageUrl(imageRelativePath, remoteUrl);
```

### Sprite config tool

```bash
const { createSpriteConfig } = require('@game-engine/cocos-remote-atlas-util/dist/tool');
const path = require('path');

createSpriteConfig({
    // the root path of project.
    rootPath: path.resolve(__dirname, '../'),
    // the textures relative path. [Optional]
    texturePath: 'assets/resources/texture',
    // the sprite config relative path. [Optional]
    spriteConfigPath: 'config/sprite.config.json',
    // the folders name do not want replace remote atlas. [Optional]
    excludes: ['static']
});
```

### Important

1. Make sure that set url before you load it!
2. All image need to put it into "resources/texture" folder. Or you can change the texturePath parameter.
3. If you need to use an atlas, please create a file named "auto-atlas" and don't rename it.