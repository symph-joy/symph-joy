import { getMount } from "../../joy-server/lib/mount.decorator";
import { ReactComponent } from "@symph/react";
import { JoyFetchService } from "./joy-fetch.service";
import { Autowire } from "@symph/core";

@ReactComponent()
export class JoyModuleFetchService {
  constructor(@Autowire("joyFetchService") public joyFetchService: JoyFetchService) {}

  public getMount(): string {
    return getMount((this as any).constructor) || "";
  }

  public fetchApi(path: string, init?: RequestInit): Promise<Response> {
    return this.joyFetchService.fetchApi(path, init);
  }

  public fetchModuleApi(path: string, init?: RequestInit): Promise<Response> {
    return this.joyFetchService.fetchModuleApi(this.getMount(), path, init);
  }
}
