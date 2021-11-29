import { JoyApplicationOptions } from "./interfaces";
import { ApplicationContainer, CoreFactoryImplement } from "@symph/core";
import { ReactApplicationConfiguration } from "./react-application.configuration";
import { ReactApplicationContext } from "./react-application-context";
import { ReactApplicationConfig } from "./react-application-config";

export class ReactApplicationFactoryImplement extends CoreFactoryImplement {
  public async create(
    reactApplicationConfig: typeof ReactApplicationConfiguration = ReactApplicationConfiguration,
    options?: JoyApplicationOptions,
    entryModule?: Record<string, any>
  ): Promise<ReactApplicationContext> {
    this.applyLogger(options);
    const applicationConfig = new ReactApplicationConfig();
    const container = new ApplicationContainer();
    const application = new ReactApplicationContext(ReactApplicationConfiguration, applicationConfig);
    await this.initContext(application);
    if (entryModule) {
      application.registerModule(entryModule);
    }
    return application;
  }
}

export const ReactApplicationFactory = new ReactApplicationFactoryImplement();
