declare type RemoteAtlasUtilOptions = {
    texturePath?: string;
};
export default class RemoteAtlasUtil {
    constructor(options?: RemoteAtlasUtilOptions);
    private texturePath;
    private atlasUrlMap;
    private imageUrlMap;
    private imageUrlCache;
    private uuidMap;
    setRemoteUrl(name: string, atlasUrl: string, imageUrl: string): void;
    setSingleImageUrl(imageRelativePath: string, url: string): void;
    private hackDownloader;
    private hackPipeline;
}
export {};
