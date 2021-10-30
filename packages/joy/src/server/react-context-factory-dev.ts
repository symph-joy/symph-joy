import { EntryType, Component } from "@symph/core";
import { ReactContextFactory } from "../react/react-context-factory";
import { JoyReactAppServerDevConfiguration } from "../react/joy-react-app-server-dev.configuration";

@Component()
export class ReactContextFactoryDev extends ReactContextFactory {
  protected getReactAppProviderConfig(): EntryType[] {
    return [JoyReactAppServerDevConfiguration];
  }
}
