export declare class RemoteImagePlugin {
    private options;
    private promiseCache;
    constructor(options: IRemoteImagePluginOptions);
    apply(compiler: any): void;
    generateUuidMap(): Promise<IUuidMap>;
    setUuidMap(compiler: any): void;
}
