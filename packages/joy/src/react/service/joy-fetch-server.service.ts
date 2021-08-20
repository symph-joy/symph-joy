import { RuntimeException } from "@symph/core";
import { JoyAppConfig } from "../../joy-server/server/joy-app-config";
import { JoyFetchService } from "./joy-fetch.service";

const regHttp = new RegExp(`^https?:\/\/`, "i");
const regHost = new RegExp(`^\/\/`, "i");

export class JoyFetchServerService extends JoyFetchService {
  constructor(public joyAppConfig: JoyAppConfig) {
    super();
  }

  async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    if (typeof global.fetch === "undefined") {
      throw new RuntimeException("Current version node did not support global fetch method。");
    }
    if (typeof input === "string") {
      input = this.getAbsoluteUrl(input);
    } else {
      input = new Request({ ...input, url: this.getAbsoluteUrl(input.url) });
    }

    return global.fetch(input, init);
  }

  public getAbsoluteUrl(url: string): string {
    if (!regHttp.test(url)) {
      if (regHost.test(url)) {
        url = `http:${url}`;
      } else {
        if (url[0] !== "/") {
          throw new RuntimeException('Url path must start with "/", it should be a absolute path.');
        }
        url = `http://localhost:${this.joyAppConfig.port}${url}`;
      }
    }

    return url;
  }
}
