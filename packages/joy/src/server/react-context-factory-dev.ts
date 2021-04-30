import { EntryType, Injectable } from "@symph/core";
import { ReactContextFactory } from "../next-server/server/react-context-factory";
import { JoyReactAppServerDevConfig } from "../next-server/lib/joy-react-app-server-dev-config";

@Injectable()
export class ReactContextFactoryDev extends ReactContextFactory {
  protected getReactAppProviderConfig(): EntryType[] {
    return [JoyReactAppServerDevConfig];
  }
}
