import { JoyApplicationOptions } from "./interfaces";
import { CoreContainer, CoreFactoryImplement } from "@symph/core";
import { ReactApplicationConfig } from "./react-application-config";
import { ReactApplicationContext } from "./react-application-context";
import { ApplicationConfig } from "./application-config";

export class ReactApplicationFactoryImplement extends CoreFactoryImplement {
  public async create(reactApplicationConfig: typeof ReactApplicationConfig = ReactApplicationConfig, options?: JoyApplicationOptions, entryModule?: Record<string, any>): Promise<ReactApplicationContext> {
    this.applyLogger(options);
    const applicationConfig = new ApplicationConfig();
    const container = new CoreContainer();
    const application = new ReactApplicationContext(ReactApplicationConfig, applicationConfig, container);
    await this.initContext(application);
    if (entryModule) {
      application.registerModule(entryModule);
    }
    return application;
  }
}

export const ReactApplicationFactory = new ReactApplicationFactoryImplement();
