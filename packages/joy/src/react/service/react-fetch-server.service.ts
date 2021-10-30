import { Component, RuntimeException } from "@symph/core";
import { JoyAppConfig } from "../../joy-server/server/joy-app-config";
import { ReactFetchService } from "./react-fetch.service";

@Component()
export class ReactFetchServerService extends ReactFetchService {
  constructor(public joyAppConfig: JoyAppConfig) {
    super();
  }

  async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    if (typeof input === "string") {
      input = this.getFullUrl(input);
    } else {
      input = new Request({ ...input, url: this.getFullUrl(input.url) });
    }

    if (typeof global.fetch === "undefined") {
      throw new RuntimeException("Current version node did not support global.fetch method。");
    }
    return global.fetch(input, init);
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
    return `http://localhost:${this.joyAppConfig.port}${this.joyAppConfig.basePath}${this.joyAppConfig.getGlobalPrefix()}${mount}${pathOrUrl}`;
  }
}
