interface IPackInfo {
  uuid: string;
  imageMap: Record<string, string>
}

interface IUuidMap {
  atlas: Record<string, string>;
  single: Record<string, string>;
}

interface Window {
  uuidMap: IUuidMap;
}
