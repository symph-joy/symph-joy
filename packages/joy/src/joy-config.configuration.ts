import { NodeConfigConfiguration } from "@symph/config";

export class JoyConfigConfiguration extends NodeConfigConfiguration {
  protected isAutoLoadConfig(): boolean {
    return false;
  }
}
