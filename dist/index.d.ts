declare type TAtlasUrlInfo = {
    params: string;
    paramsWebp: string;
    sprite: string;
    spriteWebp: string;
}[];
export default class RemoteImageUtil {
    static instance: RemoteImageUtil;
    static getInstance(): RemoteImageUtil;
    constructor();
    private atlasUrlMap;
    private imageUrlMap;
    private uuidMap;
    private isSupportWebp;
    setRemoteUrl(name: string, urlInfos: TAtlasUrlInfo, isUseWebp?: boolean): void;
    setSingleImageUrl(name: string, url: string): void;
    checkAllImageSetUrl(): {
        atlas: any[];
        single: any[];
    };
    private mockRemoteAtlasAsset;
    private hackPipeline;
}
export {};
