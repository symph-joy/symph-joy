import { RuntimeException } from "@symph/core";
import { ReactComponent } from "@symph/react";
import { ReactFetchService } from "./react-fetch.service";
import { JoyClientConfig } from "../../client/joy-client-config";

@ReactComponent()
export class ReactFetchClientService extends ReactFetchService {
  static regHttpPrefix = new RegExp(`^https?:\/\/`, "i");
  static regHostPrefix = new RegExp(`^\/\/`, "i");

  constructor(private joyClientConfig: JoyClientConfig) {
    super();
  }

  public async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    if (typeof window === "undefined" || typeof window.fetch === "undefined") {
      throw new RuntimeException("Current runtime version did not support window.fetch method。");
    }
    return window.fetch(input, init);
  }

  public getFullUrl(pathOrUrl: string, mount = ""): string {
    if (ReactFetchService.regHttpPrefix.test(pathOrUrl)) {
      return pathOrUrl;
    }
    if (ReactFetchService.regHostPrefix.test(pathOrUrl)) {
      return `${window.location.protocol}${pathOrUrl}`;
    }
    if (pathOrUrl[0] !== "/") {
      throw new RuntimeException('Url path must start with "/", it should be a absolute path.');
    }
    return `${window.location.origin}${this.joyClientConfig.apiPrefix}${mount}${pathOrUrl}`;
  }
}
