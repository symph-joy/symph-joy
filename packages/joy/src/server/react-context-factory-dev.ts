import { EntryType, Injectable } from "@symph/core";
import { ReactContextFactory } from "../react/react-context-factory";
import { JoyReactAppServerDevConfig } from "../react/joy-react-app-server-dev-config";

@Injectable()
export class ReactContextFactoryDev extends ReactContextFactory {
  protected getReactAppProviderConfig(): EntryType[] {
    return [JoyReactAppServerDevConfig];
  }
}
