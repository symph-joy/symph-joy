import { RuntimeException } from "@symph/core";
import { ReactComponent } from "@symph/react";
import { JoyFetchService } from "./joy-fetch.service";

@ReactComponent()
export class JoyFetchClientService extends JoyFetchService {
  static regHttpPrefix = new RegExp(`^https?:\/\/`, "i");
  static regHostPrefix = new RegExp(`^\/\/`, "i");

  public async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    if (typeof window === "undefined" || typeof window.fetch === "undefined") {
      throw new RuntimeException("Current runtime version did not support window.fetch method。");
    }
    return window.fetch(input, init);
  }

  public getFullUrl(pathOrUrl: string, mount = ""): string {
    if (JoyFetchService.regHttpPrefix.test(pathOrUrl)) {
      return pathOrUrl;
    }
    if (JoyFetchService.regHostPrefix.test(pathOrUrl)) {
      return `${window.location.protocol}${pathOrUrl}`;
    }
    if (pathOrUrl[0] !== "/") {
      throw new RuntimeException('Url path must start with "/", it should be a absolute path.');
    }
    // todo add client basePath
    return `${window.location.origin}${mount}${pathOrUrl}`;
  }
}
