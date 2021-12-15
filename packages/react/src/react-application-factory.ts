import { JoyApplicationOptions } from "./interfaces";
import { CoreFactoryImplement } from "@symph/core";
import { ReactApplicationConfiguration } from "./react-application.configuration";
import { ReactApplicationContext } from "./react-application-context";

export class ReactApplicationFactoryImplement extends CoreFactoryImplement {
  public async create(
    ReactApplicationConfig: typeof ReactApplicationConfiguration = ReactApplicationConfiguration,
    options?: JoyApplicationOptions & { initState?: Record<string, any> },
    entryModule?: Record<string, any>
  ): Promise<ReactApplicationContext> {
    const { initState, ...appOptions } = options || {};
    this.applyLogger(appOptions);
    const application = new ReactApplicationContext(ReactApplicationConfig, initState);
    await this.initContext(application);
    if (entryModule) {
      application.registerModule(entryModule);
    }
    return application;
  }
}

export const ReactApplicationFactory = new ReactApplicationFactoryImplement();
