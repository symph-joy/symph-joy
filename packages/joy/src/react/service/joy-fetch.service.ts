export abstract class JoyFetchService {
  static regHttpPrefix = new RegExp(`^https?:\/\/`, "i");
  static regHostPrefix = new RegExp(`^\/\/`, "i");

  public abstract fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;

  public fetchApi(path: string, init?: RequestInit): Promise<Response> {
    const url = this.getFullUrl(path);
    return this.fetch(url, init);
  }

  public fetchModuleApi(moduleMount: string, path: string, init?: RequestInit): Promise<Response> {
    return this.fetch(this.getFullUrl(path, moduleMount), init);
  }

  public abstract getFullUrl(pathOrUrl: string, mount?: string): string;
}
